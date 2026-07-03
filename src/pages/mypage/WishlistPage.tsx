import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, X } from "lucide-react";
import { CAMPS } from "../../data/camps";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import useWishlistStore from "../../store/wishlistStore";
import MyPageHeader from "./MyPageHeader";

/**
 * 찜한 캠핑장 목록 (/mypage/wishlist)
 * - store/wishlistStore(zustand)에 저장된 찜 id 목록(wishedIds)으로 CAMPS 데이터를 필터링해 카드 그리드로 보여줌
 * - wishlistStore를 쓰는 이유: 캠핑장 상세 페이지 등 다른 화면에서 찜하기/해제해도 이 목록이 페이지 이동과 무관하게 동기화됨
 */
export default function WishlistPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const wishedIds = useWishlistStore((s) => s.wishedIds);
  const toggleWish = useWishlistStore((s) => s.toggleWish);

  if (!user) return <RequireLogin />;

  const wishedCamps = CAMPS.filter((c) => wishedIds.has(c.contentId));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="wishlist" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wishedCamps.map((camp) => (
          <div
            key={camp.contentId}
            onClick={() => navigate(`/campsites/${camp.contentId}`)}
            className="relative bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <button
              onClick={(e) => { e.stopPropagation(); toggleWish(camp.contentId); }}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/85 backdrop-blur flex items-center justify-center hover:bg-white transition-all shadow-sm"
              title="찜 해제"
            >
              <X size={14} className="text-destructive" />
            </button>
            <div className="h-36 bg-muted overflow-hidden">
              <img src={camp.firstImageUrl} alt={camp.facltNm} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{camp.facltNm}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <MapPin size={10} /> {camp.addr1}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star size={11} className="fill-accent text-accent" />
                <span className="font-semibold">{camp.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        ))}
        {wishedCamps.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Heart size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">찜한 캠핑장이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
