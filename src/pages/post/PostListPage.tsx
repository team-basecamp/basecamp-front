import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Eye, MessageCircle, Plus } from "lucide-react";
import { getPosts, type PostListItem } from "../../api/post";
import { getApiErrorMessage } from "../../lib/apiError";
import useAuthStore from "../../store/authStore";
import type { PostCategory } from "../../types";

const PAGE_SIZE = 10;

const CATEGORY_LABELS: Record<PostCategory | "ALL", string> = {
  ALL: "전체",
  GENERAL: "일반",
  CAMP_MATE: "캠우 모집",
  RESERVATION_TRANSFER: "예약 양도",
};

const CATEGORY_COLORS: Record<PostCategory, string> = {
  GENERAL: "bg-secondary text-primary",
  CAMP_MATE: "bg-accent/10 text-accent",
  RESERVATION_TRANSFER: "bg-chart-3/10 text-chart-3",
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

/**
 * 커뮤니티 게시글 목록 (/posts)
 * - 카테고리(전체/일반/캠우 모집/예약 양도)별로 GET /v1/posts 를 호출해 최신순으로 보여줌
 * - 커서 페이징: 응답의 nextCursor 를 다음 요청의 cursor 로 그대로 실어 보낸다(서버가 만든 불투명 값).
 *   스크롤 하단에 도달하면 IntersectionObserver로 감지해 다음 페이지를 요청하는 무한 스크롤 방식
 */
export default function PostListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "ALL">("ALL");
  const sentinelRef = useRef<HTMLDivElement>(null); // 무한 스크롤 감지를 위한 관찰 대상(목록 맨 아래 빈 div)

  const onPostClick = (post: PostListItem) => navigate(`/posts/${post.postId}`);
  const onWriteClick = () => navigate("/posts/new");
  const onLoginRequest = () => navigate("/login");

  const {
    data,
    error,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["posts", activeCategory],
    // 첫 페이지는 커서 없이 요청한다.
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      getPosts({ category: activeCategory, cursor: pageParam, size: PAGE_SIZE }),
    // hasNext 가 false 면 nextCursor 는 null 이고, undefined 를 반환해야 더 이상 요청하지 않는다.
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const posts = data?.pages.flatMap((page) => page.content) ?? [];

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>커뮤니티</h1>
          <p className="text-muted-foreground text-sm mt-1">캠퍼들과 정보를 나눠보세요</p>
        </div>
        <button
          onClick={user ? onWriteClick : onLoginRequest}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          <Plus size={14} /> 글쓰기
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 border-b border-border pb-4">
        {(["ALL", "GENERAL", "CAMP_MATE", "RESERVATION_TRANSFER"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Post list */}
      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.postId}
            onClick={() => onPostClick(post)}
            className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              {/* Avatar (목록 응답에 프로필 사진이 없어 닉네임 첫 글자로 대체) */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {post.nickname[0]}
              </div>

              <div className="flex-1 min-w-0">
                {/* Meta row */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category]}`}>
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.nickname}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {post.title}
                </h3>

                {/* Engagement */}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye size={11} />{post.viewCount.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} />{post.commentCount}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel + loading */}
      <div ref={sentinelRef} className="h-1 mt-4" />
      {(isLoading || isFetchingNextPage) && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <p className="text-center text-sm text-destructive py-6">
          {getApiErrorMessage(error, "게시글을 불러오지 못했습니다.")}
        </p>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">모든 게시글을 불러왔습니다 ({posts.length}개)</p>
      )}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">게시글이 없습니다. 첫 글을 작성해보세요!</p>
        </div>
      )}
    </div>
  );
}
