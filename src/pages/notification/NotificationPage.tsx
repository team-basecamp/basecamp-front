import { useNavigate } from "react-router-dom";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import MyPageHeader from "../mypage/MyPageHeader";
import type { NotificationType } from "../../types";

const NOTIFICATION_ICONS: Record<string, string> = {
  RESERVATION_CONFIRMED: "✅",
  RESERVATION_REJECTED: "❌",
  RESERVATION_CANCELLED: "🚫",
  REVIEW_COMMENT: "💬",
  POST_COMMENT: "📝",
};

// 알림 데이터에 특정 게시글/리뷰/예약 id가 들어있지 않아서, 타입별로 관련 상세가 아닌 해당 카테고리 목록 페이지로만 이동 가능
// (예: RESERVATION_CONFIRMED를 눌러도 특정 예약 상세가 아니라 예약 목록 "/reservations"로 이동)
// 예약 관련 알림은 예약 상세 화면이 따로 없어 목록으로, 게시글/리뷰 댓글은 ref_id로 정확한 대상까지 이동
function resolveNotificationRoute(type: NotificationType, refId?: number): string {
  switch (type) {
    case "RESERVATION_CONFIRMED":
    case "RESERVATION_REJECTED":
    case "RESERVATION_CANCELLED":
      return "/reservations";
    case "REVIEW_COMMENT":
      return refId ? `/reviews/${refId}` : "/reviews";
    case "POST_COMMENT":
      return refId ? `/posts/${refId}` : "/mypage/posts";
    default:
      return "/mypage";
  }
}

/**
 * 알림 목록 (/notifications)
 * - store/notificationStore(zustand)의 알림 목록을 보여주고, 클릭 시 읽음 처리(markRead) 후 관련 페이지로 이동
 * - 이동 경로는 NOTIFICATION_ROUTES 매핑 참고 (개별 상세로는 못 가고 카테고리 목록까지만 이동하는 제약이 있음)
 */
export default function NotificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const markRead = useNotificationStore((s) => s.markRead);

  if (!user) return <RequireLogin />;

  const handleClick = (notif: (typeof notifications)[number]) => {
    markRead(notif.notificationId);
    navigate(resolveNotificationRoute(notif.type, notif.refId));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="notifications" />

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.notificationId}
            onClick={() => handleClick(notif)}
            className={`bg-card border rounded-2xl p-4 cursor-pointer transition-all ${notif.isRead ? "border-border opacity-60" : "border-primary/30 shadow-sm"}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{NOTIFICATION_ICONS[notif.type] ?? "🔔"}</span>
              <div className="flex-1">
                <p className="text-sm leading-relaxed">{notif.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString("ko-KR")}</p>
              </div>
              {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
