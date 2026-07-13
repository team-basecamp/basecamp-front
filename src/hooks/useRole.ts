import useAuthStore, { type MemberRole } from "../store/authStore";
import { getRoleFromToken } from "../lib/jwt";

/**
 * 현재 로그인 사용자의 권한. 비로그인/토큰 이상 시 null.
 *
 * authStore.user.role 이 아니라 access 토큰에서 꺼낸다.
 * 토큰 재발급(instance.ts 의 401 인터셉터)은 accessToken 만 교체하므로,
 * 관리자가 권한을 승격시킨 뒤 재발급을 받으면 user.role 은 로그인 시점 값으로 낡아 있다.
 * 토큰 쪽이 항상 서버가 인정하는 최신 권한이다.
 */
export default function useRole(): MemberRole | null {
  // 셀렉터가 원시값(string | null)을 돌려주므로 토큰이 바뀔 때만 리렌더된다.
  return useAuthStore((s) => getRoleFromToken(s.accessToken));
}
