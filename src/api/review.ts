import instance from "./instance";
import type { AxiosResponse } from "axios";

/**
 * 백엔드 ReviewResponse(record)와 1:1 매핑.
 * - rating: BigDecimal → JSON 숫자 (예: 4 또는 4.0). "4.5"처럼 문자열로 오면 string으로 교체.
 * - createdAt/updatedAt: LocalDateTime → ISO-8601 문자열.
 */
export interface ReviewResponse {
  reviewId: number;
  campId: number;
  reservationId: number;
  userId: number;
  nickname: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 작성/수정 요청 본문 (백엔드 ReviewRequest).
 * - rating: Integer, 1~5 정수만 허용 (@DecimalMin 1 / @DecimalMax 5, @NotNull)
 * - content: 필수(@NotBlank), 최대 1000자(@Size max=1000)
 */
export interface ReviewRequest {
  rating: number; // 1~5 정수
  content: string;
}

// 인터셉터가 봉투를 벗겨 실제 데이터를 반환하므로, 그 사실을 타입으로 표현하는 헬퍼.
// axios는 Promise<AxiosResponse<T>>로 추론하지만 런타임 반환은 T다. 이 한 곳에서만 좁힌다.
const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> =>
  p as unknown as Promise<T>;

// 작성: 201 + ReviewResponse
export const createReview = (reservationId: number, payload: ReviewRequest): Promise<ReviewResponse> =>
  unwrap(instance.post<ReviewResponse>(`/v1/reservations/${reservationId}/reviews`, payload));

// 목록: ReviewResponse[]
export const getReviews = (campId: number): Promise<ReviewResponse[]> =>
  unwrap(instance.get<ReviewResponse[]>(`/v1/camps/${campId}/reviews`));

// 수정: 200 + ReviewResponse
export const updateReview = (reviewId: number, payload: ReviewRequest): Promise<ReviewResponse> =>
  unwrap(instance.post<ReviewResponse>(`/v1/reviews/${reviewId}`, payload));

// 삭제: 204
export const deleteReview = (reviewId: number): Promise<void> =>
  unwrap(instance.delete<void>(`/v1/reviews/${reviewId}/delete`));

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