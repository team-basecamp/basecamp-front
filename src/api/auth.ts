import instance from "./instance";

/**
 * 인증(auth) 관련 API 함수 모음 - 소셜 로그인, 로그아웃, 회원 탈퇴, 토큰 재발급.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 로그인/로그아웃 관련 페이지들은 이 함수들을 호출하지 않고
 *   store/authStore.ts에서 목업 상태를 그대로 사용 중. 실제 백엔드 연동 시
 *   여기 함수들을 TanStack Query(useMutation 등)로 교체하면 됨.
 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  memberId: number;
  message: string;
}

export const loginWithKakao = (code: string) =>
  instance.post<LoginResponse>("/v1/auth/login/kakao", { code });

export const loginWithGoogle = (code: string) =>
  instance.post<LoginResponse>("/v1/auth/login/google", { code });

export const loginWithNaver = (code: string, state: string) =>
  instance.post<LoginResponse>("/v1/auth/login/naver", { code, state });

export const logout = (refreshToken: string) =>
  instance.post("/v1/auth/logout", { refreshToken });

export const withdraw = (reason: string) =>
  instance.post("/v1/auth/withdraw", { reason });

export const refreshToken = (refreshToken: string) =>
  instance.post<{ accessToken: string; refreshToken: string; message: string }>(
    "/v1/auth/token/refresh",
    { refreshToken }
  );
