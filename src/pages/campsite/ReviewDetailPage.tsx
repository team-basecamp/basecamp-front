import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Heart, Send, Edit3, Trash2, MapPin } from "lucide-react";
import StarRow from "../../components/common/StarRow";
import { CAMPS } from "../../data/camps";
import { INITIAL_REVIEWS } from "../../data/reviews";
import useAuthStore from "../../store/authStore";
import type { Comment } from "../../types";
import "./ReviewDetailPage.css";

/**
 * 후기 상세 페이지 (/reviews/:reviewId)
 * - 개별 후기의 사진/내용/좋아요와 댓글(작성·수정·삭제·좋아요)을 처리
 * - 댓글은 mock 데이터(review.comments)로 초기화된 컴포넌트 로컬 state이며, 새로고침 시 초기화됨
 * - 비로그인 상태에서 댓글 작성 시도 시 로그인 페이지로 이동시킴
 */
export default function ReviewDetailPage() {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const review = INITIAL_REVIEWS.find((r) => r.id === Number(reviewId));
  const camp = review ? CAMPS.find((c) => c.contentId === review.campId) : undefined;

  const [comments, setComments] = useState<Comment[]>(review?.comments ?? []);
  const [commentInput, setCommentInput] = useState("");
  const [editCommentId, setEditCommentId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [reviewLiked, setReviewLiked] = useState(false);

  if (!review) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">후기를 찾을 수 없습니다</p>
        <button onClick={() => navigate("/reviews")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          후기 목록으로
        </button>
      </div>
    );
  }

  const onLoginRequest = () => navigate("/login");
  const onCampClick = () => camp && navigate(`/campsites/${camp.contentId}`);

  // 로그인한 사용자만 댓글 등록 가능 (비로그인이면 로그인 페이지로 이동)
  const submitComment = () => {
    if (!commentInput.trim()) return;
    if (!user) { onLoginRequest(); return; }
    const newComment: Comment = {
      id: Date.now(),
      reviewId: review.id,
      author: user.nickname,
      avatar: user.nickname[0],
      content: commentInput.trim(),
      date: new Date().toISOString().slice(0, 10),
      likes: 0,
    };
    setComments((prev) => [...prev, newComment]);
    setCommentInput("");
  };

  const deleteComment = (id: number) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const saveEdit = () => {
    if (!editText.trim() || editCommentId === null) return;
    setComments((prev) => prev.map((c) => c.id === editCommentId ? { ...c, content: editText.trim() } : c));
    setEditCommentId(null);
    setEditText("");
  };

  const toggleCommentLike = (id: number) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate("/reviews")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 후기 목록으로
      </button>

      {/* Review card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden mb-6">
        {/* Review images */}
        {review.images.length > 0 && (
          <div className="flex gap-1 h-64 bg-muted overflow-x-auto">
            {review.images.map((src, i) => (
              <img key={i} src={src} alt="후기 이미지" className="h-full w-auto flex-shrink-0 object-cover" />
            ))}
          </div>
        )}

        <div className="p-6 sm:p-8">
          {/* Author & meta */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-base font-bold text-primary-foreground flex-shrink-0">
              {review.avatar}
            </div>
            <div className="flex-1">
              <div className="font-bold text-base">{review.author}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <StarRow rating={review.rating} size={14} />
                <span className="text-xs text-muted-foreground">{review.date}</span>
              </div>
            </div>
          </div>

          {/* Camp link */}
          <button
            onClick={onCampClick}
            className="flex items-center gap-1.5 text-xs text-primary font-medium mb-4 hover:underline"
          >
            <MapPin size={12} /> {camp?.facltNm} 바로가기
          </button>

          {/* Content */}
          <p className="text-foreground leading-relaxed text-base mb-6">{review.content}</p>

          {/* Likes */}
          <div className="flex items-center gap-4 border-t border-border pt-4">
            <button
              onClick={() => setReviewLiked((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${reviewLiked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-primary"}`}
            >
              <Heart size={14} className={reviewLiked ? "fill-primary" : ""} />
              도움돼요 {review.likes + (reviewLiked ? 1 : 0)}
            </button>
            <span className="text-xs text-muted-foreground">
              댓글 {comments.length}개
            </span>
          </div>
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
        <h2 className="font-bold text-lg mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
          댓글 <span className="text-primary">{comments.length}</span>
        </h2>

        {/* Comment list */}
        {comments.length > 0 ? (
          <div className="space-y-5 mb-8">
            {comments.map((comment, i) => (
              <div
                key={comment.id}
                className="comment-item"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center text-xs font-bold text-foreground flex-shrink-0 border border-border">
                    {comment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-muted-foreground">{comment.date}</span>
                    </div>

                    {editCommentId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={2}
                          className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium">저장</button>
                          <button onClick={() => setEditCommentId(null)} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">취소</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                    )}

                    {editCommentId !== comment.id && (
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => toggleCommentLike(comment.id)}
                          className={`flex items-center gap-1 text-xs transition-colors ${likedComments.has(comment.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                        >
                          <Heart size={11} className={likedComments.has(comment.id) ? "fill-primary" : ""} />
                          {comment.likes + (likedComments.has(comment.id) ? 1 : 0)}
                        </button>

                        {user && comment.author === user.nickname && (
                          <>
                            <button
                              onClick={() => { setEditCommentId(comment.id); setEditText(comment.content); }}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Edit3 size={11} /> 수정
                            </button>
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 size={11} /> 삭제
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm mb-8">
            첫 댓글을 남겨보세요! 💬
          </div>
        )}

        {/* Comment input */}
        <div className="comment-form border-t border-border pt-5">
          {user ? (
            <div className="flex gap-3 items-end">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0">
                {user.nickname[0]}
              </div>
              <div className="flex-1 bg-muted rounded-2xl flex items-end gap-2 px-4 py-3">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="댓글을 입력하세요... (Enter로 전송)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none leading-relaxed"
                />
                <button
                  onClick={submitComment}
                  disabled={!commentInput.trim()}
                  className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/80 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginRequest}
              className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              댓글을 작성하려면 로그인하세요
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
