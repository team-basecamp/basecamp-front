import instance from "./instance";
import type { Post } from "../types";
import type { WishCamp } from "../types";

/**
 * 회원(member) 관련 API 함수 모음 - 내 프로필/위시리스트/작성글/알림 조회.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/mypage/*는 이 함수들을 호출하지 않고 store/wishlistStore.ts,
 *   store/notificationStore.ts, data/posts.ts 등의 mock 데이터를 그대로 사용 중.
 *   실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 */
export interface MemberProfile {
  memberId: number;
  nickname: string;
  email: string;
  profileImage: string;
  createdAt: string;
}

export const getMyProfile = () => instance.get<MemberProfile>("/v1/members/me");

export const getMyWishlist = () =>
  instance.get<{ wishlist: WishCamp[] }>("/v1/members/me/wishlist");

export const getMyPosts = (pageNo = 1, numOfRows = 10) =>
  instance.get<{ posts: Post[] }>("/v1/members/me/posts", { params: { pageNo, numOfRows } });

export const getMyNotifications = (pageNo = 1, numOfRows = 10) =>
  instance.get("/v1/members/me/notifications", { params: { pageNo, numOfRows } });

export const markNotificationRead = (notificationId: number) =>
  instance.post(`/v1/members/me/notifications/${notificationId}/read`, { notificationId });
