import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle } from "lucide-react";
import {
  createPayment,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "../../api/payment";
import type { Camp } from "../../types";

interface PaymentLocationState {
  camp: Camp;
  reservation?: { name: string; phone: string; checkin: string; checkout: string; people: number; request: string };
  reservationId?: number;
  totalPrice?: number;
}

/**
 * 결제 페이지 (/payment)
 * - 예약 플로우 2단계(결제 수단 선택/약관 동의) → 3단계(완료 안내)
 * - ReservationPage 에서 createReservation 으로 만든 예약(PENDING_PAYMENT)을 결제한다.
 * - 결제 금액은 서버가 예약의 totalPrice 로 직접 계산한다. 화면 금액은 표시용일 뿐이다.
 */
export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentLocationState | null;

  const [step, setStep] = useState<2 | 3>(2);
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("CARD");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 예약 생성 없이 직접 들어온 경우 결제할 대상이 없다
  if (!state?.camp || !state.reservationId) {
    console.log("state 전체:", JSON.stringify(state, null, 2));
console.log("camp:", state?.camp);
console.log("reservationId:", state?.reservationId);
console.log("totalPrice:", state?.totalPrice);
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">예약 정보가 없습니다. 캠핑장을 먼저 선택해주세요.</p>
        <button onClick={() => navigate("/campsites")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          캠핑장 둘러보기
        </button>
      </div>
    );
  }

  const { camp, reservationId } = state;
  const totalPrice = state.totalPrice ?? 0;

  const handlePay = async () => {
    if (!agreed || submitting) return;

    setError(null);
    setSubmitting(true);
    try {
      // amount 는 보내지 않는다. 서버가 예약의 totalPrice 로 결제한다.
      await createPayment({ reservationId, paymentMethod: method });
      setStep(3);
    } catch (e: any) {
      console.error("결제 실패:", e);
      setError(
        e?.response?.data?.message ??
        "결제에 실패했습니다. 결제 대기 시간이 지났다면 예약을 다시 진행해주세요."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 3) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>결제 완료!</h2>
        <p className="text-muted-foreground mb-2">{camp.facltNm}</p>
        <p className="text-muted-foreground text-sm mb-8">
          캠핑장의 예약 승인을 기다리는 중입니다. 승인되면 알려드릴게요 🏕️
        </p>
        <div className="flex gap-2 justify-center">
          <button onClick={() => navigate("/reservations")} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all">
            예약 내역 보기
          </button>
          <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-all">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">1</div>
          <span className="text-sm text-foreground font-medium">예약 정보</span>
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary text-primary-foreground">2</div>
          <span className="text-sm text-foreground font-medium">결제</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Payment methods */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>결제 수단</h3>
          {PAYMENT_METHODS.map((m) => (
            <label key={m} className="flex items-center gap-3 py-3 cursor-pointer border-b border-border last:border-0">
              <input
                type="radio"
                name="payment"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="accent-primary"
              />
              <span className="text-sm">{PAYMENT_METHOD_LABELS[m]}</span>
            </label>
          ))}
        </div>

        {/* Price summary */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-3">결제 금액</h3>
          <div className="flex justify-between font-bold">
            <span>총 결제금액</span>
            <span className="text-primary text-lg" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-primary" />
          <span className="text-sm text-muted-foreground">
            예약 및 결제 관련{" "}
            <span className="text-primary underline">이용약관</span>과{" "}
            <span className="text-primary underline">개인정보처리방침</span>에 동의합니다.
          </span>
        </label>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={handlePay}
          disabled={!agreed || submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? "결제 처리 중..." : `₩${totalPrice.toLocaleString()} 결제하기`}
        </button>
      </div>
    </div>
  );
}