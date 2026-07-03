import { useState } from "react";
import { CheckCircle, XCircle, Calendar } from "lucide-react";
import { OWNER_RESERVATIONS } from "../../data/user";
import type { Reservation } from "../../types";
import BusinessHeader from "./BusinessHeader";

/**
 * 캠핑업체 예약 관리 화면 (/business/reservations)
 * - 업체 소유 캠핑장에 들어온 예약 목록을 보여주고 수락/거절 처리
 * - 거절 시 사유(rejectReason)를 반드시 입력받음 (ERD의 reservations.reject_reason 컬럼에 대응)
 * - mock 데이터(data/user.ts의 OWNER_RESERVATIONS)를 컴포넌트 로컬 state로 관리 (새로고침하면 초기화됨, 실제 백엔드 연동 전 단계)
 */

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-accent bg-accent/10",
  RESERVED: "text-primary bg-primary/10",
  CANCELLED: "text-destructive bg-destructive/10",
  REJECTED: "text-muted-foreground bg-muted",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "승인 대기", RESERVED: "예약 확정", CANCELLED: "취소", REJECTED: "거절",
};

export default function ReservationManagePage() {
  const [reservations, setReservations] = useState<Reservation[]>(OWNER_RESERVATIONS); // mock 예약 목록 (로컬 state로만 관리)
  const [rejectingId, setRejectingId] = useState<number | null>(null); // 거절 사유를 입력 중인 예약 id
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // 예약 상태를 "예약 확정"으로 변경 (id로 해당 예약만 찾아 업데이트)
  const acceptReservation = (id: number) => {
    setReservations((prev) => prev.map((r) => r.reservationId === id ? { ...r, status: "RESERVED" } : r));
  };

  // 거절 사유 입력창을 열기만 함 (실제 거절 처리는 confirmReject에서)
  const startReject = (id: number) => {
    setRejectingId(id);
    setRejectReasonInput("");
  };

  // 입력받은 사유와 함께 예약 상태를 "거절"로 변경
  const confirmReject = () => {
    if (!rejectingId || !rejectReasonInput.trim()) return;
    setReservations((prev) =>
      prev.map((r) => r.reservationId === rejectingId ? { ...r, status: "REJECTED", rejectReason: rejectReasonInput.trim() } : r)
    );
    setRejectingId(null);
    setRejectReasonInput("");
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="reservations" />

      <div className="space-y-4">
        {reservations.map((res) => (
          <div key={res.reservationId} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>
                    {STATUS_LABELS[res.status]}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    #REZ{String(res.reservationId).padStart(4, "0")}
                  </span>
                </div>
                <p className="font-semibold text-sm">예약자: 홍길동</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {res.checkInDate} ~ {res.checkOutDate} · {res.guestCount}명
                  {res.amount && <span className="ml-2">· ₩{res.amount.toLocaleString()}</span>}
                </p>
                {res.status === "REJECTED" && res.rejectReason && (
                  <p className="text-xs text-destructive mt-1.5">거절 사유: {res.rejectReason}</p>
                )}
              </div>

              {res.status === "PENDING" && rejectingId !== res.reservationId && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => acceptReservation(res.reservationId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all"
                  >
                    <CheckCircle size={12} /> 수락
                  </button>
                  <button
                    onClick={() => startReject(res.reservationId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all"
                  >
                    <XCircle size={12} /> 거절
                  </button>
                </div>
              )}
            </div>

            {/* 거절 사유 입력 */}
            {rejectingId === res.reservationId && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="거절 사유를 입력해주세요 (예약자에게 안내됩니다)"
                  rows={2}
                  className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setRejectingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                    취소
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={!rejectReasonInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    거절 확정
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {reservations.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">예약 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
