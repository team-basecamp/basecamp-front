import instance from "./instance";

/**
 * 회원(member) 관련 API 함수 모음 - 내 프로필/위시리스트/작성글/알림 조회.
 * - 내 프로필(조회/수정)과 내가 쓴 게시글은 백엔드 UserController 계약을 따른다:
 *   GET /v1/users/me, POST /v1/users/me(수정), GET /v1/users/me/posts(내 게시글).
 * - 위시리스트는 아직 백엔드 미구현이라 pages/mypage/*가 store mock 을 그대로 사용 중.
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

/**
 * 내 프로필 수정 요청의 JSON 파트(백엔드 UpdateProfileRequest).
 * 프로필 이미지는 URL 이 아니라 파일 업로드로 바뀌었다(MinIO). 이미지를 어떻게 다룰지는
 * image 파일 유무와 removeImage 조합으로 정한다:
 * - image 파일을 함께 보내면 → 그 파일로 교체(removeImage 는 무시)
 * - 파일 없이 removeImage=true → 기존 이미지 제거
 * - 파일 없이 removeImage 생략/false → 이미지는 그대로 유지
 */
export interface UpdateProfileRequest {
  nickname: string;
  removeImage?: boolean;
}

/** 내 프로필 조회. */
export const getMyProfile = () =>
  instance.get<MyProfile>("/v1/users/me") as unknown as Promise<MyProfile>;

/**
 * 백엔드가 'request' 파트를 @RequestPart 로 받으므로 Content-Type 이 application/json 이어야 한다.
 * 프로필 이미지는 단일 파일이라 "image" 파트로 보낸다(없으면 파트를 넣지 않음, required=false).
 */
const buildProfileForm = (request: UpdateProfileRequest, image?: File | null) => {
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  if (image) form.append("image", image);
  return form;
};

/** 내 프로필(닉네임·프로필 이미지) 수정(POST /v1/users/me, multipart). 성공 시 갱신된 프로필을 돌려준다. */
export const updateMyProfile = (request: UpdateProfileRequest, image?: File | null) =>
  instance.post<MyProfile>("/v1/users/me", buildProfileForm(request, image)) as unknown as Promise<MyProfile>;

// 찜 목록은 api/campsite.ts 의 getMyWishlists(GET /v1/wishlists/me)를 쓴다.
// 여기 있던 getMyWishlist 는 백엔드에 없는 /v1/members/me/wishlist 를 부르고 있어 제거했다.

/**
 * 마이페이지 "내가 쓴 게시글" 한 줄(MyPostResponse).
 * 작성자가 항상 본인이라 nickname 이 없고, 공용 목록(PostListItem)과 달리 category 도 담기지 않는다.
 */
export interface MyPostItem {
  postId: number;
  title: string;
  /** 작성일(생성 시각)이다. 수정 시각이 아니다. */
  createdAt: string;
  viewCount: number;
  commentCount: number;
}

/** 목록 응답 envelope(MyPostCursorResponse). 공용 게시글 목록과 형태가 같다. */
export interface MyPostPage {
  content: MyPostItem[];
  hasNext: boolean;
  /** 다음 요청의 cursor 로 그대로 실어 보낼 불투명 문자열. hasNext 가 false 면 null. */
  nextCursor: string | null;
}

/**
 * 내가 쓴 게시글 목록(최신순, 커서 페이징). 삭제·블라인드된 글은 서버가 제외한다.
 * 첫 페이지는 cursor 없이 요청하고, 이후에는 직전 응답의 nextCursor 를 그대로 실어 보낸다.
 * cursor 는 서버가 만든 불투명 값이므로 프론트에서 직접 조립하지 않는다.
 */
export const getMyPosts = (params: {
  cursor?: string | null;
  size?: number; // 1~50, 기본 10
} = {}) =>
  instance.get<MyPostPage>("/v1/users/me/posts", {
    params: { cursor: params.cursor ?? undefined, size: params.size },
  }) as unknown as Promise<MyPostPage>;

// 알림 API 는 api/notification.ts 로 옮겼다.
// 여기 있던 getMyNotifications / markNotificationRead 는 백엔드에 없는 /v1/members/me/notifications 를
// 가리키던 미사용 코드라 제거했다. 실제 엔드포인트는 /v1/notifications 다.
