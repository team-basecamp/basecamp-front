import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Calendar } from "lucide-react";
import { getMyCampsites } from "../../api/campsite";
import {
  getCampsiteReservations,
  approveReservation,
  rejectReservation,
  type ReservationResponse,
} from "../../api/reservation";
import type { Camp } from "../../types";
import BusinessHeader from "./BusinessHeader";

/**
 * 캠핑업체 예약 관리 화면 (/business/reservations)
 * - GET /v1/camps/my 로 내 캠핑장을 가져와 선택 → 그 캠핑장의 예약 목록을 조회
 * - PENDING(승인 대기) 예약을 수락(approve) / 거절(reject) 처리
 * - 거절 시 사유 필수 (reservations.reject_reason)
 * - 서버는 CANCELLED 를 제외한 전체를 내려주므로, PENDING 필터는 클라이언트에서 건다
 */

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: "text-muted-foreground bg-muted",
  PENDING: "text-accent bg-accent/10",
  RESERVED: "text-primary bg-primary/10",
  CANCELLED: "text-destructive bg-destructive/10",
  REJECTED: "text-muted-foreground bg-muted",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_PAYMENT: "결제 대기",
  PENDING: "승인 대기",
  RESERVED: "예약 확정",
  CANCELLED: "취소",
  REJECTED: "거절",
};

export default function ReservationManagePage() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [campId, setCampId] = useState<number | null>(null);
  const [reservations, setReservations] = useState<ReservationResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(true);

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  // 1. 내 캠핑장 목록 → 첫 캠핑장 자동 선택
  //    응답은 CampListResponseDto envelope 이라 실제 배열은 res.data 안에 있다.
  useEffect(() => {
    let cancelled = false;
    getMyCampsites()
      .then((res) => {
        if (cancelled) return;
        const list = res.data ?? [];
        setCamps(list);
        if (list.length > 0) setCampId(list[0].campId);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.message ?? "캠핑장 목록을 불러오지 못했습니다");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // 2. 선택된 캠핑장의 예약 목록
  useEffect(() => {
    if (campId == null) return;
    let cancelled = false;
    setError(null);
    getCampsiteReservations(campId, { page: 0, size: 50 })
      .then((page) => { if (!cancelled) setReservations(page.content); })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.message ?? "예약 목록을 불러오지 못했습니다");
      });
    return () => { cancelled = true; };
  }, [campId]);

  const pendingCount = reservations.filter((r) => r.status === "PENDING").length;
  const visible = onlyPending
    ? reservations.filter((r) => r.status === "PENDING")
    : reservations;

  const handleApprove = async (id: number) => {
    setProcessingId(id);
    setError(null);
    try {
      const updated = await approveReservation(id);
      setReservations((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "예약 수락에 실패했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  const startReject = (id: number) => {
    setRejectingId(id);
    setRejectReasonInput("");
  };

  const confirmReject = async () => {
    if (!rejectingId || !rejectReasonInput.trim()) return;
    setProcessingId(rejectingId);
    setError(null);
    try {
      const updated = await rejectReservation(rejectingId, rejectReasonInput.trim());
      setReservations((prev) => prev.map((r) => (r.id === rejectingId ? updated : r)));
      setRejectingId(null);
      setRejectReasonInput("");
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "예약 거절에 실패했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <BusinessHeader active="reservations" />
        <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중...</p>
      </div>
    );
  }

  if (camps.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <BusinessHeader active="reservations" />
        <div className="py-16 text-center text-muted-foreground">
          <Calendar size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">등록된 캠핑장이 없습니다. 먼저 캠핑장을 등록해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="reservations" />

      {/* 캠핑장이 2개 이상일 때만 선택 UI 노출 */}
      {camps.length > 1 && (
        <select
          value={campId ?? ""}
          onChange={(e) => setCampId(Number(e.target.value))}
          className="mb-4 bg-muted rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
        >
          {camps.map((c) => (
            <option key={c.campId} value={c.campId}>{c.facltNm}</option>
          ))}
        </select>
      )}

      {/* 상태 필터 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setOnlyPending(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            onlyPending ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          승인 대기 {pendingCount}
        </button>
        <button
          onClick={() => setOnlyPending(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !onlyPending ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          전체 {reservations.length}
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 mb-4">{error}</p>
      )}

      <div className="space-y-4">
        {visible.map((res) => (
          <div key={res.id} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[res.status]}`}>
                    {STATUS_LABELS[res.status]}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    #REZ{String(res.id).padStart(4, "0")}
                  </span>
                </div>

                <p className="font-semibold text-sm">
                  예약자: {res.customerName}
                  <span className="text-muted-foreground font-normal ml-2">{res.customerPhone}</span>
                </p>

                <p className="text-xs text-muted-foreground mt-0.5">
                  {res.checkInDate} ~ {res.checkOutDate} · {res.guestCount}명
                  <span className="ml-2">· ₩{res.totalPrice.toLocaleString()}</span>
                </p>

                {res.specialRequest && (
                  <p className="text-xs text-muted-foreground mt-1.5">요청사항: {res.specialRequest}</p>
                )}
              </div>

              {res.status === "PENDING" && rejectingId !== res.id && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(res.id)}
                    disabled={processingId === res.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={12} /> {processingId === res.id ? "처리 중..." : "수락"}
                  </button>
                  <button
                    onClick={() => startReject(res.id)}
                    disabled={processingId === res.id}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/40 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <XCircle size={12} /> 거절
                  </button>
                </div>
              )}
            </div>

            {/* 거절 사유 입력 */}
            {rejectingId === res.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <textarea
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  placeholder="거절 사유를 입력해주세요 (예약자에게 안내됩니다)"
                  rows={2}
                  className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setRejectingId(null)}
                    className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmReject}
                    disabled={!rejectReasonInput.trim() || processingId === res.id}
                    className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processingId === res.id ? "처리 중..." : "거절 확정"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {visible.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Calendar size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {onlyPending ? "승인 대기 중인 예약이 없습니다" : "예약 내역이 없습니다"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}