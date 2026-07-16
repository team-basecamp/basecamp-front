/**
 * 알림 목록/읽음 처리 전역 상태 (zustand)
 * - Header의 알림 벨 아이콘에 표시되는 안 읽은 알림 수(unreadCount)와
 *   알림 페이지(NotificationPage)의 목록/읽음 처리가 같은 데이터를 공유해야 해서 스토어로 분리함
 *   (Header와 알림 페이지가 서로 다른 컴포넌트 트리라 로컬 state로는 동기화가 안 됨)
 * - 서버가 진실의 원천이다. 읽음 처리는 화면에 먼저 반영하고 API가 실패하면 되돌린다.
 */
import { create } from "zustand";
import type { Notification } from "../types";
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  /** 목록 조회 진행 중 여부. 페이지의 로딩 표시에 쓴다. */
  loading: boolean;
  /** 현재 페이지(0-base)와 마지막 페이지 여부. "더보기" 노출 판단에 쓴다. */
  page: number;
  last: boolean;
  /** 첫 페이지를 새로 불러온다(알림 페이지 진입 시). */
  fetchNotifications: () => Promise<void>;
  /** 다음 페이지를 이어붙인다. */
  fetchNextPage: () => Promise<void>;
  /** 안읽은 개수만 갱신한다(헤더 뱃지용 — 목록 없이 가볍게). */
  fetchUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (notificationId: number) => Promise<void>;
  /** 로그아웃 시 이전 사용자의 알림이 남지 않도록 비운다. */
  reset: () => void;
}

const PAGE_SIZE = 10;

const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  page: 0,
  last: true,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      // 목록은 페이지네이션이라 여기서 안읽은 개수를 세면 첫 페이지 기준의 부분합이 된다.
      // 개수는 전용 API로 따로 받는다.
      const res = await getNotifications({ page: 0, size: PAGE_SIZE });
      set({ notifications: res.content, page: res.number, last: res.last });
    } finally {
      set({ loading: false });
    }
    await get().fetchUnreadCount();
  },

  fetchNextPage: async () => {
    const { loading, last, page } = get();
    if (loading || last) return;
    set({ loading: true });
    try {
      const res = await getNotifications({ page: page + 1, size: PAGE_SIZE });
      set((state) => ({
        notifications: [...state.notifications, ...res.content],
        page: res.number,
        last: res.last,
      }));
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    const { count } = await getUnreadCount();
    set({ unreadCount: count });
  },

  markRead: async (notificationId) => {
    // 이미 읽은 알림이면 서버 왕복이 의미 없다(백엔드가 멱등이라 불러도 무해하지만 굳이 부르지 않는다).
    if (get().notifications.find((n) => n.id === notificationId)?.isRead) return;

    const previous = get().notifications;
    const previousCount = get().unreadCount;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await markNotificationAsRead(notificationId);
    } catch (e) {
      set({ notifications: previous, unreadCount: previousCount });
      throw e;
    }
  },

  markAllRead: async () => {
    const previous = get().notifications;
    const previousCount = get().unreadCount;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await markAllNotificationsAsRead();
    } catch (e) {
      set({ notifications: previous, unreadCount: previousCount });
      throw e;
    }
  },

  reset: () => set({ notifications: [], unreadCount: 0, page: 0, last: true, loading: false }),
}));

export default useNotificationStore;
