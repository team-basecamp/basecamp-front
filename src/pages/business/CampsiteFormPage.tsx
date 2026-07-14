import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { AxiosError } from "axios";
import { createCampsite, getCampsiteDetail, updateCampsite } from "../../api/campsite";
import type { CampRegistrationRequest } from "../../types";

const INDUTY_OPTIONS = ["일반야영장", "오토캠핑장", "글램핑", "카라반"];

const EMPTY_FORM = {
  facltNm: "",
  addr1: "",
  addr2: "",
  tel: "",
  induty: INDUTY_OPTIONS[0],
  gnrlSiteCo: 0,
  autoSiteCo: 0,
  glampSiteCo: 0,
  price: 0,
  firstImageUrl: "",
  lineIntro: "",
  homepage: "",
};

interface ValidationErrorItem {
  field: string;
  value?: string;
  reason: string;
}

/**
 * 캠핑장 등록/수정 폼 (/business/campsites/new, /business/campsites/:contentId/edit)
 * - PostFormPage와 동일한 패턴: :contentId 파라미터 존재 여부로 등록/수정 모드를 나눔
 * - 등록(신규)은 POST /v1/camps/register, 수정은 PATCH /v1/camps/{campId} 실제 백엔드 API로 연동됨
 * - 수정 모드의 기존 정보는 GET /v1/camps/{campId}(실제 PK)로 백엔드에서 조회한다(mock 데이터에는 자체 등록 캠핑장이 없음)
 */
export default function CampsiteFormPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const isEdit = !!contentId;
  const campId = contentId ? Number(contentId) : undefined;

  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!campId) return;
    setLoading(true);
    getCampsiteDetail(campId)
      .then((res: any) => {
        const camp = res.data?.data ?? res.data;
        setForm({
          facltNm: camp.facltNm ?? "",
          addr1: camp.addr1 ?? "",
          addr2: camp.addr2 ?? "",
          tel: camp.tel ?? "",
          induty: camp.induty ?? INDUTY_OPTIONS[0],
          gnrlSiteCo: camp.gnrlSiteCo ?? 0,
          autoSiteCo: camp.autoSiteCo ?? 0,
          glampSiteCo: camp.glampSiteCo ?? 0,
          price: camp.price ?? 0,
          firstImageUrl: camp.firstImageUrl ?? "",
          lineIntro: camp.lineIntro ?? "",
          homepage: camp.homepage ?? "",
        });
      })
      .catch(() => setErrorMsg("캠핑장 정보를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [campId]);

  const updateField = <K extends keyof typeof form>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const raw = e.target.value;
    const isNumberField = key === "gnrlSiteCo" || key === "autoSiteCo" || key === "glampSiteCo" || key === "price";
    setForm((f) => ({ ...f, [key]: isNumberField ? Number(raw) : raw }));
  };

  const canSubmit = form.facltNm.trim().length > 0 && form.addr1.trim().length > 0 && !submitting;

  const onBack = () => navigate("/business/campsites");

  const onSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setErrorMsg(null);

    if (isEdit) {
      const payload = {
        facltNm: form.facltNm,
        addr1: form.addr1,
        addr2: form.addr2 || undefined,
        tel: form.tel,
        induty: form.induty,
        price: form.price,
        gnrlSiteCo: form.gnrlSiteCo,
        autoSiteCo: form.autoSiteCo,
        glampSiteCo: form.glampSiteCo,
        lineIntro: form.lineIntro || undefined,
        firstImageUrl: form.firstImageUrl || undefined,
        homepage: form.homepage || undefined,
      };

      try {
        await updateCampsite(campId!, payload);
        navigate("/business/campsites");
      } catch (err) {
        const axiosErr = err as AxiosError<{ message?: string; errors?: ValidationErrorItem[] }>;
        const validationMsg = axiosErr.response?.data?.errors?.map((e) => e.reason).join("\n");
        setErrorMsg(validationMsg || axiosErr.response?.data?.message || "캠핑장 수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // maxPeople, operatingHours, intro는 백엔드 CampRegistrationRequest에
    // 대응하는 필드가 없어 전송하지 않음(등록 API가 저장하지 않음)
    const payload: CampRegistrationRequest = {
      facltNm: form.facltNm,
      addr1: form.addr1,
      addr2: form.addr2 || undefined,
      tel: form.tel,
      induty: form.induty,
      price: form.price,
      gnrlSiteCo: form.gnrlSiteCo,
      autoSiteCo: form.autoSiteCo,
      glampSiteCo: form.glampSiteCo,
      lineIntro: form.lineIntro || undefined,
      firstImageUrl: form.firstImageUrl || undefined,
      homepage: form.homepage || undefined,
    };
    try {
      await createCampsite(payload);
      navigate("/business/campsites");
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string; errors?: ValidationErrorItem[] }>;
      const validationMsg = axiosErr.response?.data?.errors?.map((e) => e.reason).join("\n");
      setErrorMsg(validationMsg || axiosErr.response?.data?.message || "캠핑장 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 내 캠핑장
      </button>

      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {isEdit ? "캠핑장 정보 수정" : "새 캠핑장 등록"}
      </h1>

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중...</div>
      ) : (
      <div className="space-y-5">
        <div>
          <label className="text-sm font-semibold mb-1.5 block">시설명</label>
          <input
            type="text"
            value={form.facltNm}
            onChange={updateField("facltNm")}
            placeholder="캠핑장 이름"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">주소</label>
          <input
            type="text"
            value={form.addr1}
            onChange={updateField("addr1")}
            placeholder="도로명 주소"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">상세주소</label>
          <input
            type="text"
            value={form.addr2}
            onChange={updateField("addr2")}
            placeholder="동/호수 등 상세 주소 (선택)"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">전화번호</label>
            <input
              type="tel"
              value={form.tel}
              onChange={updateField("tel")}
              placeholder="033-000-0000"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">유형</label>
            <select
              value={form.induty}
              onChange={updateField("induty")}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              {INDUTY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">일반사이트</label>
            <input
              type="number" min={0}
              value={form.gnrlSiteCo}
              onChange={updateField("gnrlSiteCo")}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">오토사이트</label>
            <input
              type="number" min={0}
              value={form.autoSiteCo}
              onChange={updateField("autoSiteCo")}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">글램핑</label>
            <input
              type="number" min={0}
              value={form.glampSiteCo}
              onChange={updateField("glampSiteCo")}
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">1박 요금 (원)</label>
          <input
            type="number" min={0} step={1000}
            value={form.price}
            onChange={updateField("price")}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">캠핑장 웹사이트</label>
          <input
            type="text"
            value={form.homepage}
            onChange={updateField("homepage")}
            placeholder="www.example.com"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">대표 이미지 URL</label>
          <input
            type="text"
            value={form.firstImageUrl}
            onChange={updateField("firstImageUrl")}
            placeholder="https://..."
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        <div>
          <label className="text-sm font-semibold mb-1.5 block">한줄 소개</label>
          <input
            type="text"
            value={form.lineIntro}
            onChange={updateField("lineIntro")}
            placeholder="캠핑장을 한 문장으로 소개해주세요"
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive whitespace-pre-line">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onBack} className="px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (isEdit ? "수정 중..." : "등록 중...") : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
