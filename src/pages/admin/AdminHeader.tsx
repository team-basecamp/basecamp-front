import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ShieldOff, Flag, Tent } from "lucide-react";
import { getAdminReports } from "../../api/adminPost";

/**
 * 관리자 페이지 공통 헤더 (프로필 요약 + 3개 탭 네비게이션: 회원/블랙리스트/신고)
 * - MemberManagePage, BlacklistPage, ReportListPage 등
 *   /admin/* 하위 여러 페이지에서 공통으로 재사용되는 컴포넌트
 * - active prop으로 현재 탭을 표시하고, 신고 탭에는 처리 대기중인 건수를 배지로 표시
 */
export type AdminTab = "members" | "campOwner" | "blacklist" | "reports";

const TAB_ROUTES: Record<AdminTab, string> = {
  members: "/admin/members",
  campOwner: "/admin/camp-owner",
  blacklist: "/admin/blacklist",
  reports: "/admin/reports",
};

export default function AdminHeader({ active }: { active: AdminTab }) {
  const navigate = useNavigate();

  // 처리 대기(PENDING) 신고 건수를 배지로 표시한다. 목록 자체는 필요 없어 첫 페이지의 totalElements 만 쓴다.
  // ReportListPage 의 블라인드 처리 후에도 같은 키(adminPendingReportCount)를 무효화해 배지를 갱신한다.
  const { data } = useQuery({
    queryKey: ["adminPendingReportCount"],
    queryFn: () => getAdminReports({ status: "PENDING", size: 1 }),
  });
  const pendingReports = data?.totalElements ?? 0;

  const TABS: { key: AdminTab; label: string; icon: ReactNode; badge?: number }[] = [
    { key: "members", label: "회원 관리", icon: <Users size={15} /> },
    { key: "campOwner", label: "업체 승격", icon: <Tent size={15} /> },
    { key: "blacklist", label: "블랙리스트", icon: <ShieldOff size={15} /> },
    { key: "reports", label: "신고 내역", icon: <Flag size={15} />, badge: pendingReports },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>관리자 페이지</h1>
          <p className="text-muted-foreground text-sm mt-1">회원과 콘텐츠를 관리하세요</p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            onClick={() => navigate(TAB_ROUTES[key])}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
              active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon} {label}
            {badge ? (
              <span className="w-4 h-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>
    </>
  );
}
