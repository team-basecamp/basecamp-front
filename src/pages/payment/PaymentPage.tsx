import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle } from "lucide-react";
import {
  preparePayment,
  completePayment,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "../../api/payment";
import { requestPortOnePayment } from "../../lib/portone";
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
 *
 * 포트원(PortOne) V2 결제 흐름 — 세 단계 모두 성공해야 결제가 확정된다:
 *   1) preparePayment      서버가 결제 건을 등록하고 결제창 파라미터를 내려준다
 *   2) requestPortOnePayment  결제창에서 실제 결제
 *   3) completePayment     서버가 포트원에 직접 조회해 금액까지 확인하고 예약을 PENDING 으로 전이
 *
 * 결제창이 성공으로 닫혀도 3단계 전까지는 예약이 확정된 게 아니다. 결제 결과는 브라우저에서
 * 얼마든지 위조할 수 있어서, 서버가 포트원에 다시 물어본 답만 신뢰한다.
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
  // 결제창이 뜬 뒤 어디까지 진행됐는지 버튼에 보여준다. 결제는 단계가 여럿이라
  // "처리 중" 한 마디로는 사용자가 멈춘 건지 진행 중인지 알 수 없다.
  const [phase, setPhase] = useState<"idle" | "preparing" | "paying" | "confirming">("idle");

  // 예약 생성 없이 직접 들어온 경우 결제할 대상이 없다
  if (!state?.camp || !state.reservationId) {
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
      // 1) 결제 준비 — 금액/채널/주문명은 전부 서버가 정한다.
      setPhase("preparing");
      const prepared = await preparePayment({ reservationId, paymentMethod: method });

      // 2) 결제창 — 모바일은 결제 앱으로 이동했다가 redirectUrl 로 돌아온다.
      setPhase("paying");
      const result = await requestPortOnePayment(
        prepared,
        `${window.location.origin}/payment/complete`
      );

      // `!result.ok` 나 else 분기로 쓰면 안 된다. 이 프로젝트는 tsconfig 가 strict:false 라
      // (= strictNullChecks 꺼짐) 판별 유니온의 "부정" 좁히기가 동작하지 않아,
      // result 가 실패 타입으로 좁혀지지 않고 message/cancelled 접근이 컴파일 에러가 난다.
      // 명시적 `=== false` 비교만 좁히기가 먹는다.
      if (result.ok === false) {
        // 사용자가 스스로 닫은 것은 오류가 아니다. 조용히 원래 화면으로 돌려보낸다.
        setError(result.cancelled ? null : result.message);
        return;
      }

      // 3) 서버 확정 — 여기까지 성공해야 예약이 잡힌다.
      setPhase("confirming");
      await completePayment(result.paymentId);
      setStep(3);
    } catch (e: any) {
      console.error("결제 실패:", e);
      setError(
        e?.response?.data?.message ??
        "결제에 실패했습니다. 결제 대기 시간이 지났다면 예약을 다시 진행해주세요."
      );
    } finally {
      setPhase("idle");
      setSubmitting(false);
    }
  };

  // 버튼 문구. 결제창이 떠 있는 동안에도 무엇을 기다리는지 알 수 있게 한다.
  const buttonLabel = () => {
    switch (phase) {
      case "preparing": return "결제 준비 중...";
      case "paying": return "결제창에서 진행해주세요...";
      case "confirming": return "결제 확인 중...";
      default: return `₩${totalPrice.toLocaleString()} 결제하기`;
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
                disabled={submitting}
                className="accent-primary"
              />
              <span className="text-sm">{PAYMENT_METHOD_LABELS[m]}</span>
            </label>
          ))}
          <p className="text-xs text-muted-foreground mt-3">
            테스트 모드로 동작합니다. 실제로 결제가 이뤄지지 않습니다.
          </p>
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
          {buttonLabel()}
        </button>
      </div>
    </div>
  );
}
