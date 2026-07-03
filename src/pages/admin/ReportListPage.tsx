import { useState } from "react";
import { Flag, EyeOff, X } from "lucide-react";
import { ADMIN_REPORTS, type AdminReport } from "../../data/admin";
import AdminHeader from "./AdminHeader";

/**
 * 신고 내역 관리 화면 (/admin/reports)
 * - 게시글 신고 목록을 조회하고 블라인드 처리 또는 반려 처리
 * - mock 데이터(data/admin.ts의 ADMIN_REPORTS)를 컴포넌트 로컬 state로 관리 (새로고침하면 초기화됨, 실제 백엔드 연동 전 단계)
 */

const REASON_LABELS: Record<string, string> = {
  SPAM: "스팸/광고", ABUSE: "욕설/비방", ETC: "기타",
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: "처리 대기", RESOLVED: "블라인드 처리됨", REJECTED: "반려",
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-accent bg-accent/10",
  RESOLVED: "text-destructive bg-destructive/10",
  REJECTED: "text-muted-foreground bg-muted",
};

export default function ReportListPage() {
  const [reports, setReports] = useState<AdminReport[]>(ADMIN_REPORTS);

  // 신고된 게시글을 블라인드 처리 (상태를 RESOLVED로 변경, 실제 게시글 숨김 처리는 백엔드 연동 후 구현 예정)
  const blindPost = (reportId: number) => {
    setReports((prev) => prev.map((r) => r.reportId === reportId ? { ...r, status: "RESOLVED" } : r));
  };
  // 신고를 반려 처리 (상태를 REJECTED로 변경)
  const rejectReport = (reportId: number) => {
    setReports((prev) => prev.map((r) => r.reportId === reportId ? { ...r, status: "REJECTED" } : r));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="reports" />

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.reportId} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[report.status]}`}>
                    {STATUS_LABELS[report.status]}
                  </span>
                  <span className="text-xs text-muted-foreground">{REASON_LABELS[report.reason] ?? report.reason}</span>
                </div>
                <p className="font-semibold text-sm mb-1">{report.postTitle}</p>
                <p className="text-xs text-muted-foreground">
                  신고자 {report.reporter} · {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>

              {report.status === "PENDING" && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => blindPost(report.reportId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-all"
                  >
                    <EyeOff size={12} /> 블라인드
                  </button>
                  <button
                    onClick={() => rejectReport(report.reportId)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-muted-foreground text-xs font-medium hover:text-foreground transition-all"
                  >
                    <X size={12} /> 반려
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Flag size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">신고 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
