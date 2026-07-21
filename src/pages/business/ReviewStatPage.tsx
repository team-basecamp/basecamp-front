import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Star } from "lucide-react";
import { getMyCampsites } from "../../api/campsite";
import { getReviews, type ReviewResponse } from "../../api/review";
import StarRow from "../../components/common/StarRow";
import BusinessHeader from "./BusinessHeader";

/**
 * 리뷰 통계 화면 (/business/reviews)
 * - GET /v1/camps/my 로 내 캠핑장을 가져온 뒤, 캠핑장마다 GET /v1/camps/{campId}/reviews 를 호출해
 *   전체 리뷰를 합산 → 평균 평점, 별점 분포(5~1점), 최근 리뷰 목록을 보여줌
 * - 백엔드에 사업자용 리뷰 집계 엔드포인트가 없어 캠핑장 수만큼 요청이 나간다.
 *   (보유 캠핑장은 소수라 감수. 늘어나면 GET /v1/business/reviews 같은 단일 엔드포인트로 대체할 것)
 * - "더보기"는 클라이언트 페이징이다. GET /v1/camps/{campId}/reviews 가 Pageable 없이 List를 통째로
 *   반환하므로 서버 페이징이 불가능해, 전부 받아온 뒤 화면에 보여줄 개수만 늘린다.
 */

// "더보기" 한 번에 추가로 보여줄 리뷰 수 (최초 표시 개수와 동일)
const PAGE_SIZE = 5;
export default function ReviewStatPage() {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [campCount, setCampCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 인터셉터가 봉투를 벗겨 resolve 값이 곧 캠핑장 배열이다(이중 봉투 제거 후).
        const res = await getMyCampsites();
        const camps = (res ?? []).filter((c) => c.campId != null);
        if (cancelled) return;
        setCampCount(camps.length);

        if (camps.length === 0) {
          setReviews([]);
          return;
        }

        // 일부 캠핑장 조회가 실패해도 나머지 통계는 보여준다.
        const results = await Promise.allSettled(camps.map((c) => getReviews(c.campId!)));
        if (cancelled) return;

        const ok = results.filter((r) => r.status === "fulfilled");
        setReviews(ok.flatMap((r) => (r as PromiseFulfilledResult<ReviewResponse[]>).value ?? []));
        if (ok.length < results.length) {
          setError(`캠핑장 ${results.length - ok.length}곳의 리뷰를 불러오지 못해 통계에서 빠졌습니다.`);
        }
      } catch {
        if (!cancelled) setError("리뷰 통계를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // 별점 분포: 5점~1점 각 구간별로, 반올림한 평점이 해당 점수와 일치하는 리뷰 개수 (막대그래프용)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}점`,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  // 평균 평점 (리뷰가 없으면 "—" 표시)
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "—";

  // 여러 캠핑장의 리뷰를 합쳤으므로 최신순 정렬을 다시 해야 한다. (서버 정렬은 캠핑장 단위)
  const sorted = useMemo(
    () => [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [reviews],
  );
  const recent = sorted.slice(0, visibleCount);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="reviews" />

      {error && (
        <div className="mb-5 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold">평점 현황</h3>
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={Number(avgRating) || 0} />
                  <span className="text-accent font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{avgRating}</span>
                  <span className="text-muted-foreground text-xs">
                    ({reviews.length}개 리뷰 · 보유 캠핑장 {campCount}곳)
                  </span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distribution} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="star" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                  formatter={(val: number) => [`${val}개`, "리뷰"]}
                />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-bold mb-4">
              최근 리뷰
              {reviews.length > 0 && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {recent.length} / {reviews.length}
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {recent.map((review) => (
                <div key={review.reviewId} className="border-t border-border pt-4 first:border-0 first:pt-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium">{review.nickname}</span>
                    <StarRow rating={review.rating} size={11} />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  <Star size={32} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">아직 등록된 리뷰가 없습니다</p>
                </div>
              )}
            </div>

            {visibleCount < sorted.length && (
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="mt-5 w-full rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                더보기 ({sorted.length - visibleCount}개 남음)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
