import { useNavigate } from "react-router-dom";
import { Heart, MapPin, X } from "lucide-react";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import MyPageHeader from "./MyPageHeader";

/**
 * 찜한 캠핑장 목록 (/mypage/wishlist)
 * - GET /v1/wishlists/me 응답(useWishlist)을 그대로 그린다. 서버가 이미 최신 찜 순으로 내려주고
 *   카드에 필요한 정보(facltNm/addr1/firstImageUrl)도 함께 주므로 캠핑장 목록을 따로 조회하지 않는다.
 * - 찜 해제는 같은 훅의 toggleWish -> 성공 시 ["wishlists"] 무효화라서 이 목록도 함께 갱신된다.
 */
export default function WishlistPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { wishlists, isLoading, isPending, toggleWish } = useWishlist();

  if (!user) return <RequireLogin />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="wishlist" />

      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          불러오는 중...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {wishlists.map((camp) => (
            <div
              key={camp.campId}
              onClick={() => navigate(`/campsites/${camp.campId}`)}
              className="relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWish(camp.campId);
                }}
                disabled={isPending}
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center hover:bg-white transition-all shadow-sm disabled:opacity-60"
                title="찜 해제"
                aria-label="찜 해제"
              >
                <X size={14} className="text-destructive" />
              </button>
              <div className="h-36 bg-muted overflow-hidden">
                {camp.firstImageUrl ? (
                  <img
                    src={camp.firstImageUrl}
                    alt={camp.facltNm}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-3xl">
                    🏕️
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {camp.facltNm}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin size={10} className="flex-shrink-0" />
                  <span className="truncate">{camp.addr1}</span>
                </div>
              </div>
            </div>
          ))}
          {wishlists.length === 0 && (
            <div className="col-span-3 py-16 text-center text-muted-foreground">
              <Heart size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">찜한 캠핑장이 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
