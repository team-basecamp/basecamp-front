import instance from "./instance";
import type { Review } from "../types";

/**
 * 리뷰(review) 관련 API 함수 모음 - 캠핑장 리뷰 CRUD, 캠핑업체 전용 리뷰 통계.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/campsite/ReviewsPage.tsx, ReviewDetailPage.tsx 등은
 *   이 함수들을 호출하지 않고 data/reviews.ts의 mock 데이터를 그대로 사용 중.
 *   실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const createReview = (
  contentId: number,
  payload: { rating: number; content: string; reservationId: number }
) => instance.post<{ reviewId: number; message: string }>(`/v1/camps/${contentId}/reviews`, {
  contentId,
  ...payload,
});

export const getReviews = (contentId: number, pageNo = 1, numOfRows = 10) =>
  instance.get<{ reviews: Review[]; averageRating: number }>(`/v1/camps/${contentId}/reviews`, {
    params: { contentId, pageNo, numOfRows },
  });

// 실제로는 수정(UPDATE) 처리 (REST 컨벤션상 POST로 구현됨)
export const updateReview = (contentId: number, reviewId: number, payload: { rating: number; content: string }) =>
  instance.post(`/v1/camps/${contentId}/reviews/${reviewId}/update`, { reviewId, ...payload });

// 실제로는 삭제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const deleteReview = (contentId: number, reviewId: number) =>
  instance.post(`/v1/camps/${contentId}/reviews/${reviewId}/delete`, { reviewId });

// 캠핑업체 전용
export const getReviewStats = (contentId: number) =>
  instance.get<{
    contentId: number;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  }>(`/v1/camps/${contentId}/reviews/stats`);
