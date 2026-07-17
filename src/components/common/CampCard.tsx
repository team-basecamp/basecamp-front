/**
 * 캠핑장 목록/검색 결과에서 쓰이는 캠핑장 카드
 * - 카드 우측 상단 하트 버튼은 useWishlist(서버 상태)와 연동되어 있어서, 이 카드에서 찜을 누르면
 *   찜목록 페이지/상세 페이지 등 다른 화면에서도 동일하게 찜 상태가 반영됨
 * - 비로그인 상태에서 하트를 누르면 찜 대신 로그인 페이지로 이동시킴
 */
import { useNavigate } from "react-router-dom";
import { MapPin, Heart, Star } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { campKey } from "../../lib/camp";
import type { Camp } from "../../types";
import "./CampCard.css";

interface CampCardProps {
  camp: Camp;
  onClick: () => void;
}

function indutyBadge(induty: string): string {
  if (induty.includes("글램핑")) return "글램핑";
  if (induty.includes("오토") || induty.includes("자동차")) return "오토캠핑";
  if (induty.includes("카라반")) return "카라반";
  return "일반야영";
}

export default function CampCard({ camp, onClick }: CampCardProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { isWished, toggleWish, isPending } = useWishlist();
  const campId = campKey(camp);
  const liked = isWished(campId);
  const image = camp.firstImageUrl || camp.image || "";

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { navigate("/login"); return; }
    toggleWish(campId);
  };

  return (
    <div className="camp-card group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer hover:border-primary/30 hover:shadow-md" onClick={onClick}>
      <div className="camp-card-image relative h-44 bg-muted overflow-hidden">
        {image ? (
          <img src={image} alt={camp.facltNm} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-muted-foreground text-4xl">🏕️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        <button
          onClick={handleLikeClick}
          disabled={isPending}
          aria-label={liked ? "찜 해제" : "찜하기"}
          aria-pressed={liked}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-all shadow-sm disabled:opacity-60"
        >
          <Heart size={14} className={liked ? "fill-destructive text-destructive" : "text-foreground/60"} />
        </button>

        <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-white/85 text-foreground text-xs font-medium backdrop-blur">
          {indutyBadge(camp.induty)}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm leading-tight line-clamp-1 flex-1">{camp.facltNm}</h3>
          {!!camp.price && (
            <span className="text-primary font-bold text-sm whitespace-nowrap flex-shrink-0" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{camp.price.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2.5">
          <MapPin size={10} className="flex-shrink-0" />
          <span className="truncate">{camp.addr1}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Star size={12} className="fill-accent text-accent" />
          <span className="text-sm font-semibold">{(camp.rating ?? camp.averageRating ?? 0).toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({(camp.reviewCount ?? camp.reservationCount ?? 0).toLocaleString()})</span>
        </div>
      </div>
    </div>
  );
}
