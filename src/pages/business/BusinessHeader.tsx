import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Tent, TrendingUp, Calendar, Star } from "lucide-react";
import { CAMPS } from "../../data/camps";
import { OWNER_RESERVATIONS } from "../../data/user";

/**
 * 캠핑업체 대시보드 공통 헤더 (프로필 요약 + 4개 탭 네비게이션: 캠핑장/예약/리뷰/매출)
 * - CampsiteManagePage, ReservationManagePage, ReviewStatPage, SalesStatPage 등
 *   /business/* 하위 여러 페이지에서 공통으로 재사용되는 컴포넌트
 * - active prop으로 현재 탭을 표시하고, 탭 클릭 시 해당 라우트로 이동
 */
export type BusinessTab = "campsites" | "reservations" | "reviews" | "sales";

// mock 로그인 캠핑업체 계정의 id (ERD의 users.user_id / camps.owner_id에 대응).
// 실제 로그인 연동 전이라 고정값으로 사용 - CAMPS 중 ownerId가 이 값인 캠핑장들이 "내 캠핑장"이 됨.
export const MY_OWNER_ID = 1;

const TAB_ROUTES: Record<BusinessTab, string> = {
  campsites: "/business/campsites",
  reservations: "/business/reservations",
  reviews: "/business/reviews",
  sales: "/business/sales",
};

const TABS: { key: BusinessTab; label: string; icon: ReactNode }[] = [
  { key: "campsites", label: "내 캠핑장", icon: <Tent size={15} /> },
  { key: "reservations", label: "예약 관리", icon: <Calendar size={15} /> },
  { key: "reviews", label: "리뷰 통계", icon: <Star size={15} /> },
  { key: "sales", label: "매출 통계", icon: <TrendingUp size={15} /> },
];

// mock 월별 매출/예약건수 데이터 (SalesStatPage 차트에서도 함께 사용, 실제 백엔드 연동 전 하드코딩 값)
const MONTHLY_REVENUE = [
  { month: "1월", revenue: 1200000, count: 28 },
  { month: "2월", revenue: 980000, count: 22 },
  { month: "3월", revenue: 1540000, count: 35 },
  { month: "4월", revenue: 1890000, count: 42 },
  { month: "5월", revenue: 2340000, count: 51 },
  { month: "6월", revenue: 2100000, count: 45 },
];

// 금액을 "1.5백만", "230만" 같은 축약 원화 표기로 변환
function formatKRW(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}백만`;
  if (n >= 10000) return `${Math.floor(n / 10000)}만`;
  return n.toLocaleString();
}

export { MONTHLY_REVENUE, formatKRW };

export default function BusinessHeader({ active }: { active: BusinessTab }) {
  const navigate = useNavigate();
  const myCamps = CAMPS.filter((c) => c.ownerId === MY_OWNER_ID); // 내 캠핑장 전체 (여러 개일 수 있음)
  const avgRating = myCamps.length
    ? (myCamps.reduce((s, c) => s + c.rating, 0) / myCamps.length).toFixed(1)
    : "—";
  const pendingCount = OWNER_RESERVATIONS.filter((r) => r.status === "PENDING").length;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>캠핑업체 대시보드</h1>
          <p className="text-muted-foreground text-sm mt-1">내 캠핑장을 관리하세요</p>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-sm font-medium">
              <Calendar size={14} /> 승인 대기 {pendingCount}건
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "이번달 매출", value: `₩${formatKRW(MONTHLY_REVENUE[5].revenue)}`, sub: "6월", color: "text-primary" },
          { label: "이번달 예약", value: `${MONTHLY_REVENUE[5].count}건`, sub: "6월", color: "text-foreground" },
          { label: "평균 평점", value: avgRating, sub: `보유 캠핑장 ${myCamps.length}곳`, color: "text-accent" },
          { label: "누적 예약", value: `${MONTHLY_REVENUE.reduce((s, m) => s + m.count, 0)}건`, sub: "올해", color: "text-chart-3" },
        ].map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`} style={{ fontFamily: "'DM Mono', monospace" }}>{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => navigate(TAB_ROUTES[key])}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </>
  );
}
