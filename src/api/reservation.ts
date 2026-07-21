import instance from "./instance";

/**
 * 예약(reservation) 관련 API 함수 모음
 * - 백엔드 ReservationController 기준 (base: /api/v1/reservations)
 * - 응답 래퍼 없음. ReservationResponse / Spring Page 를 그대로 받는다.
 *
 * ⚠️ instance 의 응답 인터셉터가 res.data 를 언래핑한다.
 *    따라서 각 함수의 반환값은 AxiosResponse 가 아니라 응답 본문 그 자체다.
 *    호출부에서 `const { data } = await ...` 하지 말 것. (data 가 undefined 가 된다)
 */

export type ReservationStatus =
  | "PENDING_PAYMENT"  // 생성 직후. 결제 대기
  | "PENDING"          // 결제 완료, 업체 승인 대기
  | "RESERVED"         // 업체 승인 완료
  | "CANCELLED"        // 고객 취소
  | "REJECTED";        // 업체 거절

/** ReservationResponse.java 기준 — 실제 record 필드 확인 후 보정 */
export interface ReservationResponse {
  id: number;               // reservationId 아님
  userId: number;
  campId: number;
  checkInDate: string;      // "2026-07-20"
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  specialRequest: string | null;
  status: ReservationStatus;
  createdAt: string;
  cancelDate?: string | null;
  rejectReason?: string | null;
}

/** ReservationListResponse.java - 나의 예약목록 조회*/
export interface ReservationListResponse {
  id: number;
  campId: number;
  campName: string;
  campImage: string | null;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  specialRequest: string | null;
  status: ReservationStatus;
  rejectReason?: string | null;
  cancelDate?: string | null;
  createdAt: string;
  /** 이 예약에 이미 리뷰가 작성됐는지. true면 리뷰 작성 대상에서 제외해야 한다 */
  hasReview: boolean;
}

/** ReservationStatsResponse.java - 사업자 대시보드 예약 통계 (확정 예약 기준)*/
export interface ReservationStats {
  monthlyRevenue: number;
  monthlyReservations: number;
  yearlyReservations: number;
  pendingCount: number;
  averageRating: number | null;
}

/** MonthlyRevenueResponse.java - 월별 대시보드 예약 통계*/
export interface MonthlyRevenue {
  month: number;
  revenue: number;
  count: number;
}

/** Spring Data Page */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // 현재 페이지 (0-based)
  size: number;
  first: boolean;
  last: boolean;
}

export interface ReservationCreateRequest {
  campId: number;
  /** yyyy-MM-dd. 백엔드 @Future — 오늘은 불가, 내일부터 */
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  /** 백엔드 @Positive — 0 이하 불가 */
  totalPrice: number;
  customerName: string;
  /** 백엔드 정규식 — 하이픈 필수 (010-1234-5678) */
  customerPhone: string;
  /** 최대 500자 */
  specialRequest?: string;
}

/** 페이징 파라미터. sort는 서버 기본값(createdAt,desc)이 있어 생략 가능 */
type PageParams = { page?: number; size?: number; sort?: string };

/**
 * 예약 생성 → 201, status 는 PENDING_PAYMENT. 이어서 결제를 진행해야 한다.
 * userId 는 서버가 토큰에서 꺼내므로 절대 보내지 않는다.
 * 409 DUPLICATE_RESERVATION / 400 INVALID_RESERVATION_PERIOD
 */
export const createReservation = (
  payload: ReservationCreateRequest,
): Promise<ReservationResponse> =>
  instance.post("/v1/reservations", payload);

/** 고객 예약 취소. cancelDate 는 서버가 세팅하므로 body 불필요 */
export const cancelReservation = (
  reservationId: number,
): Promise<ReservationResponse> =>
  instance.post(`/v1/reservations/${reservationId}/cancel`);

/** 내 예약 목록 (page 는 0-based) */
export const getMyReservations = (
  { page = 0, size = 10, sort }: PageParams = {},
): Promise<Page<ReservationListResponse>> =>
  instance.get("/v1/reservations/me", {
    params: { page, size, ...(sort ? { sort } : {}) },
  });

// ── 캠핑업체(CAMP_OWNER) 전용 ──

/** 해당 캠핑장의 예약 목록 (CANCELLED 제외) */
export const getCampsiteReservations = (
  campId: number,
  { page = 0, size = 10, sort }: PageParams = {},
): Promise<Page<ReservationResponse>> =>
  instance.get(`/v1/reservations/camps/${campId}`, {
    params: { page, size, ...(sort ? { sort } : {}) },
  });

/** 예약 수락 → RESERVED */
export const approveReservation = (
  reservationId: number,
): Promise<ReservationResponse> =>
  instance.post(`/v1/reservations/${reservationId}/approve`);

/** 예약 거절 → REJECTED + 자동 환불. 사유 필수 */
export const rejectReservation = (
  reservationId: number,
  reason: string,
): Promise<ReservationResponse> =>
  instance.post(`/v1/reservations/${reservationId}/reject`, { reason });


export async function getReservationStats(): Promise<ReservationStats> {
  return instance.get('/v1/reservations/stats');
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  return instance.get('/v1/reservations/stats/monthly');
}