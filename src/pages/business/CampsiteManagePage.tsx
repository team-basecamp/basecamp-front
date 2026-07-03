import { useNavigate } from "react-router-dom";
import { Plus, Edit3, Tent } from "lucide-react";
import { CAMPS } from "../../data/camps";
import BusinessHeader, { MY_OWNER_ID } from "./BusinessHeader";

/**
 * 내 캠핑장 관리 화면 (/business/campsites)
 * - 업체(MY_OWNER_ID)가 소유한 캠핑장 전체를 카드 목록으로 보여줌 (ERD의 camps.owner_id 기준 필터링)
 * - "정보 수정"은 해당 캠핑장의 등록/수정 폼(CampsiteFormPage, /business/campsites/:contentId/edit)으로,
 *   "새 캠핑장 등록"은 같은 폼의 등록 모드(/business/campsites/new)로 이동
 */
export default function CampsiteManagePage() {
  const navigate = useNavigate();
  const myCamps = CAMPS.filter((c) => c.ownerId === MY_OWNER_ID);

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

      <div className="space-y-4">
        {myCamps.map((camp) => (
          <div key={camp.contentId} className="bg-card border border-border rounded-2xl overflow-hidden">
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
                  { label: "평점", value: `⭐ ${camp.rating}` },
                ].map((item) => (
                  <div key={item.label} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="font-bold text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/business/campsites/${camp.contentId}/edit`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  <Edit3 size={14} /> 정보 수정
                </button>
              </div>
            </div>
          </div>
        ))}
        {myCamps.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Tent size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">등록된 캠핑장이 없습니다. 새 캠핑장을 등록해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
