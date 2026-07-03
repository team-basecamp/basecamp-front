import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MessageCircle, Plus, Flag } from "lucide-react";
import { POSTS } from "../../data/posts";
import useAuthStore from "../../store/authStore";
import type { Post, PostCategory } from "../../types";

const PAGE_SIZE = 5;

const CATEGORY_LABELS: Record<PostCategory | "ALL", string> = {
  ALL: "전체",
  GENERAL: "일반",
  CREW: "캠우 모집",
  TRANSFER: "예약 양도",
};

const CATEGORY_COLORS: Record<PostCategory, string> = {
  GENERAL: "bg-secondary text-primary",
  CREW: "bg-accent/10 text-accent",
  TRANSFER: "bg-chart-3/10 text-chart-3",
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
 * - 카테고리(전체/일반/캠우 모집/예약 양도)별로 게시글을 필터링해서 보여줌
 * - 스크롤 하단에 도달하면 IntersectionObserver로 감지해 목록을 추가 로드하는 무한 스크롤 방식
 */
export default function PostListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [activeCategory, setActiveCategory] = useState<PostCategory | "ALL">("ALL");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); // 현재까지 화면에 보여줄 개수 (무한 스크롤 페이지네이션)
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null); // 무한 스크롤 감지를 위한 관찰 대상(목록 맨 아래 빈 div)

  const onPostClick = (post: Post) => navigate(`/posts/${post.postId}`);
  const onWriteClick = () => navigate("/posts/new");
  const onLoginRequest = () => navigate("/login");

  const filtered = activeCategory === "ALL"
    ? POSTS
    : POSTS.filter((p) => p.category === activeCategory);
  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => setVisibleCount(PAGE_SIZE), [activeCategory]);

  // setTimeout으로 네트워크 요청을 흉내낸 mock 로딩 (실제 API 연동 시 서버 페이지네이션 호출로 교체)
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    setTimeout(() => { setVisibleCount((n) => n + PAGE_SIZE); setLoading(false); }, 600);
  }, [loading, hasMore]);

  // sentinel(빈 div)이 화면에 보이는 순간(스크롤이 바닥에 닿는 순간) loadMore 실행
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((e) => { if (e[0].isIntersecting) loadMore(); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

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
        {(["ALL", "GENERAL", "CREW", "TRANSFER"] as const).map((cat) => (
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
        {visible.map((post) => (
          <div
            key={post.postId}
            onClick={() => onPostClick(post)}
            className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {post.avatar}
              </div>

              <div className="flex-1 min-w-0">
                {/* Meta row */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[post.category]}`}>
                    {CATEGORY_LABELS[post.category]}
                  </span>
                  <span className="text-xs text-muted-foreground">{post.writer}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{timeAgo(post.createdAt)}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-1 mb-1">
                  {post.title}
                </h3>

                {/* Preview */}
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {post.content}
                </p>

                {/* Engagement */}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye size={11} />{post.viewCount.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} />{post.commentCount}</span>
                  <span className="ml-auto flex items-center gap-1 text-muted-foreground/60">
                    <Flag size={10} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sentinel + loading */}
      <div ref={sentinelRef} className="h-1 mt-4" />
      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      )}
      {!hasMore && visible.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-6">모든 게시글을 불러왔습니다 ({filtered.length}개)</p>
      )}
      {visible.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MessageCircle size={40} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm">게시글이 없습니다. 첫 글을 작성해보세요!</p>
        </div>
      )}
    </div>
  );
}
