import instance from "./instance";

/**
 * 결제(payment) 관련 API 함수 모음
 * - 백엔드 PaymentController 기준 (base: /api/v1/payments)
 * - PG 미연동 Mock 결제. 성공 시 예약이 PENDING_PAYMENT → PENDING 으로 전이된다.
 *
 * ⚠️ instance 의 응답 인터셉터가 res.data 를 언래핑한다.
 *    반환값은 AxiosResponse 가 아니라 응답 본문 그 자체다.
 *    호출부에서 `const { data } = await ...` 하지 말 것.
 */

/** 백엔드 PaymentMethod.java 와 1:1 대응 */
export type PaymentMethod = "CARD" | "KAKAO_PAY" | "NAVER_PAY" | "TOSS_PAY";

/** 결제 수단 선택 UI용 라벨 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "신용/체크카드",
  KAKAO_PAY: "카카오페이",
  NAVER_PAY: "네이버페이",
  TOSS_PAY: "토스페이",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/** PaymentResponse.java 기준 — 실제 record 필드 확인 후 보정 */
export interface PaymentResponse {
  paymentId: number;
  reservationId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: string;
  paidAt: string;
}

/**
 * 결제 금액(amount)은 보내지 않는다.
 * 서버가 예약의 totalPrice 를 직접 조회해 결제하므로 클라이언트가 금액을 조작할 수 없다.
 */
export interface PaymentCreateRequest {
  reservationId: number;
  paymentMethod: PaymentMethod;
}

/**
 * 결제 생성 → 201.
 * PENDING_PAYMENT 상태의 예약만 대상. 성공 시 예약이 PENDING 으로 전이된다.
 * 결제 대기 시간(payment.waiting-expiry-minutes)이 지나면 예약이 만료 처리되어 실패한다.
 */
export const createPayment = (payload: PaymentCreateRequest): Promise<PaymentResponse> =>
  instance.post("/v1/payments", payload);