import { useQuery } from "@tanstack/react-query";
import { getRegionWeathers } from "../../api/weather";
import { getWeatherEmoji } from "../../lib/weatherIcon";

/**
 * 홈페이지 시/도별 날씨 위젯.
 * - 날씨는 부가 정보다. 조회에 실패해도 홈 전체가 깨지지 않도록 위젯만 조용히 숨긴다.
 * - 백엔드가 30분 캐시하므로 프론트도 같은 수준으로 staleTime 을 잡아 불필요한 재요청을 막는다.
 */
export default function RegionWeatherWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["regionWeathers"],
    queryFn: getRegionWeathers,
    staleTime: 1000 * 60 * 30,
  });

  if (isLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-28 rounded-xl bg-muted animate-pulse" />
      </section>
    );
  }

  // 위젯 하나 때문에 홈페이지에 에러 화면을 띄우지 않는다.
  if (isError || !data?.length) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h2 className="text-xl font-bold mb-1">지역별 날씨</h2>
      <p className="text-sm text-muted-foreground mb-4">떠나기 전 오늘의 날씨를 확인해 보세요</p>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {data.map((region) => (
          <div
            key={region.regionName}
            className="flex-shrink-0 w-[104px] rounded-xl border bg-white p-3 text-center"
          >
            <div className="text-3xl mb-1">{getWeatherEmoji(region.icon)}</div>
            <div className="text-xs text-muted-foreground truncate" title={region.regionName}>
              {region.regionName}
            </div>
            {/* 조회에 실패한 지역만 값이 null 로 온다. 그 지역만 "—" 로 표시한다. */}
            <div className="text-lg font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>
              {region.temp !== null ? `${Math.round(region.temp)}°` : "—"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {region.condition ?? "정보 없음"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
