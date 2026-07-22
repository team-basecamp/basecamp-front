import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import useAuthStore from "../store/authStore";
import type { AxiosRequestConfig } from "axios";

/**
 * 백엔드(Spring Boot, localhost:8080)와 통신하기 위한 공용 axios 인스턴스.
 * src/api/ 아래 모든 API 함수는 이 인스턴스를 통해 요청을 보낸다.
 * baseURL은 .env의 VITE_API_BASE_URL이 없으면 "/api"로 대체된다.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const instance = axios.create({
  baseURL,
  timeout: 10000,
  // refresh 토큰이 HttpOnly 쿠키로 오가므로, cross-origin 요청에도 쿠키를 주고받도록 허용한다.
  // (백엔드는 CORS allowCredentials=true + 오리진 화이트리스트로 응답해야 함)
  withCredentials: true,
});

/**
 * 토큰 재발급 전용 클라이언트.
 * 재발급을 instance 로 호출하면, 그 요청이 401 일 때 아래 응답 인터셉터가 다시 재발급을 시도해 무한 루프가 된다.
 * 인터셉터가 붙지 않은 별도 클라이언트를 쓴다.
 */
const refreshClient = axios.create({ baseURL, timeout: 10000, withCredentials: true });

interface TokenRefreshResponse {
  accessToken: string;
  tokenType: string;
}

/**
 * 백엔드 공통 응답 봉투. 정상/오류 응답이 모두 이 구조로 내려온다.
 * - 성공: { success: true, message, data }
 * - 실패: { success: false, code, message, errors }
 */
export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message: string;
  data: T;
  errors?: { field: string; value: string; reason: string }[];
}

/**
 * refresh 토큰(HttpOnly 쿠키)으로 access 토큰을 재발급받는다.
 * 백엔드가 회전(rotation)시킨 새 refresh 토큰은 Set-Cookie 로 자동 교체되므로 여기서 다룰 것이 없다.
 *
 * refreshClient 에는 응답 인터셉터가 없어 봉투가 벗겨지지 않으므로, data 를 직접 꺼낸다.
 */
const requestRefreshToken = async () => {
  const res = await refreshClient.post<ApiResponse<TokenRefreshResponse>>("/v1/auth/token/refresh");
  return res.data.data.accessToken;
};

// 요청 인터셉터: 매 요청마다 authStore에 저장된 accessToken을 Authorization 헤더에 자동으로 실어보낸다.
instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * 재발급을 시도하면 안 되는 경로.
 * - 로그인: 아직 세션이 없으므로 재발급할 것이 없다.
 * - 재발급: refreshClient 로 나가지만, 혹시 instance 를 타더라도 자기 자신을 재귀 호출하지 않도록 막는다.
 */
const REFRESH_EXEMPT_PATHS = ["/v1/auth/login", "/v1/auth/token/refresh"];
const isRefreshExempt = (url?: string) =>
  !url || REFRESH_EXEMPT_PATHS.some((path) => url.includes(path));

/**
 * 여러 요청이 동시에 401을 받아도 재발급은 한 번만 수행하고 나머지는 그 결과를 기다린다.
 * 백엔드가 refresh 토큰을 회전시키므로, 같은 쿠키로 두 번 재발급하면 두 번째는 이미 폐기된 토큰이라
 * 탈취로 간주되어 401 이 나고 그대로 로그아웃된다.
 */
let refreshPromise: Promise<string> | null = null;

const refreshOnce = () => {
  refreshPromise ??= requestRefreshToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

const LOGIN_PATH = "/login";

const forceLogout = () => {
  useAuthStore.getState().logout();
  if (!window.location.pathname.startsWith(LOGIN_PATH)) {
    window.location.href = LOGIN_PATH;
  }
};

// 응답 인터셉터:
// - 백엔드가 모든 성공 응답을 { success, message, data } 봉투로 내려주므로, 실제 페이로드인 data 만 벗겨서 반환한다.
//   덕분에 각 api 함수는 예전처럼 순수 DTO 만 받는다(봉투를 몰라도 된다).
//   봉투가 없는 응답(204 No Content 등)은 그대로 통과시킨다.
// - 401(access 토큰 만료) 응답을 받으면 refresh 토큰으로 재발급을 한 번 시도하고 원요청을 재시도한다.
//   재발급까지 실패하면(=refresh 만료/폐기/탈취 의심) 로그아웃 후 로그인 화면으로 보낸다.
instance.interceptors.response.use(
  (res) => {
    // res.data 는 any 다. 봉투면 data 만, 아니면(204 등) 그대로 반환한다.
    const body = res.data;
    if (body && typeof body === "object" && "success" in body) {
      return body.data;
    }
    return body;
  },
  async (err: AxiosError) => {
    const original = err.config as RetriableConfig | undefined;
    const hadSession = useAuthStore.getState().accessToken !== null;

    // 재발급으로 해소될 수 있는 인증 실패:
    // - 401: access 토큰 만료.
    // - 403 A007(BLACKLISTED_USER): 회원 단위로 무효화된 토큰. 관리자 승격(#53) 직후가 대표적이다 —
    //   현재 토큰은 아직 CUSTOMER 라 revoke 목록에 걸리지만, 재발급은 서버가 DB role 을 다시 읽어
    //   CAMP_OWNER 토큰을 내주므로 원요청이 통과한다(useRole 이 토큰에서 role 을 읽어 헤더 메뉴까지 최신화된다).
    //   반대로 진짜 제재된 회원은 재발급 자체가 403(BLACKLISTED_USER)으로 막혀 아래 catch 에서 로그아웃된다.
    const code = (err.response?.data as { code?: string } | undefined)?.code;
    const isRefreshable =
      err.response?.status === 401 || (err.response?.status === 403 && code === "A007");

    const canRetry =
      isRefreshable &&
      original !== undefined &&
      !original._retry &&
      !isRefreshExempt(original.url) &&
      hadSession;

    if (!canRetry) {
      // 재시도 후에도 인증 실패거나, 애초에 재발급 대상이 아닌 401/403(A007) → 세션이 있었다면 정리한다.
      if (isRefreshable && hadSession) forceLogout();
      return Promise.reject(err);
    }

    original._retry = true;
    try {
      // 스토어에 먼저 반영해야 재요청 시 요청 인터셉터가 새 토큰을 실어보낸다.
      useAuthStore.getState().setAccessToken(await refreshOnce());
      return await instance(original);
    } catch (refreshError) {
      forceLogout();
      return Promise.reject(refreshError);
    }
  }
);

/**
 * 응답 인터셉터가 res.data 를 언래핑하므로, 실제 반환값은 AxiosResponse 가 아니라 응답 본문이다.
 * 기본 AxiosInstance 타입은 이를 반영하지 못해 `const { data } = await api.post(...)` 같은
 * 코드가 컴파일은 통과하고 런타임에 undefined 로 터진다. 타입을 실제 동작에 맞춰 좁힌다.
 */
interface UnwrappedAxios {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
}

export default instance;
//export default instance as unknown as UnwrappedAxios;
