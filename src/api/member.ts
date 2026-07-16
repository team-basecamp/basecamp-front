import instance from "./instance";
import type { Post } from "../types";
import type { WishCamp } from "../types";

/**
 * 회원(member) 관련 API 함수 모음 - 내 프로필/위시리스트/작성글/알림 조회.
 * - 내 프로필(조회/수정)은 백엔드 UserController 계약을 따른다: GET /v1/users/me, POST /v1/users/me(수정).
 * - 위시리스트/작성글/알림은 아직 백엔드 미구현이라 pages/mypage/*가 store/data mock 을 그대로 사용 중.
 *   실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 * - instance 의 응답 인터셉터가 res.data 로 언래핑하므로, 각 함수의 실제 resolve 값은 제네릭 타입 그대로다.
 */

/** 내 프로필(MyProfileResponse). 백엔드 필드명을 그대로 따른다. */
export interface MyProfile {
  userId: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
  createdAt: string;
}

/** 내 프로필 수정 요청. profileImageUrl 을 비우거나 null 로 보내면 이미지를 제거한다. */
export interface UpdateProfileRequest {
  nickname: string;
  profileImageUrl?: string | null;
}

/** 내 프로필 조회. */
export const getMyProfile = () =>
  instance.get<MyProfile>("/v1/users/me") as unknown as Promise<MyProfile>;

/** 내 프로필(닉네임·프로필 이미지) 수정. 성공 시 갱신된 프로필을 돌려준다. */
export const updateMyProfile = (body: UpdateProfileRequest) =>
  instance.post<MyProfile>("/v1/users/me", body) as unknown as Promise<MyProfile>;

export const getMyWishlist = () =>
  instance.get<{ wishlist: WishCamp[] }>("/v1/members/me/wishlist");

export const getMyPosts = (pageNo = 1, numOfRows = 10) =>
  instance.get<{ posts: Post[] }>("/v1/members/me/posts", { params: { pageNo, numOfRows } });

// 알림 API 는 api/notification.ts 로 옮겼다.
// 여기 있던 getMyNotifications / markNotificationRead 는 백엔드에 없는 /v1/members/me/notifications 를
// 가리키던 미사용 코드라 제거했다. 실제 엔드포인트는 /v1/notifications 다.
