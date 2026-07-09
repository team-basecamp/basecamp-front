import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CheckCircle } from "lucide-react";
import useReservationStore from "../../store/reservationStore";
import type { Camp } from "../../types";

interface PaymentLocationState {
  camp: Camp;
  reservation?: { name: string; phone: string; checkin: string; checkout: string; people: number; request: string };
  reservationId?: number;
}

/**
 * 결제 페이지 (/payment)
 * - 예약 플로우의 2단계(결제 수단 선택/약관 동의) 및 3단계(결제 완료 안내)를 한 컴포넌트에서 step으로 분기 처리
 * - ReservationPage에서 navigate state로 전달된 camp/reservation 정보가 없으면 접근 불가 안내를 보여줌
 * - reservationId가 있는 경우(기존 예약 결제) markPaid로 store 상태를 결제완료로 갱신
 */
export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PaymentLocationState | null;
  const markPaid = useReservationStore((s) => s.markPaid);

  const [step, setStep] = useState<2 | 3>(2); // 2: 결제 수단/약관 동의, 3: 결제 완료 안내
  const [agreed, setAgreed] = useState(false);

  if (!state?.camp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">예약 정보가 없습니다. 캠핑장을 먼저 선택해주세요.</p>
        <button onClick={() => navigate("/campsites")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          캠핑장 둘러보기
        </button>
      </div>
    );
  }

  const { camp } = state;
  const price = camp.price ?? 0;

  if (step === 3) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>예약 완료!</h2>
        <p className="text-muted-foreground mb-2">{camp.facltNm}</p>
        <p className="text-muted-foreground text-sm mb-8">
          예약 확인 메일이 발송되었습니다. 멋진 캠핑 되세요! 🏕️
        </p>
        <button onClick={() => navigate("/")} className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all">
          홈으로 돌아가기
        </button>
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
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all bg-primary text-primary-foreground">
            1
          </div>
          <span className="text-sm text-foreground font-medium">예약 정보</span>
          <ChevronRight size={14} className="text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all bg-primary text-primary-foreground">
            2
          </div>
          <span className="text-sm text-foreground font-medium">결제</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Payment methods */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>결제 수단</h3>
          {["신용카드 / 체크카드", "카카오페이", "네이버페이", "토스페이"].map((method, i) => (
            <label key={method} className="flex items-center gap-3 py-3 cursor-pointer border-b border-border last:border-0">
              <input type="radio" name="payment" defaultChecked={i === 0} className="accent-primary" />
              <span className="text-sm">{method}</span>
            </label>
          ))}
        </div>

        {/* Price summary */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-3">결제 금액</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">캠핑 요금</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>₩{price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">서비스 수수료</span>
              <span style={{ fontFamily: "'DM Mono', monospace" }}>₩2,000</span>
            </div>
            <div className="flex justify-between font-bold border-t border-border pt-2 mt-2">
              <span>총 결제금액</span>
              <span className="text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
                ₩{(price + 2000).toLocaleString()}
              </span>
            </div>
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

        <button
          onClick={() => {
            if (!agreed) return;
            if (state.reservationId) markPaid(state.reservationId);
            setStep(3);
          }}
          disabled={!agreed}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          결제하기
        </button>
      </div>
    </div>
  );
}
