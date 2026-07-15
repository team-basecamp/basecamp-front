import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, EyeOff, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import {
  getAdminReports,
  getAdminPostDetail,
  blindPost,
  type ReportedPost,
  type ReportStatus,
  type PostStatus,
} from "../../api/adminPost";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/common/dialog";
import AdminHeader from "./AdminHeader";

/**
 * 신고 내역 관리 화면 (/admin/reports)
 * - 신고된 게시글 목록을 처리 상태별로 조회한다(GET /v1/admin/posts/reports).
 * - 신고 행을 눌러 게시글 원문을 상태와 무관하게 열람하고(GET /v1/admin/posts/{postId}),
 *   ACTIVE 인 글은 사유를 입력해 블라인드 처리한다(POST /v1/admin/posts/{postId}/blind).
 * - 블라인드하면 해당 글의 PENDING 신고가 백엔드에서 자동으로 ACCEPTED 로 정리된다.
 *   (신고 "반려" 엔드포인트는 아직 백엔드에 없어 제공하지 않는다.)
 */

const REASON_LABELS: Record<string, string> = {
  SPAM: "스팸/광고",
  INAPPROPRIATE: "부적절한 내용",
  ILLEGAL: "불법 정보",
  ETC: "기타",
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL: "자유",
  CAMP_MATE: "캠핑메이트",
  RESERVATION_TRANSFER: "예약양도",
};

const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "처리 대기",
  ACCEPTED: "블라인드 처리됨",
  REJECTED: "반려",
};
const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  PENDING: "text-accent bg-accent/10",
  ACCEPTED: "text-destructive bg-destructive/10",
  REJECTED: "text-muted-foreground bg-muted",
};

const POST_STATUS_LABELS: Record<PostStatus, string> = {
  ACTIVE: "정상",
  BLINDED: "블라인드",
  DELETED: "삭제됨",
};
const POST_STATUS_COLORS: Record<PostStatus, string> = {
  ACTIVE: "text-primary bg-primary/10",
  BLINDED: "text-destructive bg-destructive/10",
  DELETED: "text-muted-foreground bg-muted",
};

const STATUS_FILTERS: { key: ReportStatus; label: string }[] = [
  { key: "PENDING", label: "처리 대기" },
  { key: "ACCEPTED", label: "블라인드 처리됨" },
  { key: "REJECTED", label: "반려" },
];

export default function ReportListPage() {
  const [status, setStatus] = useState<ReportStatus>("PENDING");
  const [page, setPage] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminReports", status, page],
    queryFn: () => getAdminReports({ status, page }),
  });

  const changeStatus = (next: ReportStatus) => {
    setStatus(next);
    setPage(0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="reports" />

      {/* 처리 상태 필터 */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-5 w-fit">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => changeStatus(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
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
        <div className="py-16 text-center text-destructive text-sm">신고 목록을 불러오지 못했습니다.</div>
      ) : !data || data.content.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center text-muted-foreground">
          <Flag size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">{REPORT_STATUS_LABELS[status]} 신고가 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.content.map((report) => (
              <ReportRow
                key={report.reportId}
                report={report}
                onOpen={() => setSelectedPostId(report.postId)}
              />
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination page={data} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
          )}
        </>
      )}

      <PostDetailDialog postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
    </div>
  );
}

function ReportRow({ report, onOpen }: { report: ReportedPost; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REPORT_STATUS_COLORS[report.reportStatus]}`}>
              {REPORT_STATUS_LABELS[report.reportStatus]}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POST_STATUS_COLORS[report.postStatus]}`}>
              게시글 {POST_STATUS_LABELS[report.postStatus]}
            </span>
            <span className="text-xs text-muted-foreground">{REASON_LABELS[report.reason] ?? report.reason}</span>
          </div>
          <p className="font-semibold text-sm mb-1 truncate">{report.postTitle}</p>
          <p className="text-xs text-muted-foreground">
            신고자 {report.reporterNickname} · {new Date(report.createdAt).toLocaleDateString("ko-KR")}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-0.5">
          <FileText size={13} /> 상세
        </span>
      </div>
    </button>
  );
}

/**
 * 신고 대상 게시글 상세 다이얼로그.
 * 열릴 때(postId 확정) 상세를 조회하고, ACTIVE 인 글은 사유를 입력해 블라인드 처리한다.
 */
function PostDetailDialog({ postId, onClose }: { postId: number | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ["adminPostDetail", postId],
    queryFn: () => getAdminPostDetail(postId as number),
    enabled: postId !== null,
  });

  const blind = useMutation({
    mutationFn: () => blindPost(postId as number, reason.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      void queryClient.invalidateQueries({ queryKey: ["adminPostDetail", postId] });
      void queryClient.invalidateQueries({ queryKey: ["adminPendingReportCount"] });
      close();
    },
    onError: (err) => setError(getApiErrorMessage(err, "블라인드 처리에 실패했습니다.")),
  });

  // 다이얼로그를 닫을 때 입력/에러 상태를 초기화한다.
  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={postId !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>게시글 상세</DialogTitle>
          <DialogDescription>신고된 게시글의 원문입니다. 블라인드/삭제된 글도 그대로 표시됩니다.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">불러오는 중…</div>
        ) : isError || !post ? (
          <div className="py-12 text-center text-destructive text-sm">게시글을 불러오지 못했습니다.</div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${POST_STATUS_COLORS[post.status]}`}>
                {POST_STATUS_LABELS[post.status]}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
                {CATEGORY_LABELS[post.category] ?? post.category}
              </span>
              <span className="text-xs text-muted-foreground">조회 {post.viewCount}</span>
            </div>

            <div>
              <h3 className="font-semibold text-base mb-1">{post.title}</h3>
              <p className="text-xs text-muted-foreground">
                {post.nickname} · {new Date(post.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>

            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 border-t border-border pt-4">
              {post.content}
            </p>

            {post.status === "BLINDED" && post.blindReason && (
              <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3">
                <p className="text-xs font-medium text-destructive mb-0.5">블라인드 사유</p>
                <p className="text-sm text-foreground/80">{post.blindReason}</p>
              </div>
            )}

            {/* 정상 글만 블라인드할 수 있다. 이미 블라인드면 409, 삭제된 글이면 404 이므로 UI에서 미리 막는다. */}
            {post.status === "ACTIVE" ? (
              <div className="space-y-2 border-t border-border pt-4">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="블라인드 처리 사유를 입력하세요 (최대 200자)"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
                />
                {error && <p className="text-xs text-destructive">{error}</p>}
                <button
                  onClick={() => {
                    setError(null);
                    blind.mutate();
                  }}
                  disabled={blind.isPending || reason.trim().length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <EyeOff size={14} /> {blind.isPending ? "처리 중…" : "블라인드 처리"}
                </button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground border-t border-border pt-4">
                {post.status === "BLINDED" ? "이미 블라인드 처리된 게시글입니다." : "삭제된 게시글입니다."}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Pagination({
  page,
  onPrev,
  onNext,
}: {
  page: { number: number; totalPages: number; first: boolean; last: boolean };
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 mt-6">
      <button
        onClick={onPrev}
        disabled={page.first}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={14} /> 이전
      </button>
      <span className="text-sm text-muted-foreground">
        {page.number + 1} / {page.totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page.last}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        다음 <ChevronRight size={14} />
      </button>
    </div>
  );
}
