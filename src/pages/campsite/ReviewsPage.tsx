import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Heart, MessageCircle } from "lucide-react";
import StarRow from "../../components/common/StarRow";
import { INITIAL_REVIEWS } from "../../data/reviews";
import { CAMPS } from "../../data/camps";
import type { Review } from "../../types";
import "./ReviewsPage.css";

const PAGE_SIZE = 6;

/**
 * 전체 후기 커뮤니티 페이지 (/reviews)
 * - 모든 캠핑장의 후기(data/reviews.ts mock 데이터)를 최신순/인기순/평점순으로 모아 카드 그리드로 보여줌
 * - CampsiteListPage와 동일하게 서버 페이징 없이 IntersectionObserver 기반 무한 스크롤 UI만 구현
 * - 카드 클릭 시 후기 상세(/reviews/:reviewId)로, 캠핑장 이름 클릭 시 해당 캠핑장 상세로 이동
 */
export default function ReviewsPage() {
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"최신순" | "인기순" | "평점순">("최신순");
  const sentinelRef = useRef<HTMLDivElement>(null);

  const onReviewClick = (review: Review) => navigate(`/reviews/${review.id}`);
  const onCampClick = (campId: number) => navigate(`/campsites/${campId}`);

  const sorted = [...INITIAL_REVIEWS].sort((a, b) => {
    if (sortBy === "인기순") return b.likes - a.likes;
    if (sortBy === "평점순") return b.rating - a.rating;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [sortBy]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((n) => n + PAGE_SIZE);
      setLoading(false);
    }, 700);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            캠핑 <span className="text-primary">후기 커뮤니티</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">실제 캠퍼들의 생생한 후기를 확인하세요</p>
        </div>
        <div className="flex gap-2">
          {(["최신순", "인기순", "평점순"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((review, i) => {
          const camp = CAMPS.find((c) => c.contentId === review.campId);
          return (
            <div
              key={review.id}
              className="reviews-grid-item review-card bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30"
              style={{ animationDelay: `${(i % PAGE_SIZE) * 0.05}s` }}
              onClick={() => onReviewClick(review)}
            >
              {/* Review image */}
              {review.images[0] && (
                <div className="h-40 overflow-hidden bg-muted">
                  <img src={review.images[0]} alt="후기 이미지" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              )}

              <div className="p-5">
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                    {review.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{review.author}</div>
                    <div className="text-xs text-muted-foreground">{review.date}</div>
                  </div>
                  <StarRow rating={review.rating} size={12} />
                </div>

                {/* Content */}
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
                  {review.content}
                </p>

                {/* Camp name */}
                <button
                  onClick={(e) => { e.stopPropagation(); camp && onCampClick(camp.contentId); }}
                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline mb-3"
                >
                  <MapPin size={10} /> {camp?.facltNm}
                </button>

                {/* Engagement */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
                  <span className="flex items-center gap-1">
                    <Heart size={11} /> {review.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={11} /> 댓글 {review.comments.length}
                  </span>
                  <span className="ml-auto text-primary text-xs">자세히 보기 →</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-1 mt-6" />

      {loading && (
        <div className="flex justify-center py-6">
          <div className="loading-spinner" />
        </div>
      )}

      {!hasMore && visible.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">
          모든 후기를 불러왔습니다 ({sorted.length}개)
        </p>
      )}
    </div>
  );
}
