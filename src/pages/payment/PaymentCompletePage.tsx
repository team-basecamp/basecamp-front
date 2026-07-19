import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { completePayment } from "../../api/payment";

/**
 * 결제 리다이렉트 복귀 페이지 (/payment/complete)
 *
 * 모바일에서는 결제창이 카카오페이·토스 같은 외부 앱으로 넘어가기 때문에, PC 처럼
 * requestPayment() 의 Promise 로 결과를 돌려받을 수 없다. 대신 포트원이 결제 후
 * redirectUrl(= 이 페이지)로 쿼리 파라미터를 붙여 되돌려 보낸다.
 *
 * 이 페이지는 그 복귀 지점이며, 하는 일은 PaymentPage 의 3단계와 같다:
 * 넘겨받은 paymentId 로 서버에 결제 완료 확인을 요청한다. 결제 확정의 근거는
 * 이 URL 파라미터가 아니라 서버가 포트원에 직접 조회한 결과다.
 *
 * location.state 는 리다이렉트를 넘어오지 못하므로 캠핑장 이름 같은 건 표시하지 않는다.
 */
export default function PaymentCompletePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<"confirming" | "success" | "failed">("confirming");
  const [error, setError] = useState<string | null>(null);

  // React 18+ StrictMode 는 개발 중 effect 를 두 번 실행한다. 중복 처리시 서버에서 멱등처리
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const paymentId = searchParams.get("paymentId");
    const code = searchParams.get("code");
    const message = searchParams.get("message");

    // 포트원은 실패했을 때 code 를 붙여 되돌려보낸다.
    if (code) {
      setError(message ?? "결제가 완료되지 않았습니다.");
      setStatus("failed");
      return;
    }

    if (!paymentId) {
      setError("결제 정보를 확인할 수 없습니다. 예약 내역에서 결제 상태를 확인해주세요.");
      setStatus("failed");
      return;
    }

    completePayment(paymentId)
      .then(() => setStatus("success"))
      .catch((e: any) => {
        setError(
          e?.response?.data?.message ??
          "결제 확인에 실패했습니다. 예약 내역에서 결제 상태를 확인해주세요."
        );
        setStatus("failed");
      });
  }, [searchParams]);

  if (status === "confirming") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted-foreground text-sm">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/40 flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-destructive" />
        </div>
        <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>결제 실패</h2>
        <p className="text-muted-foreground text-sm mb-8">{error}</p>
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
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={40} className="text-primary" />
      </div>
      <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>결제 완료!</h2>
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
