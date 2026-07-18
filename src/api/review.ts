import instance from "./instance";
import type { AxiosResponse } from "axios";

/**
 * 백엔드 ReviewResponse(record)와 1:1 매핑.
 * - rating: BigDecimal → JSON 숫자 (예: 4 또는 4.0). "4.5"처럼 문자열로 오면 string으로 교체.
 * - imageUrls: 첨부 이미지의 **상대경로** 목록 (예: "/images/abc123.jpg"). 첨부 순서대로, 없으면 빈 배열.
 *   화면에 그릴 때는 그대로 쓰지 말고 toImageSrc()로 절대 URL을 만들어야 한다. (아래 주석 참고)
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

/**
 * 수정 요청 본문 (백엔드 ReviewUpdateRequest).
 * 이미지는 "전체 교체" 방식이라 최종 첨부 = keepImageUrls(남길 기존 것) + images 파트(새 파일) 다.
 * - keepImageUrls 생략(undefined) : 기존 이미지 전부 유지
 * - 빈 배열([])                    : 기존 이미지 전부 삭제
 * 여기 없는 기존 이미지는 서버에서 images 행과 실제 파일까지 지워진다(되돌릴 수 없음).
 * 반드시 서버가 준 상대경로(imageUrls의 원본)를 그대로 돌려보내야 한다 — 절대 URL로 바꿔 보내면 400.
 */
export interface ReviewUpdateRequest extends ReviewRequest {
  keepImageUrls?: string[];
}

// 인터셉터가 봉투를 벗겨 실제 데이터를 반환하므로, 그 사실을 타입으로 표현하는 헬퍼.
// axios는 Promise<AxiosResponse<T>>로 추론하지만 런타임 반환은 T다. 이 한 곳에서만 좁힌다.
const unwrap = <T>(p: Promise<AxiosResponse<T>>): Promise<T> =>
  p as unknown as Promise<T>;

/**
 * 이미지 정적 파일의 원본(origin).
 * API는 VITE_API_BASE_URL(".../api")로 나가지만, 업로드된 이미지는 그 아래가 아니라
 * 백엔드 루트의 "/images/**" 로 서빙된다(WebConfig 정적 리소스 핸들러). 그래서 baseURL에서
 * 끝의 "/api"만 떼어 origin을 얻는다.
 *   http://localhost:8080/api → http://localhost:8080 → http://localhost:8080/images/abc.jpg
 * 상대 baseURL("/api")이면 origin은 빈 문자열이 되어 "/images/abc.jpg"로 남는데,
 * 이 경우 Vite 프록시에 "/images" 규칙이 없으면 404가 난다. (vite.config.ts 는 "/api"만 프록시)
 */
const IMAGE_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/api\/?$/, "");

/** 서버가 준 상대경로(/images/abc.jpg)를 <img src>에 바로 쓸 수 있는 URL로 바꾼다. */
export const toImageSrc = (path: string): string =>
  /^(https?:|blob:|data:)/.test(path) ? path : `${IMAGE_ORIGIN}${path}`;

/**
 * 백엔드가 작성/수정을 multipart/form-data 로 받으므로 본문과 파일을 한 폼에 담는다.
 * - "request" 파트는 반드시 Content-Type: application/json 인 Blob 이어야 한다.
 *   문자열로 append 하면 text/plain 으로 나가 @RequestPart 역직렬화가 실패하고 415가 난다.
 * - Content-Type 헤더는 직접 지정하지 않는다. axios가 boundary 를 포함해 자동으로 채운다.
 */
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
