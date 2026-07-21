import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getCampOwnerApplications,
  approveCampOwnerApplication,
  rejectCampOwnerApplication,
  type ApplicationStatus,
  type CampOwnerApplication,
} from "../../api/campOwner";
import { getApiErrorMessage } from "../../lib/apiError";
import AdminHeader from "./AdminHeader";

/**
 * 캠핑업체 권한 승격 심사 (/admin/camp-owner)
 * - 상태별(심사 중/승인/반려) 신청 목록을 조회한다.
 * - 심사 중(PENDING) 건은 승인/반려할 수 있다. 반려 시 사유를 함께 입력한다.
 * - 승인하면 회원이 CAMP_OWNER 로 승격되고, 그 회원의 기존 토큰은 서버에서 즉시 무효화된다.
 */

const STATUS_TABS: { key: ApplicationStatus; label: string }[] = [
  { key: "PENDING", label: "심사 중" },
  { key: "APPROVED", label: "승인" },
  { key: "REJECTED", label: "반려" },
];

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  PENDING: "text-amber-600 bg-amber-500/10",
  APPROVED: "text-primary bg-primary/10",
  REJECTED: "text-destructive bg-destructive/10",
};

export default function CampOwnerApplicationsPage() {
  const [status, setStatus] = useState<ApplicationStatus>("PENDING");
  const [page, setPage] = useState(0);

  // 상태 탭을 바꾸면 페이지를 처음으로 되돌린다.
  const changeStatus = (next: ApplicationStatus) => {
    setStatus(next);
    setPage(0);
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["campOwnerApplications", status, page],
    queryFn: () => getCampOwnerApplications(status, page),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="campOwner" />

      {/* Status filter */}
      <div className="flex gap-1 mb-5 bg-muted rounded-xl p-1 max-w-md">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeStatus(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              status === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : isError ? (
        <div className="py-16 text-center text-destructive text-sm">목록을 불러오지 못했습니다.</div>
      ) : !data || data.content.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center text-muted-foreground text-sm">
          해당 상태의 신청이 없습니다
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.content.map((app) => (
              <ApplicationCard key={app.applicationId} application={app} badgeClass={STATUS_BADGE[app.status]} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={data.first}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} /> 이전
              </button>
              <span className="text-sm text-muted-foreground">
                {data.number + 1} / {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.last}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                다음 <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ApplicationCard({ application, badgeClass }: { application: CampOwnerApplication; badgeClass: string }) {
  const queryClient = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campOwnerApplications"] });

  const approve = useMutation({
    mutationFn: () => approveCampOwnerApplication(application.applicationId),
    onSuccess: invalidate,
    onError: (err) => setError(getApiErrorMessage(err, "승인 처리에 실패했습니다.")),
  });

  const reject = useMutation({
    mutationFn: () => rejectCampOwnerApplication(application.applicationId, reason.trim()),
    onSuccess: () => {
      setRejecting(false);
      setReason("");
      invalidate();
    },
    onError: (err) => setError(getApiErrorMessage(err, "반려 처리에 실패했습니다.")),
  });

  const busy = approve.isPending || reject.isPending;
  const statusLabel = STATUS_TABS.find((t) => t.key === application.status)?.label ?? application.status;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold">{application.businessName}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>{statusLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            대표자 {application.representativeName} · 회원 #{application.userId}
          </p>
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap" style={{ fontFamily: "'DM Mono', monospace" }}>
          {new Date(application.createdAt).toLocaleDateString("ko-KR")}
        </span>
      </div>

      <div className="text-sm mb-1">
        <span className="text-muted-foreground">사업자등록번호 </span>
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{application.businessNumber}</span>
      </div>

      {application.status === "REJECTED" && application.rejectReason && (
        <p className="text-xs text-muted-foreground mt-2">
          반려 사유: <span className="text-foreground">{application.rejectReason}</span>
        </p>
      )}

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      {application.status === "PENDING" && !rejecting && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => approve.mutate()}
            disabled={busy}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={14} /> {approve.isPending ? "승인 중…" : "승인"}
          </button>
          <button
            onClick={() => {
              setError(null);
              setRejecting(true);
            }}
            disabled={busy}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 transition-all disabled:opacity-40"
          >
            <X size={14} /> 반려
          </button>
        </div>
      )}

      {application.status === "PENDING" && rejecting && (
        <div className="mt-4 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="반려 사유를 입력하세요 (신청자에게 표시됩니다)"
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => reject.mutate()}
              disabled={reject.isPending || reason.trim().length === 0}
              className="flex items-center gap-1 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {reject.isPending ? "반려 중…" : "반려 확정"}
            </button>
            <button
              onClick={() => {
                setRejecting(false);
                setReason("");
                setError(null);
              }}
              disabled={reject.isPending}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
