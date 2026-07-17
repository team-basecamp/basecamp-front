import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { logout as requestLogout } from "../api/auth";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";

/**
 * 로그아웃 처리.
 * - 서버: refresh 토큰을 블랙리스트에 등록해 폐기하고 HttpOnly 쿠키를 삭제한다.
 * - 클라이언트: authStore, notificationStore, 그리고 TanStack Query 캐시를 비우고 홈으로 이동한다.
 *   (알림·찜처럼 사용자별 데이터는 비우지 않으면 다음에 로그인한 사람에게 이전 사용자의 것이 보인다.
 *    여기서는 새로고침 없이 SPA 이동만 하므로 쿼리 캐시가 살아남아 명시적으로 지워야 한다)
 *
 * 서버 호출이 실패해도(네트워크 오류, 세션 이미 만료 등) 클라이언트 상태는 반드시 비운다.
 * 로그아웃 버튼을 눌렀는데 로그인 상태로 남아 있는 것이 가장 나쁜 결과다.
 *
 * access 토큰은 무상태라 만료(기본 30분) 전까지 유효하다. 저장소에서 지우는 것이 곧 폐기다.
 */
export default function useLogout(redirectTo = "/") {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((s) => s.logout);
  const clearNotifications = useNotificationStore((s) => s.reset);
  const queryClient = useQueryClient();

  return async () => {
    try {
      await requestLogout();
    } catch {
      // 서버 폐기에 실패해도 아래 finally 에서 클라이언트 상태는 정리한다.
    } finally {
      clearAuth();
      clearNotifications();
      queryClient.clear();
      navigate(redirectTo, { replace: true });
    }
  };
}
