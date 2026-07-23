import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { useKakaoLoader } from "react-kakao-maps-sdk";
import { MapPin, Star } from "lucide-react";
import { CAMPS } from "../../data/camps";
import { getCampsites } from "../../api/campsite";
import { campKey } from "../../lib/camp";
import type { Camp } from "../../types";

/**
 * 지도 기반 캠핑장 탐색 페이지 (/map)
 * - Kakao Maps SDK로 지도에 캠핑장 마커를 표시하고, 옆 목록에서 선택하면 지도 중심이 이동
 * - 마커/목록 클릭 시 선택된 캠핑장을 강조하고, 상세보기 버튼으로 캠핑장 상세 페이지로 이동
 * - VITE_KAKAO_MAP_KEY 환경변수가 없으면 지도 대신 안내 메시지를 표시
 * - 캠핑장 목록은 백엔드(DB)에서 받아오고, 실패 시 mock 데이터(CAMPS)로 대체
 */
export default function MapPage() {
  const navigate = useNavigate();
  const [loading, error] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_KEY || "",
  });
  const [camps, setCamps] = useState<Camp[]>(CAMPS);
  const [selected, setSelected] = useState<Camp | null>(CAMPS[0] ?? null); // 지도/목록에서 현재 선택된 캠핑장

  useEffect(() => {
    getCampsites({ numOfRows: 500 })
      .then((res: any) => {
        const data: Camp[] = res.content;
        setCamps(data);
        setSelected(data[0] ?? null);
      })
      .catch(() => setCamps(CAMPS));
  }, []);

  // 자체 등록 캠핑장은 contentId가 null이라 campId로 식별해야 한다(상세 라우트는 파라미터명만
  // :contentId일 뿐 실제로는 campId를 받는다). CampsiteListPage와 동일하게 campKey로 통일한다.
  const onCampClick = (camp: Camp) => navigate(`/campsites/${campKey(camp)}`);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>지도로 캠핑장 찾기</h1>
        <p className="text-muted-foreground text-sm mt-1">지도에서 위치를 확인하고 캠핑장을 선택하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
        {/* Map */}
        <div className="h-[420px] lg:h-[560px] rounded-2xl overflow-hidden border border-border bg-muted">
          {error ? (
            <div className="w-full h-full flex items-center justify-center text-center text-muted-foreground text-sm px-6">
              지도를 불러올 수 없습니다. VITE_KAKAO_MAP_KEY 설정을 확인해주세요.
            </div>
          ) : loading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">지도를 불러오는 중...</div>
          ) : (
            <Map
              center={{ lat: selected?.mapY ?? 37.5665, lng: selected?.mapX ?? 126.978 }}
              level={selected ? 8 : 12}
              style={{ width: "100%", height: "100%" }}
            >
              {camps.filter((camp) => camp.mapY != null && camp.mapX != null).map((camp) => (
                <MapMarker
                  key={campKey(camp)}
                  position={{ lat: camp.mapY, lng: camp.mapX }}
                  onClick={() => setSelected(camp)}
                  title={camp.facltNm}
                />
              ))}
            </Map>
          )}
        </div>

        {/* Side panel — camp list */}
        <div className="space-y-3 max-h-[420px] lg:max-h-[560px] overflow-y-auto pr-1">
          {camps.map((camp) => (
            <div
              key={campKey(camp)}
              onClick={() => setSelected(camp)}
              className={`bg-card border rounded-2xl p-4 cursor-pointer transition-all ${selected && campKey(selected) === campKey(camp) ? "border-primary shadow-sm" : "border-border hover:border-primary/30"
                }`}
            >
              <div className="flex gap-3">
                {camp.image || camp.firstImageUrl ? (
                  <img
                    src={camp.image || camp.firstImageUrl}
                    alt={camp.facltNm}
                    className="w-16 h-14 rounded-xl object-cover flex-shrink-0 bg-muted"
                  />
                ) : (
                  <div className="w-16 h-14 rounded-xl flex-shrink-0 bg-secondary flex items-center justify-center text-lg">🏕️</div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1">{camp.facltNm}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin size={10} className="flex-shrink-0" />
                    <span className="truncate">{camp.addr1}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={11} className="fill-accent text-accent" />
                    <span className="text-xs font-semibold">{(camp.rating ?? camp.averageRating ?? 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              {selected && campKey(selected) === campKey(camp) && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCampClick(camp); }}
                  className="w-full mt-3 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all"
                >
                  캠핑장 상세보기
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
