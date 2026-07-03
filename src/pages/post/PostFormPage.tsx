import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { POSTS } from "../../data/posts";
import useAuthStore from "../../store/authStore";
import type { Post, PostCategory } from "../../types";

const CATEGORY_OPTIONS: { value: PostCategory; label: string; desc: string }[] = [
  { value: "GENERAL", label: "일반", desc: "자유롭게 캠핑 정보를 나눠요" },
  { value: "CREW", label: "캠우 모집", desc: "같이 캠핑 갈 동행을 구해요" },
  { value: "TRANSFER", label: "예약 양도", desc: "예약 날짜를 양도합니다" },
];

/**
 * 게시글 작성/수정 (/posts/new, /posts/:postId/edit)
 * - postId 파라미터 유무로 작성 모드와 수정 모드를 함께 처리 (postId가 있으면 기존 게시글을 불러와 수정 모드로 동작)
 */
export default function PostFormPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const editingPost = postId ? POSTS.find((p) => p.postId === Number(postId)) : undefined;
  const isEdit = !!editingPost;

  const [category, setCategory] = useState<PostCategory>(editingPost?.category ?? "GENERAL");
  const [title, setTitle] = useState(editingPost?.title ?? "");
  const [content, setContent] = useState(editingPost?.content ?? "");

  const canSubmit = title.trim().length > 0 && content.trim().length > 0;

  const onBack = () => navigate(isEdit ? `/posts/${editingPost!.postId}` : "/posts");

  // 수정 모드: POSTS 배열 안의 기존 게시글 객체를 Object.assign으로 직접 갱신 (참조가 유지되어 상세 페이지에서 바로 반영됨)
  // 작성 모드: 새 게시글 객체를 만들어 POSTS 맨 앞에 추가
  const onSubmit = () => {
    if (!canSubmit) return;
    if (isEdit) {
      Object.assign(editingPost!, { title, content, category });
      navigate(`/posts/${editingPost!.postId}`);
      return;
    }
    const newPost: Post = {
      postId: Date.now(),
      title,
      content,
      category,
      writer: user?.nickname ?? "익명",
      avatar: (user?.nickname ?? "익")[0],
      createdAt: new Date().toISOString(),
      viewCount: 0,
      commentCount: 0,
    };
    POSTS.unshift(newPost);
    navigate(`/posts/${newPost.postId}`);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 커뮤니티
      </button>

      <h1 className="text-2xl font-bold mb-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {isEdit ? "게시글 수정" : "게시글 작성"}
      </h1>

      <div className="space-y-5">
        {/* Category */}
        <div>
          <label className="text-sm font-semibold mb-2 block">카테고리</label>
          <div className="grid grid-cols-3 gap-3">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategory(opt.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  category === opt.value
                    ? "border-primary bg-secondary text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                <p className="font-semibold text-sm">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-semibold mb-2 block">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            maxLength={100}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/100</p>
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-semibold mb-2 block">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="내용을 입력하세요..."
            rows={12}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground resize-none leading-relaxed"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onBack} className="px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
