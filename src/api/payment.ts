import instance from "./instance";

/**
 * 결제(payment) 관련 API 함수 모음
 * - 백엔드 PaymentController 기준 (base: /api/v1/payments)
 * - 포트원(PortOne) V2 연동. 현재는 PG 심사 전이라 포트원 "테스트 모드" 채널을 쓴다.
 *   호출 흐름과 응답 구조는 실거래와 동일하고, 실제 승인·정산만 일어나지 않는다.
 *
 * 결제는 2단계다:
 *   1) preparePayment  → 서버가 결제 건을 등록하고 결제창 호출 파라미터를 내려준다
 *   2) (결제창)         → PortOne.requestPayment() 로 실제 결제
 *   3) completePayment → 서버가 포트원에 직접 조회해 결제 완료를 확정한다
 *
 * ⚠️ instance 의 응답 인터셉터가 res.data 를 언래핑한다.
 *    반환값은 AxiosResponse 가 아니라 응답 본문 그 자체다.
 *    호출부에서 `const { data } = await ...` 하지 말 것.
 */

/**
 * 결제 수단. 백엔드 PaymentMethod.java 와 대응하되, 실제로 고를 수 있는 것만 노출한다.
 *
 * NAVER_PAY 는 enum 에는 있지만 포트원 채널이 설정돼 있지 않아 선택하면 실패한다.
 * 채널이 추가되면 여기와 아래 라벨에 같이 넣으면 된다.
 */
export type PaymentMethod = "CARD" | "KAKAO_PAY" | "TOSS_PAY";

/** 결제 수단 선택 UI용 라벨 */
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CARD: "신용/체크카드",
  KAKAO_PAY: "카카오페이",
  TOSS_PAY: "토스페이",
};

export const PAYMENT_METHODS = Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[];

/** 결제 상태. 백엔드 PaymentStatus.java 와 1:1 대응 */
export type PaymentStatus = "READY" | "PAID" | "REFUNDED" | "FAILED";

/**
 * 결제 준비 요청.
 *
 * 결제 금액(amount)은 보내지 않는다. 서버가 예약의 totalPrice 를 직접 읽어 결제창 금액을 정하므로
 * 클라이언트가 금액을 조작할 수 없다. 아래 응답의 totalAmount 도 서버가 정해준 값이며,
 * 결제 완료 확인 때 포트원 조회 결과와 서버가 한 번 더 대조한다.
 */
export interface PaymentPrepareRequest {
  reservationId: number;
  paymentMethod: PaymentMethod;
}

/**
 * 결제창 호출 파라미터. PortOne.requestPayment() 에 그대로 넘긴다.
 *
 * storeId/channelKey 를 프론트 .env 가 아니라 서버에서 받는 이유:
 * 포트원은 PG사마다 채널이 따로라 결제수단과 채널이 어긋나면 결제창이 아예 뜨지 않는다.
 * 그 짝짓기를 서버가 하면 채널 설정이 바뀌어도 프론트는 고칠 게 없다.
 */
export interface PaymentPrepareResponse {
  storeId: string;
  channelKey: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;          // "CURRENCY_KRW"
  payMethod: string;         // "CARD" | "EASY_PAY"
  easyPayProvider: string | null; // "KAKAOPAY" | "TOSSPAY" — payMethod 가 EASY_PAY 일 때만
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
}

/** PaymentResponse.java 기준 */
export interface PaymentResponse {
  id: number;
  reservationId: number;
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  status: PaymentStatus;
  failureReason: string | null;
  paidAt: string | null;
  createdAt: string;
}

/**
 * 1단계: 결제 준비 → 200.
 * PENDING_PAYMENT 상태의 본인 예약만 대상.
 * 결제 대기 시간(payment.waiting-expiry-minutes)이 지나면 예약이 만료돼 실패한다.
 */
export const preparePayment = (
  payload: PaymentPrepareRequest
): Promise<PaymentPrepareResponse> => instance.post("/v1/payments/prepare", payload);

/**
 * 3단계: 결제 완료 확인 → 201.
 * 서버가 포트원에 결제 건을 직접 조회해 금액까지 확인한 뒤 예약을 PENDING 으로 전이시킨다.
 * 결제창이 성공으로 닫혔더라도 이 호출이 성공해야 결제가 확정된 것이다.
 */
export const completePayment = (paymentId: string): Promise<PaymentResponse> =>
  instance.post("/v1/payments/complete", { paymentId });
