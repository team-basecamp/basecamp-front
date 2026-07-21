import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { getCampsiteDetail } from "../../api/campsite";
import { createReservation } from "../../api/reservation";
import type { Camp } from "../../types";

interface ReservationLocationState {
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  camp?: Camp;
}

/** 백엔드 정규식과 동일 (하이픈 필수) */
const PHONE_REGEX = /^01(?:0|1|[6-9])-\d{3,4}-\d{4}$/;

/** 숫자만 남기고 010-1234-5678 형태로 하이픈을 넣는다 */
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  const middle = digits.length === 11 ? 4 : 3;
  return `${digits.slice(0, 3)}-${digits.slice(3, 3 + middle)}-${digits.slice(3 + middle)}`;
};

/** Date → yyyy-MM-dd (로컬 시간 기준. toISOString은 UTC라 새벽에 하루 밀린다) */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** yyyy-MM-dd 문자열에 하루를 더한다 */
const addDay = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
};

export default function ReservationPage() {
  const { campsiteId } = useParams<{ campsiteId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as ReservationLocationState | null;

  // 상세 페이지에서 camp를 넘겨줬으면 재조회 생략, 아니면 API 조회 (새로고침 대응)
  const [camp, setCamp] = useState<Camp | undefined>(prefill?.camp);
  const [campLoading, setCampLoading] = useState(!prefill?.camp);

  useEffect(() => {
    if (prefill?.camp) return;
    let cancelled = false;
    getCampsiteDetail(Number(campsiteId))
      .then((res: any) => { if (!cancelled) setCamp(res); })
      .finally(() => { if (!cancelled) setCampLoading(false); });
    return () => { cancelled = true; };
  }, [campsiteId]);

  const [form, setForm] = useState({
    name: "", phone: "",
    checkin: prefill?.checkIn ?? "",
    checkout: prefill?.checkOut ?? "",
    people: prefill?.guestCount ?? 1,
    request: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 백엔드 @Future 검증 때문에 오늘은 선택 불가. 체크인은 내일부터
  const tomorrow = addDay(toDateStr(new Date()));
  // 체크아웃은 체크인 다음 날부터 (체크인 미선택이면 모레)
  const minCheckOut = form.checkin ? addDay(form.checkin) : addDay(tomorrow);

  const updateForm = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  if (campLoading) {
    return <div className="max-w-lg mx-auto px-4 py-20 text-center text-muted-foreground">불러오는 중...</div>;
  }

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

  // 총액 계산 (박 수 × 1박 요금)
  const nights = form.checkin && form.checkout
    ? Math.max(0, Math.round((new Date(form.checkout).getTime() - new Date(form.checkin).getTime()) / 86_400_000))
    : 0;
  const totalPrice = (camp.price ?? 0) * nights;
  

  const validate = (): string | null => {
    if (!form.name.trim()) return "예약자 이름을 입력해주세요";
    if (!form.phone.trim()) return "연락처를 입력해주세요";
    if (!form.checkin || !form.checkout) return "체크인·체크아웃 날짜를 선택해주세요";
    if (nights <= 0) return "체크아웃 날짜는 체크인 날짜보다 이후여야 합니다";
    return null;
  };

  const goToPayment = async () => {
    const message = validate();
    if (message) { setError(message); return; }

    setError(null);
    setSubmitting(true);
    try {
      const reservation = await createReservation({
        campId: (camp as any).campId,
        checkInDate: form.checkin,
        checkOutDate: form.checkout,
        guestCount: form.people,
        totalPrice,
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        specialRequest: form.request.trim() || undefined,
      });

      // 예약은 PENDING_PAYMENT 상태로 생성됨 → 결제 페이지로 reservationId 전달
      navigate("/payment", {
        state: { camp, reservation: form, reservationId: reservation.id, totalPrice },
      });
    } catch (e: any) {
        const code = e?.response?.data?.code;
      if (code === "DUPLICATE_RESERVATION" || e?.response?.status === 409) {
        setError("해당 기간에 이미 예약이 있습니다");
      } else if (e?.response?.status === 401) {
        navigate("/login", { state: { from: location.pathname } });
        return;
      } else {
        setError(e?.response?.data?.message ?? "예약에 실패했습니다. 잠시 후 다시 시도해주세요");
      }
    } finally {
      setSubmitting(false);
    }
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

        <div>
          <label className="text-sm font-medium mb-1.5 block">예약자 이름</label>
          <input
            type="text"
            placeholder="홍길동"
            value={form.name}
            onChange={updateForm("name")}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">연락처</label>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="010-0000-0000"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
            maxLength={13}
            className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 체크인 */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">체크인</label>
            <input
              type="date"
              min={tomorrow}
              value={form.checkin}
              onChange={(e) => {
                const value = e.target.value;
                setForm((f) => ({
                  ...f,
                  checkin: value,
                  // 체크인이 바뀌어 체크아웃이 유효 범위를 벗어나면 초기화
                  checkout: f.checkout && f.checkout <= value ? "" : f.checkout,
                }));
              }}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* 체크아웃 */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">체크아웃</label>
            <input
              type="date"
              min={minCheckOut}
              value={form.checkout}
              onChange={(e) => setForm((f) => ({ ...f, checkout: e.target.value }))}
              disabled={!form.checkin}
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
            />
          </div>
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

        {/* 총액 */}
        {nights > 0 && (
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{nights}박 · {form.people}명</span>
            <span className="font-bold text-lg" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{totalPrice.toLocaleString()}
            </span>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          onClick={goToPayment}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "예약 생성 중..." : "다음 — 결제 정보"}
        </button>
      </div>
    </div>
  );
}