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

export const reportPost = (postId: number, reason: string, description: string) =>
  instance.post(`/v1/posts/${postId}/report`, { postId, reason, description });

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
