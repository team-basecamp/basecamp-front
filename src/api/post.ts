import instance from "./instance";
import type { Post, PostComment, PostCategory } from "../types";

/**
 * 커뮤니티 게시글(post) 관련 API 함수 모음 - 게시글/댓글 CRUD, 신고.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/post/* (PostListPage, PostDetailPage, PostFormPage 등)는
 *   이 함수들을 호출하지 않고 data/posts.ts의 POSTS 배열을 직접 mutate(unshift/splice)
 *   하며 사용 중. 실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const getPosts = (category: PostCategory | "ALL", pageNo = 1, numOfRows = 10) =>
  instance.get<{ posts: Post[] }>("/v1/posts", { params: { category, pageNo, numOfRows } });

export const getPostDetail = (postId: number) => instance.get<Post>(`/v1/posts/${postId}`);

export const createPost = (payload: { category: PostCategory; title: string; content: string }) =>
  instance.post<{ postId: number; message: string }>("/v1/posts", payload);

// 실제로는 수정(UPDATE) 처리 (REST 컨벤션상 POST로 구현됨)
export const updatePost = (postId: number, payload: { category: PostCategory; title: string; content: string }) =>
  instance.post(`/v1/posts/${postId}/update`, { postId, ...payload });

// 실제로는 삭제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const deletePost = (postId: number) => instance.post(`/v1/posts/${postId}/delete`, { postId });

/** 게시글 신고 사유 코드. 백엔드 PostReportRequest 의 허용값과 일치한다. */
export type PostReportReason = "SPAM" | "INAPPROPRIATE" | "ILLEGAL" | "ETC";

/** 신고 접수 응답(PostReportResponse). instance 인터셉터가 봉투를 벗겨 이 DTO 로 resolve 된다. */
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
export const reportPost = (postId: number, reason: PostReportReason, description?: string) =>
  instance.post<PostReportResult>(`/v1/posts/${postId}/report`, {
    reason,
    description: description?.trim() || undefined,
  }) as unknown as Promise<PostReportResult>;

export const createComment = (postId: number, content: string) =>
  instance.post<{ commentId: number; message: string }>(`/v1/posts/${postId}/comments`, { postId, content });

export const getComments = (postId: number) =>
  instance.get<{ comments: PostComment[] }>(`/v1/posts/${postId}/comments`, { params: { postId } });

// 실제로는 수정(UPDATE) 처리 (REST 컨벤션상 POST로 구현됨)
export const updateComment = (postId: number, commentId: number, content: string) =>
  instance.post(`/v1/posts/${postId}/comments/${commentId}/update`, { commentId, content });

// 실제로는 삭제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const deleteComment = (postId: number, commentId: number) =>
  instance.post(`/v1/posts/${postId}/comments/${commentId}/delete`, { commentId });
