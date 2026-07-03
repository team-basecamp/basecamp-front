import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import CampCard from "../../components/common/CampCard";
import { CAMPS, REGIONS, TAGS_FILTER } from "../../data/camps";
import type { Camp } from "../../types";
import "./CampsiteListPage.css";

const PAGE_SIZE = 6;

/**
 * 캠핑장 목록 페이지 (/campsites)
 * - 검색어(?q=), 지역/유형/가격 필터, 정렬 옵션을 조합해 data/camps.ts의 mock 데이터를 클라이언트에서 직접 필터링·정렬
 * - 실제 서버 페이지네이션 없이 IntersectionObserver로 스크롤 시 PAGE_SIZE만큼 목록을 더 보여주는 무한 스크롤 UI만 흉내냄 (setTimeout으로 로딩 지연 연출)
 * - 홈페이지의 검색/카테고리 클릭이 여기로 들어와 query state에 반영됨 (URL의 q 파라미터와 동기화)
 */
export default function CampsiteListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [region, setRegion] = useState("전체");
  const [tag, setTag] = useState("전체");
  const [sort, setSort] = useState("추천순");
  const [priceMax, setPriceMax] = useState(100000);

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); // 현재까지 화면에 보여줄 개수 (무한 스크롤로 증가)
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null); // 무한 스크롤 감지를 위한 하단 관찰 대상

  const onCampClick = (camp: Camp) => navigate(`/campsites/${camp.contentId}`);

  // Apply filters
  const filtered = CAMPS.filter((c) => {
    const matchQ = !query || c.facltNm.includes(query) || c.addr1.includes(query) || (c.region ?? "").includes(query);
    const matchR = region === "전체" || c.region === region;
    const matchT = tag === "전체" || (c.tags ?? []).includes(tag);
    const matchP = (c.price ?? 0) <= priceMax;
    return matchQ && matchR && matchT && matchP;
  }).sort((a, b) => {
    if (sort === "평점순") return b.rating - a.rating;
    if (sort === "리뷰많은순") return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
    if (sort === "가격낮은순") return (a.price ?? 0) - (b.price ?? 0);
    return b.rating - a.rating;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  // Reset pagination when filters change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [query, region, tag, sort, priceMax]);

  // Keep URL query param in sync
  useEffect(() => {
    setSearchParams(query ? { q: query } : {}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Infinite scroll via IntersectionObserver
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((n) => n + PAGE_SIZE);
      setLoading(false);
    }, 600);
  }, [loading, hasMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Search bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 flex items-center gap-3 bg-card border border-border rounded-xl px-4">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="캠핑장 이름, 지역 검색..."
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button onClick={() => setQuery("")}>
              <X size={14} className="text-muted-foreground" />
            </button>
          )}
        </div>
        <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          검색
        </button>
      </div>

      {/* Filters */}
      <div className="filter-panel bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        {/* Region */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">지역</p>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  region === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">유형</p>
          <div className="flex flex-wrap gap-2">
            {TAGS_FILTER.map((t) => (
              <button
                key={t}
                onClick={() => setTag(t)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${
                  tag === t ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Price + Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">
              최대 금액: <span style={{ fontFamily: "'DM Mono', monospace" }}>₩{priceMax.toLocaleString()}</span>
            </p>
            <input
              type="range"
              min={20000}
              max={100000}
              step={5000}
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-48 accent-primary"
            />
          </div>
          <div className="sm:ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm outline-none"
            >
              {["추천순", "평점순", "리뷰많은순", "가격낮은순"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground mb-4">
        <span className="text-foreground font-bold">{filtered.length}개</span>의 캠핑장
        {filtered.length !== CAMPS.length && " (필터 적용됨)"}
      </p>

      {/* Grid */}
      {visible.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((camp, i) => (
            <div
              key={camp.contentId}
              className="camp-grid-item"
              style={{ animationDelay: `${(i % PAGE_SIZE) * 0.05}s` }}
            >
              <CampCard camp={camp} onClick={() => onCampClick(camp)} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🏕️</p>
          <p>검색 결과가 없습니다. 조건을 바꿔보세요.</p>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="sentinel mt-6" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="loading-spinner" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && visible.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">
          모든 캠핑장을 불러왔습니다 ({filtered.length}개)
        </p>
      )}
    </div>
  );
}
