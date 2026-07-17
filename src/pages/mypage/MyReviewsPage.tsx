import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { getMyReviews, type ReviewResponse } from "../../api/review";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import MyPageHeader from "./MyPageHeader";

// 한 번에 보여줄 리뷰 수. 백엔드 GET /v1/reviews/me 가 전체 List 를 한 번에 주므로
// 서버 페이징 대신 받아온 배열을 프론트에서 잘라서 보여준다.
const PAGE_SIZE = 10;

/**
 * 내 리뷰 목록 (/mypage/reviews)
 * - GET /v1/reviews/me 로 로그인한 유저가 작성한 리뷰를 조회
 * - 카드 클릭 시 해당 캠핑장 상세로 이동
 */
export default function MyReviewsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!user) return;
    getMyReviews()
      .then(setReviews)
      .catch((e) => console.error("내 리뷰 조회 실패", e))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return <RequireLogin />;

  const visibleReviews = reviews.slice(0, visibleCount);
  const remaining = reviews.length - visibleReviews.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="reviews" />

      <div className="space-y-3">
        {visibleReviews.map((review) => (
          <div
            key={review.reviewId}
            onClick={() => navigate(`/campsites/${review.campId}`)}
            className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-0.5 mb-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={13}
                      className={n <= Math.round(review.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}
                    />
                  ))}
                  <span className="ml-1 text-xs text-muted-foreground">{review.rating}</span>
                </div>
                <p className="text-sm mb-1 line-clamp-2">{review.content}</p>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full py-3 rounded-2xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            더 보기 ({remaining})
          </button>
        )}
        {!loading && reviews.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Star size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">작성한 리뷰가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
