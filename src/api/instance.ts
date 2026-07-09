import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import useAuthStore from "../store/authStore";

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
 * refresh 토큰(HttpOnly 쿠키)으로 access 토큰을 재발급받는다.
 * 백엔드가 회전(rotation)시킨 새 refresh 토큰은 Set-Cookie 로 자동 교체되므로 여기서 다룰 것이 없다.
 */
const requestRefreshToken = async () => {
  const res = await refreshClient.post<TokenRefreshResponse>("/v1/auth/token/refresh");
  return res.data.accessToken;
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
// - 성공 시 axios 응답 객체 전체가 아니라 res.data만 바로 반환하도록 언래핑.
// - 401(access 토큰 만료) 응답을 받으면 refresh 토큰으로 재발급을 한 번 시도하고 원요청을 재시도한다.
//   재발급까지 실패하면(=refresh 만료/폐기/탈취 의심) 로그아웃 후 로그인 화면으로 보낸다.
instance.interceptors.response.use(
  (res) => res.data,
  async (err: AxiosError) => {
    const original = err.config as RetriableConfig | undefined;
    const hadSession = useAuthStore.getState().accessToken !== null;

    const canRetry =
      err.response?.status === 401 &&
      original !== undefined &&
      !original._retry &&
      !isRefreshExempt(original.url) &&
      hadSession;

    if (!canRetry) {
      // 재시도 후에도 401 이거나, 애초에 재발급 대상이 아닌 401 → 세션이 있었다면 정리한다.
      if (err.response?.status === 401 && hadSession) forceLogout();
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

export default instance;
