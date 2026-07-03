/**
 * 별점 표시/입력 공통 컴포넌트
 * - interactive=false(기본): 평점을 별 5개로 보여주기만 함 (카드, 상세 페이지 등)
 * - interactive=true: 클릭으로 별점을 선택할 수 있음 (리뷰 작성 폼 등)
 */
import { Star } from "lucide-react";

interface StarRowProps {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function StarRow({ rating, size = 14, interactive = false, onChange }: StarRowProps) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}
        >
          <Star
            size={size}
            className={n <= Math.round(rating) ? "fill-accent text-accent" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
}
