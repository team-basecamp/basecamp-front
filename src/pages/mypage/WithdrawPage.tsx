import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";

const REASON_OPTIONS = [
  "서비스 이용 빈도가 낮아서",
  "원하는 캠핑장을 찾기 어려워서",
  "서비스 이용에 불만족해서",
  "개인정보 보호를 위해",
  "기타",
];

/**
 * 회원 탈퇴 (/mypage/withdraw)
 * - 탈퇴 사유 선택(form) -> 최종 확인(confirm) -> 완료(done) 3단계 흐름으로 진행되는 페이지
 * - 실수로 바로 탈퇴되지 않도록 form에서 confirm 단계를 한 번 더 거치게 함 (2단계 확인 흐름)
 */
export default function WithdrawPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [reason, setReason] = useState(""); // 선택한 탈퇴 사유 (REASON_OPTIONS 중 하나)
  const [detail, setDetail] = useState(""); // 사유가 "기타"일 때 직접 입력하는 텍스트
  // form: 사유 선택 화면 / confirm: 최종 확인 화면 / done: 탈퇴 완료 화면
  const [step, setStep] = useState<"form" | "confirm" | "done">("form");

  if (!user) return <RequireLogin />;

  const finalReason = reason === "기타" ? detail.trim() : reason;
  const canSubmit = reason !== "" && (reason !== "기타" || detail.trim().length > 0);

  // confirm 단계에서 "탈퇴 확정"을 눌렀을 때만 호출되는 실제 탈퇴 처리 (form 단계의 "탈퇴 신청하기"는 confirm 단계로 넘어갈 뿐 아직 탈퇴를 확정하지 않음)
  const confirmWithdraw = () => {
    // Mock 탈퇴 처리 — 실제 백엔드 연동 시 api/auth.ts의 withdraw(finalReason) 호출로 교체
    logout();
    setStep("done");
  };

  if (step === "done") {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>회원 탈퇴가 완료되었습니다</h2>
        <p className="text-muted-foreground text-sm mb-1">그동안 Basecamp를 이용해주셔서 감사합니다.</p>
        <p className="text-muted-foreground text-xs mb-8">접수된 탈퇴 사유: {finalReason}</p>
        <button onClick={() => navigate("/")} className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all">
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate("/mypage")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 마이페이지
      </button>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>회원 탈퇴</h1>
      <p className="text-muted-foreground text-sm mb-8">
        탈퇴 시 예약 내역, 찜 목록, 작성한 게시글 등 모든 정보가 삭제되며 복구할 수 없습니다.
      </p>

      {step === "form" && (
        <div className="space-y-5">
          <div>
            <label className="text-sm font-semibold mb-2 block">탈퇴 사유를 선택해주세요</label>
            <div className="space-y-2">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setReason(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    reason === opt
                      ? "border-primary bg-secondary text-primary font-medium"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {reason === "기타" && (
            <div>
              <label className="text-sm font-semibold mb-2 block">사유를 입력해주세요</label>
              <textarea
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="탈퇴 사유를 입력해주세요"
                rows={4}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
              />
            </div>
          )}

          <button
            onClick={() => canSubmit && setStep("confirm")}
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl bg-destructive text-white font-bold hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            탈퇴 신청하기
          </button>
        </div>
      )}

      {step === "confirm" && (
        <div className="bg-card border border-destructive/30 rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm mb-1">정말 탈퇴하시겠습니까?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                이 작업은 되돌릴 수 없습니다. 탈퇴 사유: <span className="text-foreground font-medium">{finalReason}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("form")} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-all">
              취소
            </button>
            <button onClick={confirmWithdraw} className="flex-1 py-2.5 rounded-xl bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-all">
              탈퇴 확정
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
