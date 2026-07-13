import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, ShieldOff, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getAdminUsers,
  blacklistUser,
  type AdminUser,
  type UserStatus,
} from "../../api/admin";
import { getApiErrorMessage } from "../../lib/apiError";
import AdminHeader from "./AdminHeader";

/**
 * 회원 관리 화면 (/admin/members)
 * - 전체 회원을 가입 최신순으로 조회하고, 닉네임/이메일 검색과 상태 필터로 좁힌다.
 * - 정상(ACTIVE) 회원은 사유를 입력해 제재할 수 있다. 제재하면 강제 로그아웃되고
 *   기존 토큰이 즉시 무효화된다(GET /v1/admin/users, POST /v1/admin/users/{id}/blacklist).
 */

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "정상",
  BLACKLISTED: "제재",
  WITHDRAWN: "탈퇴",
};
const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: "text-primary bg-primary/10",
  BLACKLISTED: "text-destructive bg-destructive/10",
  WITHDRAWN: "text-muted-foreground bg-muted",
};

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "고객",
  CAMP_OWNER: "캠핑업체",
  ADMIN: "관리자",
};

const STATUS_FILTERS: { key: "" | UserStatus; label: string }[] = [
  { key: "", label: "전체" },
  { key: "ACTIVE", label: "정상" },
  { key: "BLACKLISTED", label: "제재" },
  { key: "WITHDRAWN", label: "탈퇴" },
];

export default function MemberManagePage() {
  const [input, setInput] = useState(""); // 입력 중인 검색어
  const [keyword, setKeyword] = useState(""); // 실제 조회에 쓰는 확정 검색어
  const [status, setStatus] = useState<"" | UserStatus>("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminUsers", status, keyword, page],
    queryFn: () =>
      getAdminUsers({ status: status || undefined, keyword: keyword || undefined, page }),
  });

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(input.trim());
    setPage(0);
  };

  const changeStatus = (next: "" | UserStatus) => {
    setStatus(next);
    setPage(0);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="members" />

      {/* Search + status filter */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <form onSubmit={search} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 flex-1 min-w-[220px] max-w-sm">
          <Search size={16} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="닉네임 또는 이메일 검색..."
            className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {STATUS_FILTERS.map(({ key, label }) => (
            <button
              key={key || "all"}
              onClick={() => changeStatus(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                status === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : isError ? (
        <div className="py-16 text-center text-destructive text-sm">회원 목록을 불러오지 못했습니다.</div>
      ) : !data || data.content.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center text-muted-foreground text-sm">
          조회된 회원이 없습니다
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[1.6fr_2fr_0.9fr_0.8fr_1fr_auto] gap-3 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">
              <span>닉네임</span>
              <span>이메일</span>
              <span>권한</span>
              <span>상태</span>
              <span>가입일</span>
              <span></span>
            </div>
            {data.content.map((member) => (
              <MemberRow key={member.userId} member={member} />
            ))}
          </div>

          {data.totalPages > 1 && (
            <Pagination page={data} onPrev={() => setPage((p) => Math.max(0, p - 1))} onNext={() => setPage((p) => p + 1)} />
          )}
        </>
      )}
    </div>
  );
}

function MemberRow({ member }: { member: AdminUser }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const blacklist = useMutation({
    mutationFn: () => blacklistUser(member.userId, reason.trim()),
    onSuccess: () => {
      setConfirming(false);
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      void queryClient.invalidateQueries({ queryKey: ["blacklistedUsers"] });
    },
    onError: (err) => setError(getApiErrorMessage(err, "제재 처리에 실패했습니다.")),
  });

  return (
    <div className="border-b border-border last:border-0">
      <div className="grid grid-cols-[1.6fr_2fr_0.9fr_0.8fr_1fr_auto] gap-3 px-5 py-4 items-center text-sm">
        <span className="font-medium truncate">{member.nickname}</span>
        <span className="text-muted-foreground truncate">{member.email}</span>
        <span className="text-xs text-muted-foreground">{ROLE_LABELS[member.role] ?? member.role}</span>
        <span className={`w-fit text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[member.status]}`}>
          {STATUS_LABELS[member.status]}
        </span>
        <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
          {new Date(member.createdAt).toLocaleDateString("ko-KR")}
        </span>
        {member.status === "ACTIVE" ? (
          <button
            onClick={() => {
              setError(null);
              setConfirming((v) => !v);
            }}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all justify-self-end"
          >
            <ShieldOff size={12} /> 제재
          </button>
        ) : (
          <span className="justify-self-end" />
        )}
      </div>

      {confirming && (
        <div className="px-5 pb-4 -mt-1 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            rows={2}
            placeholder={`${member.nickname} 회원 제재 사유를 입력하세요`}
            className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => blacklist.mutate()}
              disabled={blacklist.isPending || reason.trim().length === 0}
              className="px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {blacklist.isPending ? "제재 중…" : "제재 확정"}
            </button>
            <button
              onClick={() => {
                setConfirming(false);
                setReason("");
                setError(null);
              }}
              disabled={blacklist.isPending}
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
