import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { FileText, Edit3, Trash2 } from "lucide-react";
import { getMyPosts } from "../../api/member";
import { deletePost } from "../../api/post";
import { getApiErrorMessage } from "../../lib/apiError";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import MyPageHeader from "./MyPageHeader";

const PAGE_SIZE = 10;

/**
 * 내 게시글 목록 (/mypage/posts)
 * - GET /v1/users/me/posts 로 로그인한 회원이 작성한 글을 최신순으로 불러온다.
 *   삭제·블라인드된 글은 서버가 목록에서 빼고 내려주므로 프론트에서 따로 거르지 않는다.
 * - 커서 페이징: 응답의 nextCursor 를 다음 요청의 cursor 로 그대로 실어 보낸다(서버가 만든 불투명 값).
 *   목록 하단 sentinel 이 보이면 다음 페이지를 요청하는 무한 스크롤 방식 (PostListPage 와 동일)
 * - 수정·삭제는 각 글의 postId 로 기존 게시글 API를 그대로 호출한다.
 */
export default function MyPostsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const sentinelRef = useRef<HTMLDivElement>(null); // 무한 스크롤 감지를 위한 관찰 대상(목록 맨 아래 빈 div)

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null); // 삭제 확인 중인 게시글 id
  const [actionError, setActionError] = useState<string | null>(null); // 삭제 실패 메시지

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["myPosts"],
    // 첫 페이지는 커서 없이 요청한다.
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => getMyPosts({ cursor: pageParam, size: PAGE_SIZE }),
    // hasNext 가 false 면 nextCursor 는 null 이고, undefined 를 반환해야 더 이상 요청하지 않는다.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user, // 비로그인 상태에서는 401 이 뻔하므로 아예 요청하지 않는다.
  });

  const posts = data?.pages.flatMap((page) => page.content) ?? [];

  const removePost = useMutation({
    mutationFn: (postId: number) => deletePost(postId),
    onSuccess: (_result, postId) => {
      setConfirmDeleteId(null);
      // 내 목록은 물론, 커뮤니티 목록과 해당 글의 상세 캐시까지 함께 정리한다.
      queryClient.invalidateQueries({ queryKey: ["myPosts"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.removeQueries({ queryKey: ["post", postId] });
    },
    // 실패하면 확인 다이얼로그를 닫아 그 뒤의 오류 메시지가 보이도록 한다.
    onError: (err) => {
      setConfirmDeleteId(null);
      setActionError(getApiErrorMessage(err, "게시글 삭제에 실패했습니다."));
    },
  });

  // sentinel(빈 div)이 화면에 보이는 순간(스크롤이 바닥에 닿는 순간) 다음 페이지 요청
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!user) return <RequireLogin />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="posts" />

      {actionError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          {actionError}
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.postId}
            onClick={() => navigate(`/posts/${post.postId}`)}
            className="bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm mb-1 hover:text-primary">{post.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
                  <span>조회 {post.viewCount.toLocaleString()}</span>
                  <span>댓글 {post.commentCount}</span>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/posts/${post.postId}/edit`); }}
                  className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-all"
                >
                  <Edit3 size={12} className="text-muted-foreground" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionError(null);
                    setConfirmDeleteId(post.postId);
                  }}
                  disabled={removePost.isPending}
                  className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-all disabled:opacity-40"
                >
                  <Trash2 size={12} className="text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중…</div>
        )}

        {error && !isLoading && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {getApiErrorMessage(error, "게시글을 불러오지 못했습니다")}
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">작성한 게시글이 없습니다</p>
          </div>
        )}

        {/* 무한 스크롤 sentinel. 관찰되려면 화면에 존재해야 하므로 조건부로 감추지 않는다. */}
        <div ref={sentinelRef} className="h-1" />
        {isFetchingNextPage && (
          <div className="py-4 text-center text-xs text-muted-foreground">더 불러오는 중…</div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="게시글을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 첨부한 이미지도 함께 사라집니다."
        confirmLabel="삭제하기"
        pendingLabel="삭제 중…"
        onConfirm={() => confirmDeleteId !== null && removePost.mutate(confirmDeleteId)}
        isPending={removePost.isPending}
      />
    </div>
  );
}
