import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import CampCard from "../../components/common/CampCard";
import { CAMPS, REGIONS, INDUTY_TYPES } from "../../data/camps";
import { getCampsites } from "../../api/campsite";
import type { Camp } from "../../types";
import "./CampsiteListPage.css";

const PAGE_SIZE = 6;

const SORT_OPTIONS = [
  { label: "추천순", value: "recommended" },
  { label: "평점순", value: "rating" },
  { label: "리뷰많은순", value: "reviewCount" },
  { label: "가격낮은순", value: "priceAsc" },
] as const;

/**
 * 캠핑장 목록 페이지 (/campsites)
 * - 검색어(?q=)/지역(?region=)/유형(?induty=)/정렬(?sort=)/최대금액(?priceMax=)을 조합해
 *   백엔드 GET /v1/camps/search를 호출(서버 사이드 필터링/정렬/페이징)
 * - 필터 변경 시 URL 쿼리파라미터에도 동기화되어 새로고침/뒤로가기에도 유지됨
 * - 무한 스크롤은 IntersectionObserver로 하단 도달 시 다음 페이지(pageNo+1)를 실제로 fetch
 */
export default function CampsiteListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [region, setRegion] = useState(searchParams.get("region") ?? "전체");
  const [induty, setInduty] = useState(searchParams.get("induty") ?? "전체");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recommended");
  const [priceMax, setPriceMax] = useState(Number(searchParams.get("priceMax") ?? 100000));

  const [camps, setCamps] = useState<Camp[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNo, setPageNo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null); // 무한 스크롤 감지를 위한 하단 관찰 대상

  // 자체 등록 캠핑장은 contentId가 항상 null이라 실제 PK인 campId로 식별해야 함
  const onCampClick = (camp: Camp) => navigate(`/campsites/${camp.campId ?? camp.contentId}`);

  // 검색어만 300ms 디바운스 (지역/유형/정렬/가격은 클릭 즉시 반영)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // 필터를 URL 쿼리파라미터에 동기화
  useEffect(() => {
    const next: Record<string, string> = {};
    if (debouncedQuery) next.q = debouncedQuery;
    if (region !== "전체") next.region = region;
    if (induty !== "전체") next.induty = induty;
    if (sort !== "recommended") next.sort = sort;
    if (priceMax !== 100000) next.priceMax = String(priceMax);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, region, induty, sort, priceMax]);

  // 필터가 바뀌면 1페이지부터 새로 조회
  const fetchPage = useCallback((page: number, append: boolean) => {
    setLoading(true);
    getCampsites({
      keyword: debouncedQuery || undefined,
      region: region !== "전체" ? region : undefined,
      induty: induty !== "전체" ? induty : undefined,
      priceMax,
      sort: sort as any,
      pageNo: page,
      numOfRows: PAGE_SIZE,
    })
      .then((res: any) => {
        const data: Camp[] = res.data ?? [];
        setTotalCount(res.totalCount ?? data.length);
        setUsingFallback(false);
        setCamps((prev) => (append ? [...prev, ...data] : data));
      })
      .catch(() => {
        // 백엔드 호출 실패 시 mock 데이터로 폴백 (필터는 적용하지 않고 전체 노출)
        setUsingFallback(true);
        setCamps(CAMPS);
        setTotalCount(CAMPS.length);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, region, induty, sort, priceMax]);

  useEffect(() => {
    setPageNo(1);
    fetchPage(1, false);
  }, [fetchPage]);

  const hasMore = !usingFallback && camps.length < totalCount;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    const next = pageNo + 1;
    setPageNo(next);
    fetchPage(next, true);
  }, [loading, hasMore, pageNo, fetchPage]);

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
        <button
          onClick={() => setDebouncedQuery(query)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
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
                className={`px-3 py-1 rounded-full text-xs transition-all ${region === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Type (induty) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">유형</p>
          <div className="flex flex-wrap gap-2">
            {INDUTY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setInduty(t.value)}
                className={`px-3 py-1 rounded-full text-xs transition-all ${induty === t.value ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                  }`}
              >
                {t.label}
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
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Result count */}
      <p className="text-sm text-muted-foreground mb-4">
        <span className="text-foreground font-bold">{totalCount.toLocaleString()}개</span>의 캠핑장
        {usingFallback && " (오프라인 데이터)"}
      </p>

      {/* Grid */}
      {camps.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {camps.map((camp, i) => (
            <div
              key={camp.campId ?? camp.contentId}
              className="camp-grid-item"
              style={{ animationDelay: `${(i % PAGE_SIZE) * 0.05}s` }}
            >
              <CampCard camp={camp} onClick={() => onCampClick(camp)} />
            </div>
          ))}
        </div>
      ) : !loading ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-4xl mb-3">🏕️</p>
          <p>검색 결과가 없습니다. 조건을 바꿔보세요.</p>
        </div>
      ) : null}

      {/* Sentinel for infinite scroll */}
      <div ref={sentinelRef} className="sentinel mt-6" />

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-6">
          <div className="loading-spinner" />
        </div>
      )}

      {/* End of results */}
      {!hasMore && camps.length > 0 && !loading && (
        <p className="text-center text-xs text-muted-foreground py-6">
          모든 캠핑장을 불러왔습니다 ({totalCount.toLocaleString()}개)
        </p>
      )}
    </div>
  );
}
