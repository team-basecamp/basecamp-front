/**
 * 예약 내역 전역 상태 (zustand)
 * - 예전에는 각 페이지(마이페이지, 예약내역 등)가 로컬 useState로 예약 목록을 들고 있어서
 *   페이지 이동/재방문 시 취소·결제 상태가 초기화되는 버그가 있었음
 * - 이 스토어로 옮겨서 어느 화면에서 취소/결제해도 전체 앱에서 상태가 유지되도록 함
 *   (예: 예약내역 페이지에서 취소 → 결제 페이지에서 봐도 취소 상태로 보임)
 */
import { create } from "zustand";
import { MY_RESERVATIONS } from "../data/user";
import type { Reservation } from "../types";

interface ReservationState {
  reservations: Reservation[];
  cancelReservation: (reservationId: number) => void;
  markPaid: (reservationId: number) => void;
}

const useReservationStore = create<ReservationState>()((set) => ({
  reservations: MY_RESERVATIONS,
  cancelReservation: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.reservationId === reservationId ? { ...r, status: "CANCELLED" } : r
      ),
    })),
  markPaid: (reservationId) =>
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.reservationId === reservationId ? { ...r, status: "RESERVED", paymentStatus: "PAID" } : r
      ),
    })),
}));

export default useReservationStore;
