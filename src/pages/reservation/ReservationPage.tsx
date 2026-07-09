import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { CAMPS } from "../../data/camps";

interface ReservationLocationState {
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
}

/**
 * 예약 정보 입력 페이지 (/campsites/:campsiteId/reservation)
 * - 예약자 정보/체크인·체크아웃/인원/요청사항을 입력받는 예약 플로우의 1단계(예약 정보 -> 결제)
 * - 입력값은 서버 저장 없이 navigate의 state로 결제 페이지(PaymentPage)에 그대로 전달됨
 * - 캠핑장 상세 페이지에서 미리 선택한 체크인/체크아웃/예약 명수가 있으면 navigate state로 넘어와 초기값으로 반영됨
 */
export default function ReservationPage() {
  const { campsiteId } = useParams<{ campsiteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const camp = CAMPS.find((c) => c.contentId === Number(campsiteId));
  const prefill = location.state as ReservationLocationState | null;

  const [form, setForm] = useState({
    name: "", phone: "",
    checkin: prefill?.checkIn ?? "",
    checkout: prefill?.checkOut ?? "",
    people: prefill?.guestCount ?? 1,
    request: "",
  });

  const updateForm = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (!camp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">캠핑장을 찾을 수 없습니다</p>
        <button onClick={() => navigate("/campsites")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          목록으로
        </button>
      </div>
    );
  }

  const goToPayment = () => {
    navigate("/payment", { state: { camp, reservation: form } });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate(`/campsites/${camp.contentId}`)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 뒤로
      </button>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all bg-primary text-primary-foreground">
            1
          </div>
          <span className="text-sm text-foreground font-medium">예약 정보</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Camp summary */}
        <div className="bg-card border border-border rounded-2xl p-5 flex gap-4">
          <img src={camp.image ?? camp.firstImageUrl} alt={camp.facltNm} className="w-24 h-20 rounded-xl object-cover flex-shrink-0" />
          <div>
            <h3 className="font-bold">{camp.facltNm}</h3>
            <p className="text-xs text-muted-foreground mt-1">{camp.addr1}</p>
            <p className="text-primary font-bold mt-2" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{(camp.price ?? 0).toLocaleString()} / 박
            </p>
          </div>
        </div>

        {[
          { label: "예약자 이름", key: "name", type: "text", placeholder: "홍길동" },
          { label: "연락처", key: "phone", type: "tel", placeholder: "010-0000-0000" },
        ].map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
            <input
              type={f.type}
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChange={updateForm(f.key)}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          {[{ label: "체크인", key: "checkin" }, { label: "체크아웃", key: "checkout" }].map((f) => (
            <div key={f.key}>
              <label className="text-sm font-medium mb-1.5 block">{f.label}</label>
              <input
                type="date"
                value={(form as any)[f.key]}
                onChange={updateForm(f.key)}
                className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          ))}
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">예약 명수</label>
          <div className="flex items-center gap-3 bg-muted rounded-xl px-4 py-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, people: Math.max(1, f.people - 1) }))}
              disabled={form.people <= 1}
              className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={14} />
            </button>
            <span className="flex-1 text-center text-sm font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>{form.people}명</span>
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, people: f.people + 1 }))}
              className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">요청사항 <span className="text-muted-foreground font-normal">(선택)</span></label>
          <textarea
            rows={3}
            placeholder="캠핑장 측에 전달할 요청사항을 입력하세요"
            value={form.request}
            onChange={updateForm("request")}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
          />
        </div>

        <button onClick={goToPayment} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all">
          다음 — 결제 정보
        </button>
      </div>
    </div>
  );
}
