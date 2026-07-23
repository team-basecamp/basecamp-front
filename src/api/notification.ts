import instance from "./instance";
import type { AxiosResponse } from "axios";
import type { Page } from "./page";
import type { Notification } from "../types";

// 인터셉터가 봉투를 벗겨 실제 데이터를 반환하므로, 그 사실을 타입으로 표현하는 헬퍼.
// axios는 Promise<AxiosResponse<T>>로 추론하지만 런타임 반환은 T다. 이 한 곳에서만 좁힌다.
const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> =>
  p as unknown as Promise<T>;

/** 백엔드 UnreadCountResponse(record)와 1:1 매핑. */
export interface UnreadCountResponse {
  count: number;
}

/** 목록 조회 쿼리. 백엔드는 Pageable(page/size/sort)과 isRead 필터를 받는다. */
export interface NotificationQuery {
  /** 생략하면 읽음/안읽음 모두. true=읽은 것만, false=안읽은 것만. */
  isRead?: boolean;
  /** 0-base 페이지 번호. 백엔드 기본값 0. */
  page?: number;
  /** 백엔드 기본값 10. */
  size?: number;
}

/**
 * 내 알림 목록(최신순 페이지네이션).
 * GET /v1/notifications
 *
 * 백엔드가 Page<NotificationResponse>를 그대로 직렬화하므로 공용 Page<T>를 그대로 쓴다.
 * 정렬은 백엔드 @PageableDefault(sort=createdAt, DESC)에 맡기고 여기서 넘기지 않는다.
 */
export const getNotifications = (query: NotificationQuery = {}): Promise<Page<Notification>> =>
  unwrap(instance.get<Page<Notification>>("/v1/notifications", { params: query }));

/**
 * 안읽은 알림 개수(헤더 뱃지용).
 * GET /v1/notifications/unread-count
 */
export const getUnreadCount = (): Promise<UnreadCountResponse> =>
  unwrap(instance.get<UnreadCountResponse>("/v1/notifications/unread-count"));

/**
 * 개별 알림 읽음 처리. 이미 읽은 알림이어도 정상 처리된다(멱등).
 * POST /v1/notifications/{notificationId}/read — 200, 본문 없음.
 *
 * 남의 알림이면 403(A004), 없는 알림이면 404(N001)가 떨어진다.
 */
export const markNotificationAsRead = (notificationId: number): Promise<void> =>
  unwrap(instance.post<void>(`/v1/notifications/${notificationId}/read`));

/**
 * 전체 읽음 처리.
 * POST /v1/notifications/read-all — 200, 본문 없음.
 */
export const markAllNotificationsAsRead = (): Promise<void> =>
  unwrap(instance.post<void>("/v1/notifications/read-all"));
