import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Edit3, Trash2 } from "lucide-react";
import { POSTS } from "../../data/posts";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import MyPageHeader from "./MyPageHeader";

/**
 * 내 게시글 목록 (/mypage/posts)
 * - 로그인한 유저가 작성한 게시글(POSTS 중 writer가 본인 닉네임인 항목)만 필터링해서 보여줌
 * - 게시글 수정/삭제 버튼 제공, 삭제 시 deletePost 참고
 */
export default function MyPostsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  // POSTS 배열은 zustand store가 아니라 모듈 레벨 배열이라 mutate해도 리렌더가 자동으로 일어나지 않음.
  // 그래서 실제로 쓰지 않는 더미 state(setVersion)를 하나 두고, 값이 바뀔 때마다 강제로 리렌더를 트리거함.
  const [, setVersion] = useState(0);

  if (!user) return <RequireLogin />;

  const myPosts = POSTS.filter((p) => p.writer === user.nickname);

  // POSTS.splice(...)로 배열을 직접 mutate한 뒤 setVersion으로 리렌더를 강제해야
  // 화면에서 삭제된 게시글이 즉시 사라짐 (POSTS 참조 자체는 안 바뀌므로 setState만으로는 리렌더되지 않음)
  const deletePost = (postId: number) => {
    const idx = POSTS.findIndex((p) => p.postId === postId);
    if (idx !== -1) POSTS.splice(idx, 1);
    setVersion((v) => v + 1);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="posts" />

      <div className="space-y-3">
        {myPosts.map((post) => (
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
                  <span>조회 {post.viewCount}</span>
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
                  onClick={(e) => { e.stopPropagation(); deletePost(post.postId); }}
                  className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-all"
                >
                  <Trash2 size={12} className="text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {myPosts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">작성한 게시글이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
