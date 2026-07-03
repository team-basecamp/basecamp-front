import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Star } from "lucide-react";
import { CAMPS } from "../../data/camps";
import { INITIAL_REVIEWS } from "../../data/reviews";
import StarRow from "../../components/common/StarRow";
import BusinessHeader, { MY_OWNER_ID } from "./BusinessHeader";

/**
 * 리뷰 통계 화면 (/business/reviews)
 * - 내가 소유한 캠핑장 전체(owner_id 기준, 여러 곳일 수 있음)에 달린 리뷰를 합산해
 *   평균 평점, 별점 분포(5점~1점 개수), 최근 리뷰 목록을 보여줌
 * - mock 데이터(data/reviews.ts의 INITIAL_REVIEWS)에서 campId가 내 캠핑장 id 목록에 포함된 것만 필터링
 */
export default function ReviewStatPage() {
  const myCampIds = new Set(CAMPS.filter((c) => c.ownerId === MY_OWNER_ID).map((c) => c.contentId));
  const myReviews = INITIAL_REVIEWS.filter((r) => myCampIds.has(r.campId));

  // 별점 분포 계산: 5점~1점 각 구간별로, 반올림한 평점이 해당 점수와 일치하는 리뷰 개수를 집계 (막대그래프용)
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star: `${star}점`,
    count: myReviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  // 평균 평점 (리뷰가 없으면 "—" 표시)
  const avgRating = myReviews.length
    ? (myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)
    : "—";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="reviews" />

      <div className="space-y-5">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold">평점 현황</h3>
              <div className="flex items-center gap-2 mt-1">
                <StarRow rating={Number(avgRating) || 0} />
                <span className="text-accent font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{avgRating}</span>
                <span className="text-muted-foreground text-xs">({myReviews.length}개 리뷰)</span>
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
          <h3 className="font-bold mb-4">최근 리뷰</h3>
          <div className="space-y-4">
            {myReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-t border-border pt-4 first:border-0 first:pt-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-medium">{review.author}</span>
                  <StarRow rating={review.rating} size={11} />
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{review.content}</p>
              </div>
            ))}
            {myReviews.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <Star size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">아직 등록된 리뷰가 없습니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
