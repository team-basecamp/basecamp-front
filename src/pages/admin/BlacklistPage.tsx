import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShieldOff, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import {
  getBlacklistedUsers,
  releaseUser,
  type BlacklistedUser,
} from "../../api/admin";
import { getApiErrorMessage } from "../../lib/apiError";
import AdminHeader from "./AdminHeader";

/**
 * 블랙리스트(제재 회원) 관리 화면 (/admin/blacklist)
 * - 제재 상태인 회원을 제재 일시 최신순으로 조회하고, 제재를 해제한다.
 *   (신규 제재는 회원 관리 화면에서 처리한다. 제재에는 만료 개념이 없고 수동 해제만 있다.)
 * - GET /v1/admin/users/blacklist, POST /v1/admin/users/{id}/blacklist/release
 */
export default function BlacklistPage() {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["blacklistedUsers", page],
    queryFn: () => getBlacklistedUsers(page),
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="blacklist" />

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : isError ? (
        <div className="py-16 text-center text-destructive text-sm">블랙리스트를 불러오지 못했습니다.</div>
      ) : !data || data.content.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <ShieldOff size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">제재된 회원이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.content.map((user) => (
              <BlacklistRow key={user.userId} user={user} />
            ))}
          </div>

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

function BlacklistRow({ user }: { user: BlacklistedUser }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const release = useMutation({
    mutationFn: () => releaseUser(user.userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["blacklistedUsers"] });
      void queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (err) => setError(getApiErrorMessage(err, "제재 해제에 실패했습니다.")),
  });

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-destructive bg-destructive/10">
              <ShieldOff size={11} /> 제재
            </span>
            <span className="text-xs text-muted-foreground">{user.nickname}</span>
            <span className="text-xs text-muted-foreground/70">{user.email}</span>
          </div>
          <p className="text-sm">{user.blacklistReason}</p>
          <p className="text-xs text-muted-foreground mt-1">
            제재일 {new Date(user.blacklistedAt).toLocaleString("ko-KR")}
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        <button
          onClick={() => release.mutate()}
          disabled={release.isPending}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCircle size={12} /> {release.isPending ? "해제 중…" : "해제"}
        </button>
      </div>
    </div>
  );
}
