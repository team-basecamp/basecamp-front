import type { ReactNode } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Users, ShieldOff, Flag, Tent, Download, Loader2 } from "lucide-react";
import type { AxiosError } from "axios";
import { getAdminReports } from "../../api/adminPost";
import { fetchGocampingCamps } from "../../api/campsite";
import { getApiErrorMessage } from "../../lib/apiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";

/**
 * 관리자 페이지 공통 헤더 (프로필 요약 + 4개 탭 네비게이션: 회원/업체 승격/블랙리스트/신고)
 * - MemberManagePage, BlacklistPage, ReportListPage 등
 *   /admin/* 하위 여러 페이지에서 공통으로 재사용되는 컴포넌트
 * - active prop으로 현재 탭을 표시하고, 신고 탭에는 처리 대기중인 건수를 배지로 표시
 * - "고캠핑 API 불러오기" 버튼은 특정 탭과 무관한 관리자 전용 데이터 관리 기능이라
 *   헤더 우측에 두어 모든 관리자 화면에서 실행할 수 있게 한다 (POST /v1/camps/fetch, ADMIN 전용).
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

  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  // 고캠핑 API 전체 재동기화 확인 모달 표시 여부
  const [confirmSyncOpen, setConfirmSyncOpen] = useState(false);

  const syncGocamping = useMutation({
    mutationFn: fetchGocampingCamps,
    onSuccess: (message) => {
      setSyncError(null);
      setSyncMsg(message);
      setConfirmSyncOpen(false);
    },
    onError: (err) => {
      setSyncMsg(null);
      // 이 엔드포인트는 실패 시 JSON이 아닌 순수 텍스트를 응답 본문으로 그대로 돌려준다.
      const axiosErr = err as AxiosError<string>;
      const rawText = typeof axiosErr.response?.data === "string" ? axiosErr.response.data : undefined;
      setSyncError(rawText || getApiErrorMessage(err, "고캠핑 API 동기화에 실패했습니다."));
      setConfirmSyncOpen(false);
    },
  });

  const onConfirmSync = () => {
    setSyncMsg(null);
    setSyncError(null);
    syncGocamping.mutate();
  };

  const TABS: { key: AdminTab; label: string; icon: ReactNode; badge?: number }[] = [
    { key: "members", label: "회원 관리", icon: <Users size={15} /> },
    { key: "campOwner", label: "업체 승격", icon: <Tent size={15} /> },
    { key: "blacklist", label: "블랙리스트", icon: <ShieldOff size={15} /> },
    { key: "reports", label: "신고 내역", icon: <Flag size={15} />, badge: pendingReports },
  ];

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>관리자 페이지</h1>
          <p className="text-muted-foreground text-sm mt-1">회원과 콘텐츠를 관리하세요</p>
        </div>
        <button
          onClick={() => setConfirmSyncOpen(true)}
          disabled={syncGocamping.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
        >
          {syncGocamping.isPending ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          {syncGocamping.isPending ? "고캠핑 API 불러오는 중…" : "고캠핑 API 불러오기"}
        </button>
      </div>

      {syncGocamping.isPending && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
          고캠핑 API 전체 데이터를 불러오는 중입니다. 데이터 양에 따라 몇 분 정도 걸릴 수 있어요. 완료될 때까지 이 창을 벗어나지 마세요.
        </div>
      )}
      {!syncGocamping.isPending && syncMsg && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
          {syncMsg}
        </div>
      )}
      {!syncGocamping.isPending && syncError && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {syncError}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            onClick={() => navigate(TAB_ROUTES[key])}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all relative ${active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            {icon} {label}
            {badge ? (
              <span className="w-4 h-4 rounded-full bg-destructive text-white text-[10px] flex items-center justify-center">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>

      <ConfirmDialog
        open={confirmSyncOpen}
        onOpenChange={setConfirmSyncOpen}
        tone="primary"
        title="고캠핑 API 전체 데이터를 불러오겟습니다."
        description="데이터 양에 따라 시간이 오래 걸릴 수 있습니다."
        confirmLabel="불러오기"
        pendingLabel="불러오는 중…"
        onConfirm={onConfirmSync}
        isPending={syncGocamping.isPending}
      />
    </>
  );
}
