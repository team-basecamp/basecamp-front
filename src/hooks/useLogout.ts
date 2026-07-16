import { useNavigate } from "react-router-dom";
import { logout as requestLogout } from "../api/auth";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";

/**
 * 로그아웃 처리.
 * - 서버: refresh 토큰을 블랙리스트에 등록해 폐기하고 HttpOnly 쿠키를 삭제한다.
 * - 클라이언트: authStore 와 notificationStore 를 비우고 홈으로 이동한다.
 *   (알림은 사용자별 데이터라, 비우지 않으면 다음에 로그인한 사람에게 이전 사용자의 뱃지·목록이 보인다)
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

  return async () => {
    try {
      await requestLogout();
    } catch {
      // 서버 폐기에 실패해도 아래 finally 에서 클라이언트 상태는 정리한다.
    } finally {
      clearAuth();
      clearNotifications();
      navigate(redirectTo, { replace: true });
    }
  };
}
