/**
 * 로그인 사용자 정보 전역 상태 (zustand)
 * - persist 미들웨어로 localStorage("auth-storage")에 저장되어, 새로고침/브라우저 재접속을 해도
 *   로그인 상태가 유지됨 (로컬 useState였다면 새로고침 시 로그인 정보가 날아감)
 * - Header의 로그인 버튼/프로필 표시, 각 페이지의 로그인 여부 체크(RequireLogin 등)가
 *   전부 이 스토어의 user 값을 기준으로 판단함
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 백엔드 com.basecamp.backend.common.enums.Role 과 문자열이 정확히 일치해야 한다. */
export type MemberRole = "CUSTOMER" | "CAMP_OWNER" | "ADMIN";

/** 소셜 로그인 제공자(백엔드 Provider enum과 동일 표기). 프로필 아바타 로고 표시 등에 사용. */
export type SocialProvider = "KAKAO" | "GOOGLE" | "NAVER";

export interface AuthUser {
  memberId: number;
  nickname: string;
  email?: string;
  profileImage?: string;
  role: MemberRole;
  provider?: SocialProvider;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setUser: (user: AuthUser, accessToken?: string) => void;
  /** 토큰 재발급 시 user 는 그대로 두고 accessToken 만 교체한다. */
  setAccessToken: (accessToken: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user, accessToken) => set({ user, accessToken: accessToken ?? null }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: "auth-storage" }
  )
);

export default useAuthStore;
