/**
 * 알림 목록/읽음 처리 전역 상태 (zustand)
 * - Header의 알림 벨 아이콘에 표시되는 안 읽은 알림 수(unreadCount)와
 *   알림 페이지(NotificationPage)의 목록/읽음 처리가 같은 데이터를 공유해야 해서 스토어로 분리함
 *   (Header와 알림 페이지가 서로 다른 컴포넌트 트리라 로컬 state로는 동기화가 안 됨)
 */
import { create } from "zustand";
import type { Notification } from "../types";
import { MY_NOTIFICATIONS } from "../data/user";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAllRead: () => void;
  markRead: (notificationId: number) => void;
}

const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: MY_NOTIFICATIONS,
  unreadCount: MY_NOTIFICATIONS.filter((n) => !n.isRead).length,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    })),
  markRead: (notificationId) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.notificationId === notificationId ? { ...n, isRead: true } : n
      );
      return { notifications, unreadCount: notifications.filter((n) => !n.isRead).length };
    }),
}));

export default useNotificationStore;
