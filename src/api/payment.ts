import instance from "./instance";

/**
 * 결제(payment) 관련 API 함수 모음 - 결제 생성, 캠핑업체 매출 통계.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/reservation/*, pages/business/* 등은 이 함수들을 호출하지 않고
 *   mock 데이터/스토어 값을 그대로 사용 중. 실제 백엔드 연동 시
 *   여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const createPayment = (payload: {
  reservationId: number;
  amount: number;
  paymentMethod: "CARD" | "BANK_TRANSFER" | "KAKAO_PAY";
}) =>
  instance.post<{
    paymentId: number;
    reservationId: number;
    status: string;
    amount: number;
    paidAt: string;
    message: string;
  }>("/v1/payments", payload);

// 캠핑업체 전용
export const getSalesStats = (contentId: number, startDate: string, endDate: string) =>
  instance.get<{
    contentId: number;
    totalRevenue: number;
    dailyStats: { date: string; revenue: number }[];
  }>(`/v1/camps/${contentId}/payments/stats`, { params: { startDate, endDate } });
