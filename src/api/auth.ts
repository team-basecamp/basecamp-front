import instance from "./instance";
import type { MemberRole } from "../store/authStore";

/**
 * 인증(auth) 관련 API 함수 모음 - 소셜 로그인, 로그아웃, 회원 탈퇴, 토큰 재발급.
 * - 엔드포인트/스키마는 백엔드(basecamp-back) 실제 계약을 따른다.
 * - 로그인 응답: accessToken 은 body 로, refreshToken 은 HttpOnly 쿠키(Set-Cookie)로 내려온다.
 *   따라서 프론트는 refreshToken 을 직접 저장하지 않고, 재발급 시 쿠키가 자동 전송된다(withCredentials).
 */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  email: string;
  nickname: string;
  role: MemberRole;
  profileImageUrl: string | null;
}

const KAKAO_AUTHORIZE_URL = "https://kauth.kakao.com/oauth/authorize";

/**
 * 카카오 인증(authorize) 페이지 URL. 로그인 버튼 클릭 시 이 URL 로 브라우저를 이동시킨다.
 * 사용자가 동의하면 redirect_uri 로 인가 코드(?code=...)가 붙어 돌아온다.
 */
export const getKakaoAuthorizeUrl = () => {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_KAKAO_LOGIN_KEY,
    redirect_uri: import.meta.env.VITE_KAKAO_REDIRECT_URI,
    response_type: "code",
    // 이메일/닉네임/프로필은 카카오 콘솔에서 필수 동의라 자동 요청되지만, 명시적으로 함께 전달한다.
    scope: "account_email,profile_nickname,profile_image",
  });
  return `${KAKAO_AUTHORIZE_URL}?${params.toString()}`;
};

const NAVER_AUTHORIZE_URL = "https://nid.naver.com/oauth2.0/authorize";

export interface LoginStateResponse {
  state: string;
}

/**
 * 네이버 로그인 시작: 서버가 서명한 state 를 발급받는다(CSRF 방지).
 * state 생성·검증은 서버가 담당하므로, 프론트는 이 값을 authorize 에 실어 보내고 콜백에서 그대로 되돌려주기만 한다.
 */
export const getNaverLoginState = () =>
  instance.get<LoginStateResponse>("/v1/auth/login/naver/state") as unknown as Promise<LoginStateResponse>;

/**
 * 네이버 인증(authorize) 페이지 URL. state 는 서버가 발급한 서명값을 그대로 사용한다.
 */
export const getNaverAuthorizeUrl = (state: string) => {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: import.meta.env.VITE_NAVER_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_NAVER_REDIRECT_URI,
    state,
  });
  return `${NAVER_AUTHORIZE_URL}?${params.toString()}`;
};

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/**
 * 구글 인증(authorize) 페이지 URL. 카카오와 동일하게 state 없이 code 릴레이만 사용한다.
 */
export const getGoogleAuthorizeUrl = () => {
  const params = new URLSearchParams({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
  });
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
};

// 인터셉터가 res.data 로 언래핑하므로 실제 resolve 값은 LoginResponse 다(axios 타입과 런타임을 일치시키는 캐스팅).
export const loginWithKakao = (code: string) =>
  instance.post<LoginResponse>("/v1/auth/login/kakao", { code }) as unknown as Promise<LoginResponse>;

export const loginWithGoogle = (code: string) =>
  instance.post<LoginResponse>("/v1/auth/login/google", { code }) as unknown as Promise<LoginResponse>;

export const loginWithNaver = (code: string, state: string) =>
  instance.post<LoginResponse>("/v1/auth/login/naver", { code, state }) as unknown as Promise<LoginResponse>;

// 로그아웃/탈퇴/재발급: refresh 는 쿠키로 오가므로 body 로 토큰을 싣지 않는다(백엔드 후속 스텝에서 연동).
export const logout = () => instance.post("/v1/auth/logout");

export const withdraw = (reason: string) =>
  instance.post("/v1/auth/withdraw", { reason });

export const refreshToken = () =>
  instance.post<{ accessToken: string; tokenType: string }>("/v1/auth/token/refresh");
