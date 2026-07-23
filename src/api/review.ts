import instance from "./instance";
import type { AxiosResponse } from "axios";

// 리뷰 응답객체
export interface ReviewResponse {
  reviewId: number;
  campId: number;
  reservationId: number;
  userId: number;
  nickname: string;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 작성 요청 본문 (백엔드 ReviewRequest).
 * - rating: Integer, 1~5 정수만 허용 (@DecimalMin 1 / @DecimalMax 5, @NotNull)
 * - content: 필수(@NotBlank), 최대 1000자(@Size max=1000)
 * 새로 올릴 이미지 파일은 이 본문이 아니라 multipart 의 "images" 파트로 따로 보낸다.
 */
export interface ReviewRequest {
  rating: number; // 1~5 정수
  content: string;
}


export interface ReviewUpdateRequest extends ReviewRequest {
  keepImageUrls?: string[];
}

// 인터셉터가 봉투를 벗겨 실제 데이터를 반환하므로, 그 사실을 타입으로 표현하는 헬퍼.
// axios는 Promise<AxiosResponse<T>>로 추론하지만 런타임 반환은 T다. 이 한 곳에서만 좁힌다.
const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> =>
  p as unknown as Promise<T>;


const IMAGE_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api\/?$/, "");

/** 서버가 준 상대경로(/images/abc.jpg)를 <img src>에 바로 쓸 수 있는 URL로 바꾼다. */
export const toImageSrc = (path: string): string =>
  /^(https?:|blob:|data:)/.test(path) ? path : `${IMAGE_ORIGIN}${path}`;


const toReviewFormData = (payload: ReviewRequest | ReviewUpdateRequest, files?: File[]): FormData => {
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(payload)], { type: "application/json" }));
  (files ?? []).forEach((file) => form.append("images", file));
  return form;
};

// 작성: 201 + ReviewResponse. files는 선택(없으면 이미지 없는 리뷰).
export const createReview = (
  reservationId: number,
  payload: ReviewRequest,
  files?: File[],
): Promise<ReviewResponse> =>
  unwrap(
    instance.post<ReviewResponse>(
      `/v1/reservations/${reservationId}/reviews`,
      toReviewFormData(payload, files),
    ),
  );

// 목록: ReviewResponse[]
export const getReviews = (campId: number): Promise<ReviewResponse[]> =>
  unwrap(instance.get<ReviewResponse[]>(`/v1/camps/${campId}/reviews`));

// 수정: 200 + ReviewResponse. payload.keepImageUrls 로 남길 기존 이미지를, files로 새 이미지를 보낸다.
export const updateReview = (
  reviewId: number,
  payload: ReviewUpdateRequest,
  files?: File[],
): Promise<ReviewResponse> =>
  unwrap(
    instance.post<ReviewResponse>(`/v1/reviews/${reviewId}`, toReviewFormData(payload, files)),
  );

// 삭제: 204. 백엔드가 @PostMapping(".../delete") 라 DELETE 가 아닌 POST 로 보낸다.
export const deleteReview = (reviewId: number): Promise<void> =>
  unwrap(instance.post<void>(`/v1/reviews/${reviewId}/delete`));

// 내 리뷰 목록
export const getMyReviews = (): Promise<ReviewResponse[]> =>
  unwrap(instance.get<ReviewResponse[]>(`/v1/reviews/me`));

// 캠핑업체 전용 통계 — 대시보드 구현 시 사용.
// ⚠️ 백엔드에 GET /v1/camps/{campId}/reviews/stats 미구현. 컨트롤러 추가 후 연동할 것.
export const getReviewStats = (campId: number) =>
  instance.get<{
    campId: number;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  }>(`/v1/camps/${campId}/reviews/stats`);
