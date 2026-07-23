import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import { getApiErrorMessage } from "../../lib/apiError";
import MyPageHeader from "../mypage/MyPageHeader";
import type { Notification, NotificationTargetType, NotificationType } from "../../types";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  RESERVATION_CONFIRMED: "✅",
  RESERVATION_REJECTED: "❌",
  RESERVATION_REQUESTED: "📩",
  RESERVATION_CANCELLED: "⚠️",
  RESERVATION_D1: "⏰",
  CAMP_OWNER_APPROVED: "🎉",
  CAMP_OWNER_REJECTED: "🚫",
};

// 백엔드는 targetType(대상 종류)과 targetId(대상 id)를 주지만, 예약·전환신청 모두 개별 상세 화면이 없어
// 해당 목록 페이지까지만 이동한다. 상세 라우트가 생기면 targetId를 붙여 정확한 대상으로 보낼 것.
const NOTIFICATION_ROUTES: Record<NotificationTargetType, string> = {
  RESERVATION: "/reservations",
  CAMP_OWNER_APPLICATION: "/mypage/camp-owner",
};

// RESERVATION_REQUESTED/CANCELLED는 targetType은 똑같이 RESERVATION이지만 수신자가 고객이 아니라
// 캠핑업체다. targetType만으로는 구분이 안 되므로 type을 직접 보고 업체용 예약관리로 보낸다.
const OWNER_FACING_TYPES: NotificationType[] = [
  "RESERVATION_REQUESTED",
  "RESERVATION_CANCELLED",
];

const resolveNotificationRoute = (notif: Notification) =>
  OWNER_FACING_TYPES.includes(notif.type)
    ? "/business/reservations"
    : NOTIFICATION_ROUTES[notif.targetType] ?? "/mypage";

/**
 * 알림 목록 (/notifications)
 * - 진입 시 GET /v1/notifications 로 첫 페이지를 불러오고, "더보기"로 다음 페이지를 이어붙인다.
 * - 클릭 시 POST /v1/notifications/{id}/read 로 읽음 처리한 뒤 대상 목록 페이지로 이동한다.
 *   읽음 처리가 실패해도 이동은 막지 않는다(가려던 곳으로 못 가는 편이 더 나쁘다).
 */
export default function NotificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const notifications = useNotificationStore((s) => s.notifications);
  const loading = useNotificationStore((s) => s.loading);
  const last = useNotificationStore((s) => s.last);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchNextPage = useNotificationStore((s) => s.fetchNextPage);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setError(null);
    fetchNotifications().catch((err) =>
      setError(getApiErrorMessage(err, "알림을 불러오지 못했습니다."))
    );
  }, [user, fetchNotifications]);

  if (!user) return <RequireLogin />;

  const handleClick = async (notif: Notification) => {
    try {
      await markRead(notif.id);
    } catch (err) {
      setError(getApiErrorMessage(err, "읽음 처리에 실패했습니다."));
    }
    navigate(resolveNotificationRoute(notif));
  };

  const handleMarkAllRead = () => {
    setError(null);
    markAllRead().catch((err) =>
      setError(getApiErrorMessage(err, "전체 읽음 처리에 실패했습니다."))
    );
  };

  const handleLoadMore = () => {
    setError(null);
    fetchNextPage().catch((err) =>
      setError(getApiErrorMessage(err, "알림을 불러오지 못했습니다."))
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="notifications" />

      {error && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {unreadCount > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            전체 읽음 처리
          </button>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={() => void handleClick(notif)}
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

      {notifications.length === 0 && !loading && (
        <p className="text-center text-sm text-muted-foreground py-16">알림이 없습니다.</p>
      )}

      {loading && <p className="text-center text-sm text-muted-foreground py-6">불러오는 중…</p>}

      {!last && !loading && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted transition-all"
          >
            더보기
          </button>
        </div>
      )}
    </div>
  );
}
