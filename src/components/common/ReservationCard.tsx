/**
 * 예약 1건 카드 (ReservationList가 목록으로 렌더링)
 * - 서버 ReservationResponse 를 그대로 받는다.
 * - 결제 여부는 별도 필드가 아니라 status 로 판정한다: PENDING_PAYMENT = 미결제, 그 외 = 결제 완료
 * - "이용 완료" 상태는 서버에 없다. RESERVED 이면서 체크아웃 날짜가 지났으면 완료로 본다.
 */
import type { ReactNode } from "react";
import { Star, CheckCircle, Clock, XCircle, AlertCircle, CreditCard } from "lucide-react";
import type { ReservationListResponse, ReservationStatus } from "../../api/reservation";

const STATUS_CONFIG: Record<ReservationStatus, { label: string; icon: ReactNode; color: string }> = {
  PENDING_PAYMENT: { label: "결제 대기", icon: <CreditCard size={12} />,  color: "text-accent bg-accent/10" },
  PENDING:         { label: "승인 대기", icon: <Clock size={12} />,       color: "text-accent bg-accent/10" },
  RESERVED:        { label: "예약 확정", icon: <CheckCircle size={12} />, color: "text-primary bg-primary/10" },
  CANCELLED:       { label: "예약 취소", icon: <XCircle size={12} />,     color: "text-destructive bg-destructive/10" },
  REJECTED:        { label: "예약 거절", icon: <AlertCircle size={12} />, color: "text-destructive bg-destructive/10" },
};

interface ReservationCardProps {
  reservation: ReservationListResponse;
  processing?: boolean;
  onCampClick: (campId: number) => void;
  onCancel?: (reservationId: number) => void;
  onPay?: (reservationId: number) => void;
  onReview?: (campId: number, reservationId: number) => void;
}

export default function ReservationCard({
  reservation: res,
  processing = false,
  onCampClick,
  onCancel,
  onPay,
  onReview,
}: ReservationCardProps) {
  const cfg = STATUS_CONFIG[res.status];
  const nights = Math.round(
    (new Date(res.checkOutDate).getTime() - new Date(res.checkInDate).getTime()) / 86400000
  );

  const isPaid = res.status !== "PENDING_PAYMENT";
  const isCancelable = res.status !== "CANCELLED" && res.status !== "REJECTED";
  // 서버에 COMPLETED 상태가 없어, 확정된 예약의 체크아웃이 지났으면 이용 완료로 본다
  const isCompleted = res.status === "RESERVED" && new Date(res.checkOutDate) < new Date();

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex gap-4">
        {/* TODO: ReservationResponse 에 campImage 가 없다. 백엔드 DTO 에 추가되면 img 로 교체 */}
        {res.campImage ? (
          <img
            src={res.campImage}
            alt={res.campName}
            className="w-20 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-16 rounded-xl bg-muted flex-shrink-0 flex items-center justify-center text-2xl">
            🏕️
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            {/* TODO: ReservationResponse 에 campName 이 없다. 추가되면 이름으로 교체 */}
            <button
              onClick={() => onCampClick(res.campId)}
              className="font-semibold text-sm hover:text-primary transition-colors line-clamp-1 text-left"
            >
              {res.campName}
            </button>
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>

          <div className="text-xs text-muted-foreground mb-2">
            {res.checkInDate} ~ {res.checkOutDate} ({nights}박) · {res.guestCount}명
          </div>

          <div className="text-sm font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
            ₩{res.totalPrice.toLocaleString()}
            <span className={`ml-2 text-xs font-normal px-1.5 py-0.5 rounded ${isPaid ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              {isPaid ? "결제완료" : "미결제"}
            </span>
          </div>

          {res.specialRequest && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">요청사항: {res.specialRequest}</p>
          )}

          {res.status === "REJECTED" && res.rejectReason && (
            <p className="text-xs text-destructive mt-1.5">
              거절 사유: {res.rejectReason}
            </p>
          )}
        </div>
      </div>

      {/* 취소 / 결제 */}
      {isCancelable && !isCompleted && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onCancel?.(res.id)}
            disabled={processing}
            className="flex-1 py-2 rounded-xl border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {processing ? "처리 중..." : "예약 취소"}
          </button>
          {!isPaid && (
            <button
              onClick={() => onPay?.(res.id)}
              disabled={processing}
              className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {processing ? "처리 중..." : "결제하기"}
            </button>
          )}
        </div>
      )}

      {/* 이용 완료 → 리뷰. 이미 작성된 예약은 다시 작성 대상으로 보내지 않는다(409 방지) */}
      {isCompleted && (
        <div className="mt-3 pt-3 border-t border-border">
          {res.hasReview ? (
            <div className="w-full py-2 rounded-xl bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center gap-1">
              <Star size={12} /> 리뷰 작성 완료
            </div>
          ) : (
            <button
              onClick={() => onReview?.(res.campId, res.id)}
              className="w-full py-2 rounded-xl border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5 transition-all flex items-center justify-center gap-1"
            >
              <Star size={12} /> 리뷰 작성하기
            </button>
          )}
        </div>
      )}
    </div>
  );
}