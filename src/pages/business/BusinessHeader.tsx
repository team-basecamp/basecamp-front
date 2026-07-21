import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tent, TrendingUp, Calendar, Star } from "lucide-react";
import { getMyCampsites } from "../../api/campsite";
import {
  getReservationStats,
  type ReservationStats,
} from "../../api/reservation";


/**
 * 캠핑업체 대시보드 공통 헤더 (프로필 요약 + 4개 탭 네비게이션: 캠핑장/예약/리뷰/매출)
 * - CampsiteManagePage, ReservationManagePage, ReviewStatPage, SalesStatPage 등
 *   /business/* 하위 여러 페이지에서 공통으로 재사용되는 컴포넌트
 * - active prop으로 현재 탭을 표시하고, 탭 클릭 시 해당 라우트로 이동
 */
export type BusinessTab = "campsites" | "reservations" | "reviews" | "sales";

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
  const [stats, setStats] = useState<ReservationStats | null>(null);
  const [myCampsCount, setMyCampsCount] = useState(0);
  const currentMonthLabel = `${new Date().getMonth() + 1}월`;

  useEffect(() => {
    getReservationStats()
      .then(data => { console.log('stats:', data); setStats(data); })  // ← 이 호출
      .catch(err => console.error('통계 조회 실패', err));
  }, []);

  useEffect(() => {
    getMyCampsites()
      .then((res) => setMyCampsCount(res.data?.length ?? 0))
      .catch((err) => console.error("내 캠핑장 조회 실패", err));
  }, []);
  const pendingCount = stats?.pendingCount ?? 0;

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            내 캠핑장 관리
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            내 캠핑장을 관리하세요
          </p>
        </div>
        <div className="flex gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-sm font-medium">
            <Calendar size={14} /> 승인 대기 {pendingCount}건
          </span>
        </div>
      </div>

      {/* Summary cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            // 매출·예약 건수는 백엔드가 체크인 날짜가 아닌 예약 생성일(createdAt) 기준으로 집계하므로
            // "신규 예약" 기준임을 라벨에 드러낸다. (ReservationService.getReservationStats)
            { label: "이번달 신규 예약 매출", value: `₩${stats.monthlyRevenue.toLocaleString()}`, sub: `${currentMonthLabel} 신청 기준`, color: "text-primary" },
            { label: "이번달 신규 예약", value: `${stats.monthlyReservations}건`, sub: `${currentMonthLabel} 신청 기준`, color: "text-foreground" },
            { label: "평균 평점", value: stats.averageRating ?? '-', sub: `보유 캠핑장 ${myCampsCount}곳`, color: "text-accent" },
            { label: "누적 예약", value: `${stats.yearlyReservations}건`, sub: "올해", color: "text-chart-3" },
          ].map((card) => (
            <div key={card.label} className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`} style={{ fontFamily: "'DM Mono', monospace" }}>{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => navigate(TAB_ROUTES[key])}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
              active === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </>
  );
}
