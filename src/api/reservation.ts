import instance from "./instance";
import type { Reservation } from "../types";

/**
 * 예약(reservation) 관련 API 함수 모음
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/reservation/*, components/common/ReservationList.tsx 등은
 *   이 함수들을 호출하지 않고 store/reservationStore.ts의 mock 데이터를 그대로 사용 중.
 *   실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const createReservation = (payload: {
  campId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
}) => instance.post<{ reservationId: number; status: string; message: string }>("/v1/reservations", payload);

export const cancelReservation = (reservationId: number, cancelDate: string) =>
  instance.post(`/v1/reservations/${reservationId}/cancel`, { reservationId, cancelDate });

export const getMyReservations = (pageNo = 1, numOfRows = 10) =>
  instance.get<{ reservations: Reservation[] }>("/v1/members/me/reservations", { params: { pageNo, numOfRows } });

// 캠핑업체 전용
export const getCampsiteReservations = (contentId: number, pageNo = 1, numOfRows = 10) =>
  instance.get<{ reservations: Reservation[] }>(`/v1/camps/${contentId}/reservations`, {
    params: { pageNo, numOfRows },
  });

// 실제로는 예약 승인 처리 (REST 컨벤션상 POST로 구현됨)
export const acceptReservation = (reservationId: number) =>
  instance.post(`/v1/reservations/${reservationId}/accept`, { reservationId });

// 실제로는 예약 거절 처리 (REST 컨벤션상 POST로 구현됨)
export const rejectReservation = (reservationId: number, reason: string) =>
  instance.post(`/v1/reservations/${reservationId}/reject`, { reservationId, reason });

export const getReservationStats = (contentId: number, startDate: string, endDate: string) =>
  instance.get(`/v1/camps/${contentId}/reservations/stats`, { params: { startDate, endDate } });
