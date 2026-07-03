/**
 * 예약 1건을 보여주는 카드 (마이페이지/예약내역 등에서 ReservationList가 목록으로 렌더링)
 * - 예약 상태(status)에 따라 취소/결제하기/리뷰작성 버튼을 다르게 노출
 * - 실제 취소/결제 처리는 부모(ReservationList)에서 내려주는 콜백이 담당하며,
 *   이 컴포넌트 자체는 reservationStore를 직접 사용하지 않음 (상태는 부모가 관리)
 */
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import type { Reservation, ReservationStatus } from "../../types";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; icon: ReactNode; color: string }> = {
  PENDING:   { label: "승인 대기", icon: <Clock size={12} />,        color: "text-accent bg-accent/10" },
  RESERVED:  { label: "예약 확정", icon: <CheckCircle size={12} />,  color: "text-primary bg-primary/10" },
  COMPLETED: { label: "이용 완료", icon: <CheckCircle size={12} />,  color: "text-muted-foreground bg-muted" },
  CANCELLED: { label: "예약 취소", icon: <XCircle size={12} />,      color: "text-destructive bg-destructive/10" },
  REJECTED:  { label: "예약 거절", icon: <AlertCircle size={12} />,  color: "text-destructive bg-destructive/10" },
};

interface ReservationCardProps {
  reservation: Reservation;
  onCampClick: (campId: number) => void;
  onCancel?: (reservationId: number) => void;
  onPay?: (reservationId: number) => void;
  onReview?: (campId: number) => void;
}

export default function ReservationCard({ reservation, onCampClick, onCancel, onPay, onReview }: ReservationCardProps) {
  const cfg = STATUS_CONFIG[reservation.status];
  const nights = Math.round((new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / 86400000);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex gap-4">
        <img
          src={reservation.campImage}
          alt={reservation.campName}
          className="w-20 h-16 rounded-xl object-cover flex-shrink-0 bg-muted"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <button onClick={() => onCampClick(reservation.campId)} className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1">
              {reservation.campName}
            </button>
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <div className="text-xs text-muted-foreground mb-2">
            {reservation.checkInDate} ~ {reservation.checkOutDate} ({nights}박) · {reservation.guestCount}명
          </div>
          {reservation.amount && (
            <div className="text-sm font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{reservation.amount.toLocaleString()}
              <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded ${reservation.paymentStatus === "PAID" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {reservation.paymentStatus === "PAID" ? "결제완료" : "미결제"}
              </span>
            </div>
          )}
        </div>
      </div>
      {(reservation.status === "PENDING" || reservation.status === "RESERVED") && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onCancel?.(reservation.reservationId)}
            className="flex-1 py-2 rounded-xl border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all"
          >
            예약 취소
          </button>
          {reservation.status === "PENDING" && reservation.paymentStatus !== "PAID" && (
            <button
              onClick={() => onPay?.(reservation.reservationId)}
              className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all"
            >
              결제하기
            </button>
          )}
        </div>
      )}
      {reservation.status === "COMPLETED" && (
        <div className="mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onReview?.(reservation.campId)}
            className="w-full py-2 rounded-xl border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-1"
          >
            <Star size={12} /> 리뷰 작성하기
          </button>
        </div>
      )}
    </div>
  );
}
