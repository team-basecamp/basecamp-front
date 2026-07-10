import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit3, Tent } from "lucide-react";
import { getMyCampsites } from "../../api/campsite";
import BusinessHeader from "./BusinessHeader";
import type { Camp } from "../../types";

/**
 * 내 캠핑장 관리 화면 (/business/campsites)
 * - 로그인한 회원이 등록한 캠핑장 전체를 GET /v1/camps/my로 조회해 카드 목록으로 보여줌
 * - "정보 수정"은 해당 캠핑장의 등록/수정 폼(CampsiteFormPage, /business/campsites/:contentId/edit)으로,
 *   "새 캠핑장 등록"은 같은 폼의 등록 모드(/business/campsites/new)로 이동
 *   (수정은 대응하는 백엔드 API가 아직 없어 실제로는 동작하지 않음)
 */
export default function CampsiteManagePage() {
  const navigate = useNavigate();
  const [myCamps, setMyCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getMyCampsites()
      .then((res: any) => setMyCamps(res.data ?? []))
      .catch(() => setErrorMsg("캠핑장 목록을 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="campsites" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/business/campsites/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={14} /> 새 캠핑장 등록
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {myCamps.map((camp) => {
          // 자체 등록 캠핑장은 contentId가 항상 null이라 실제 PK인 campId로 식별해야 함
          const id = camp.campId ?? camp.contentId;
          return (
            <div key={id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-48 bg-muted relative overflow-hidden">
                <img src={camp.firstImageUrl || camp.image} alt={camp.facltNm} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-4 text-white font-bold text-lg">{camp.facltNm}</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: "일반사이트", value: `${camp.gnrlSiteCo}개` },
                    { label: "오토사이트", value: `${camp.autoSiteCo}개` },
                    { label: "글램핑", value: `${camp.glampSiteCo}개` },
                    { label: "평점", value: `⭐ ${camp.averageRating ?? camp.rating ?? 0}` },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="font-bold text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/business/campsites/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    <Edit3 size={14} /> 정보 수정
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && myCamps.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Tent size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">등록된 캠핑장이 없습니다. 새 캠핑장을 등록해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
