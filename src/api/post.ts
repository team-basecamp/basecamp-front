import instance from "./instance";
import type { AxiosResponse } from "axios";
import type { PostCategory } from "../types";

/**
 * 커뮤니티 게시글(post)·댓글(comment) API. 백엔드 PostController / CommentController 계약을 그대로 따른다.
 *
 * 게시글
 * - 목록:   GET  /v1/posts                  (category·cursor·size 선택, 커서 페이징)
 * - 상세:   GET  /v1/posts/{postId}         (삭제된 글 404, 블라인드된 글 403)
 * - 작성:   POST /v1/posts                  (multipart, 201)
 * - 수정:   POST /v1/posts/{postId}/update  (multipart)
 * - 삭제:   POST /v1/posts/{postId}/delete  (소프트 삭제, 이동할 경로 반환)
 * - 신고:   POST /v1/posts/{postId}/report  (201)
 *
 * 댓글 (commentId 가 전역 유니크 PK 라 수정·삭제는 postId 없이 단건 리소스로 다룬다)
 * - 목록:   GET  /v1/posts/{postId}/comments
 * - 작성:   POST /v1/posts/{postId}/comments      (201)
 * - 수정:   POST /v1/comments/{commentId}/update
 * - 삭제:   POST /v1/comments/{commentId}/delete  (204)
 */

// 인터셉터가 봉투({success, message, data})를 벗겨 실제 데이터를 반환하므로, 그 사실을 타입으로 표현하는 헬퍼.
// axios 는 Promise<AxiosResponse<T>>로 추론하지만 런타임 반환은 T다. 이 한 곳에서만 좁힌다.
const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> => p as unknown as Promise<T>;

/** 게시글 상태(posts.status). 상세 조회로는 ACTIVE 만 내려온다(DELETED 404, BLINDED 403). */
export type PostStatus = "ACTIVE" | "BLINDED" | "DELETED";

/** 댓글 상태(comments.status). BLINDED/DELETED 면 content 가 실제 본문 대신 안내 문구로 대체돼 내려온다. */
export type CommentStatus = "ACTIVE" | "BLINDED" | "DELETED";

/** 게시글 상세(PostDetailResponse). 작성/수정 응답도 같은 형태다. */
export interface PostDetail {
  postId: number;
  userId: number;
  nickname: string;
  category: PostCategory;
  title: string;
  content: string;
  viewCount: number;
  status: PostStatus;
  /** 첨부 이미지 상대경로 목록(예: /images/abc123.jpg). 첨부 순서대로, 없으면 빈 배열. */
  imageUrls: string[];
  createdAt: string;
  updatedAt: string | null;
}

/** 목록 한 줄(PostListResponse). 상세와 달리 본문(content)·이미지는 담기지 않는다. */
export interface PostListItem {
  postId: number;
  category: PostCategory;
  title: string;
  nickname: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
}

/** 목록 응답 envelope(PostListCursorResponse). 무한 스크롤은 nextCursor 를 그대로 되돌려 보낸다. */
export interface PostListPage {
  content: PostListItem[];
  hasNext: boolean;
  /** 다음 요청의 cursor 로 그대로 실어 보낼 불투명 문자열. hasNext 가 false 면 null. */
  nextCursor: string | null;
}

/** 댓글(CommentResponse). 작성/수정/목록이 모두 같은 형태다. */
export interface CommentItem {
  commentId: number;
  postId: number;
  userId: number;
  nickname: string;
  /** 프로필 사진은 선택 사항이라 없는 회원은 null. */
  profileImageUrl: string | null;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string | null;
}

/** 작성/수정 요청의 본문 필드. multipart 의 "request"(application/json) 파트로 나간다. */
export interface PostFormRequest {
  category: PostCategory;
  title: string; // 필수, 최대 200자
  content: string; // 필수
}

/**
 * 백엔드가 'request' 파트를 @RequestPart 로 받으므로 Content-Type 이 application/json 이어야 한다.
 * 문자열로 append 하면 text/plain 으로 나가 415 가 된다. Blob 으로 감싸 타입을 명시한다.
 */
const buildPostForm = (request: object, images?: File[]) => {
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  // 파일이 하나도 없으면 images 파트를 아예 넣지 않는다(백엔드에서 required=false).
  images?.forEach((file) => form.append("images", file));
  return form;
};

/**
 * 게시글 목록. category 를 생략하거나 "ALL" 로 보내면 전체를 조회한다.
 * 첫 페이지는 cursor 없이 요청하고, 이후에는 직전 응답의 nextCursor 를 그대로 실어 보낸다.
 * cursor 는 서버가 만든 불투명 값이므로 프론트에서 직접 조립하지 않는다.
 */
export const getPosts = (params: {
  category?: PostCategory | "ALL";
  cursor?: string | null;
  size?: number; // 1~50, 기본 10
}): Promise<PostListPage> =>
  unwrap(
    instance.get<PostListPage>("/v1/posts", {
      params: {
        category: params.category === "ALL" ? undefined : params.category,
        cursor: params.cursor ?? undefined,
        size: params.size,
      },
    })
  );

/** 게시글 상세. 삭제된 글이면 404, 블라인드된 글이면 403. */
export const getPostDetail = (postId: number): Promise<PostDetail> =>
  unwrap(instance.get<PostDetail>(`/v1/posts/${postId}`));

/** 게시글 작성(201). images 는 선택이며 최대 개수·용량 초과는 백엔드가 413/400 으로 막는다. */
export const createPost = (request: PostFormRequest, images?: File[]): Promise<PostDetail> =>
  unwrap(instance.post<PostDetail>("/v1/posts", buildPostForm(request, images)));

/**
 * 게시글 수정. 이미지는 전체 교체 방식이라 최종 첨부 = keepImageUrls(남길 기존 이미지) + images(새 파일) 이고,
 * keepImageUrls 에 넣지 않은 기존 이미지는 파일까지 삭제된다.
 * - 생략(undefined): 기존 이미지 전부 유지
 * - 빈 배열([])   : 기존 이미지 전부 삭제
 * 본인 글이 아니면 403.
 */
export const updatePost = (
  postId: number,
  request: PostFormRequest & { keepImageUrls?: string[] },
  images?: File[]
): Promise<PostDetail> =>
  unwrap(instance.post<PostDetail>(`/v1/posts/${postId}/update`, buildPostForm(request, images)));

/** 삭제 응답(PostDeleteResponse). 서버가 리다이렉트하지 않고 이동할 경로만 내려준다. */
export interface PostDeleteResult {
  redirectUrl: string;
}

/** 게시글 삭제(소프트 삭제). 본인 글이 아니면 403. 첨부 이미지는 실제 파일까지 지워진다. */
export const deletePost = (postId: number): Promise<PostDeleteResult> =>
  unwrap(instance.post<PostDeleteResult>(`/v1/posts/${postId}/delete`));

/** 게시글 신고 사유 코드. 백엔드 PostReportRequest 의 허용값과 일치한다. */
export type PostReportReason = "SPAM" | "INAPPROPRIATE" | "ILLEGAL" | "ETC";

/** 신고 접수 응답(PostReportResponse). */
export interface PostReportResult {
  reportId: number;
  postId: number;
  createdAt: string;
  message: string;
}

/**
 * 게시글 신고. 로그인 필요. reason 은 필수(4종 중 하나), description 은 선택(최대 1000자).
 * 이미 신고한 글이면 409, 없거나 삭제된 글이면 404.
 * 대상 postId 는 경로 변수를 신뢰하므로 본문에는 reason·description 만 담는다.
 */
export const reportPost = (
  postId: number,
  reason: PostReportReason,
  description?: string
): Promise<PostReportResult> =>
  unwrap(
    instance.post<PostReportResult>(`/v1/posts/${postId}/report`, {
      reason,
      description: description?.trim() || undefined,
    })
  );

/** 댓글 목록(작성 순). 댓글이 없으면 빈 배열. 게시글이 없으면 404, 블라인드면 403. */
export const getComments = (postId: number): Promise<CommentItem[]> =>
  unwrap(instance.get<CommentItem[]>(`/v1/posts/${postId}/comments`));

/** 댓글 작성(201). content 는 필수, 최대 1000자. */
export const createComment = (postId: number, content: string): Promise<CommentItem> =>
  unwrap(instance.post<CommentItem>(`/v1/posts/${postId}/comments`, { content }));

/** 댓글 수정. 본인 댓글이 아니면 403. commentId 가 전역 PK 라 postId 는 필요 없다. */
export const updateComment = (commentId: number, content: string): Promise<CommentItem> =>
  unwrap(instance.post<CommentItem>(`/v1/comments/${commentId}/update`, { content }));

/** 댓글 삭제(소프트 삭제, 204). 본인은 DELETED, 관리자는 BLINDED 처리된다. */
export const deleteComment = (commentId: number): Promise<void> =>
  unwrap(instance.post<void>(`/v1/comments/${commentId}/delete`));
