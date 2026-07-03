/**
 * 로그인 사용자 정보 전역 상태 (zustand)
 * - persist 미들웨어로 localStorage("auth-storage")에 저장되어, 새로고침/브라우저 재접속을 해도
 *   로그인 상태가 유지됨 (로컬 useState였다면 새로고침 시 로그인 정보가 날아감)
 * - Header의 로그인 버튼/프로필 표시, 각 페이지의 로그인 여부 체크(RequireLogin 등)가
 *   전부 이 스토어의 user 값을 기준으로 판단함
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MemberRole = "CUSTOMER" | "BUSINESS" | "ADMIN";

export interface AuthUser {
  memberId: number;
  nickname: string;
  email?: string;
  profileImage?: string;
  role: MemberRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  setUser: (user: AuthUser, accessToken?: string) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setUser: (user, accessToken) => set({ user, accessToken: accessToken ?? null }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    { name: "auth-storage" }
  )
);

export default useAuthStore;
