import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Send, Edit3, Trash2, Flag, MessageCircle, Check } from "lucide-react";
import { POSTS, POST_COMMENTS } from "../../data/posts";
import { reportPost, type PostReportReason } from "../../api/post";
import { getApiErrorMessage } from "../../lib/apiError";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/common/dialog";
import useAuthStore from "../../store/authStore";
import type { PostComment, PostCategory } from "../../types";

const REPORT_REASONS: { value: PostReportReason; label: string }[] = [
  { value: "SPAM", label: "스팸/광고" },
  { value: "INAPPROPRIATE", label: "부적절한 내용" },
  { value: "ILLEGAL", label: "불법 정보" },
  { value: "ETC", label: "기타" },
];

const CATEGORY_LABELS: Record<PostCategory, string> = {
  GENERAL: "일반",
  CREW: "캠우 모집",
  TRANSFER: "예약 양도",
};

const CATEGORY_COLORS: Record<PostCategory, string> = {
  GENERAL: "bg-secondary text-primary",
  CREW: "bg-accent/10 text-accent",
  TRANSFER: "bg-chart-3/10 text-chart-3",
};

/**
 * 게시글 상세 (/posts/:postId)
 * - 게시글 본문과 댓글 목록을 보여주고, 댓글 작성/수정/삭제 기능 제공
 * - 작성자 본인에게만 게시글 수정/삭제 버튼, 댓글 작성자 본인에게만 댓글 수정/삭제 버튼이 노출됨
 */
export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const post = POSTS.find((p) => p.postId === Number(postId));

  const [comments, setComments] = useState<PostComment[]>(
    POST_COMMENTS.filter((c) => c.postId === Number(postId))
  );
  const [input, setInput] = useState(""); // 새 댓글 입력값
  const [editId, setEditId] = useState<number | null>(null); // 현재 수정 중인 댓글 id (없으면 null)
  const [editText, setEditText] = useState(""); // 수정 중인 댓글의 입력값
  const [reportOpen, setReportOpen] = useState(false); // 신고 다이얼로그 열림 여부

  if (!post) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">게시글을 찾을 수 없습니다</p>
        <button onClick={() => navigate("/posts")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          커뮤니티로
        </button>
      </div>
    );
  }

  const onLoginRequest = () => navigate("/login");

  // POSTS 배열에서 직접 제거(splice) 후 목록 페이지로 이동. 목록 페이지 진입 시 POSTS를 다시 필터링하므로 별도 리렌더 트리거는 불필요
  const deletePost = () => {
    const idx = POSTS.findIndex((p) => p.postId === post.postId);
    if (idx !== -1) POSTS.splice(idx, 1);
    navigate("/posts");
  };

  const submitComment = () => {
    if (!input.trim()) return;
    if (!user) { onLoginRequest(); return; }
    setComments((prev) => [
      ...prev,
      {
        commentId: Date.now(),
        postId: post.postId,
        writer: user.nickname,
        avatar: user.nickname[0],
        content: input.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setInput("");
  };

  const saveEdit = () => {
    if (!editText.trim() || editId === null) return;
    setComments((prev) => prev.map((c) => c.commentId === editId ? { ...c, content: editText.trim() } : c));
    setEditId(null); setEditText("");
  };

  const deleteComment = (id: number) => setComments((prev) => prev.filter((c) => c.commentId !== id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate("/posts")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 커뮤니티
      </button>

      {/* Post */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
        {/* Category + title */}
        <div className="mb-4">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[post.category]}`}>
            {CATEGORY_LABELS[post.category]}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-4 leading-snug" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {post.title}
        </h1>

        {/* Author meta */}
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-white">
            {post.avatar}
          </div>
          <div>
            <div className="text-sm font-medium">{post.writer}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
              <span>·</span>
              <Eye size={10} />
              <span>{post.viewCount + 1}</span>
            </div>
          </div>
          {user?.nickname === post.writer && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => navigate(`/posts/${post.postId}/edit`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
                <Edit3 size={12} /> 수정
              </button>
              <button onClick={deletePost} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs text-destructive hover:bg-destructive/5 transition-all">
                <Trash2 size={12} /> 삭제
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-foreground leading-relaxed text-sm whitespace-pre-line mb-6">
          {post.content}
        </div>

        {/* Report */}
        {user?.nickname !== post.writer && (
          <div className="flex justify-end">
            <button
              onClick={() => (user ? setReportOpen(true) : onLoginRequest())}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Flag size={12} /> 신고
            </button>
          </div>
        )}
      </div>

      <ReportDialog postId={post.postId} open={reportOpen} onClose={() => setReportOpen(false)} />

      {/* Comments */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <h2 className="font-bold text-base mb-5 flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          댓글 <span className="text-primary">{comments.length}</span>
        </h2>

        {comments.length > 0 ? (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div key={comment.commentId} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {comment.avatar || comment.writer[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{comment.writer}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>

                  {editId === comment.commentId ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                        className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium">저장</button>
                        <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">취소</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
                  )}

                  {editId !== comment.commentId && user?.nickname === comment.writer && (
                    <div className="flex gap-3 mt-1.5">
                      <button onClick={() => { setEditId(comment.commentId); setEditText(comment.content); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                        <Edit3 size={10} /> 수정
                      </button>
                      <button onClick={() => deleteComment(comment.commentId)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors">
                        <Trash2 size={10} /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm mb-6">
            첫 댓글을 남겨보세요! 💬
          </div>
        )}

        {/* Comment input */}
        <div className="border-t border-border pt-5">
          {user ? (
            <div className="flex gap-3 items-end">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {user.nickname[0].toUpperCase()}
              </div>
              <div className="flex-1 bg-muted rounded-2xl flex items-end gap-2 px-4 py-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="댓글을 입력하세요..."
                  rows={1}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none"
                />
                <button
                  onClick={submitComment}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-all disabled:opacity-40 flex-shrink-0"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={onLoginRequest} className="w-full py-3 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all">
              댓글을 작성하려면 로그인하세요
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 게시글 신고 다이얼로그. 사유(필수, 4종)와 상세 내용(선택)을 받아 신고를 접수한다.
 * (POST /v1/posts/{postId}/report) 접수되면 성공 화면을 보여준 뒤 닫는다.
 * 중복 신고(409) 등 백엔드 오류 메시지는 그대로 노출한다.
 */
function ReportDialog({ postId, open, onClose }: { postId: number; open: boolean; onClose: () => void }) {
  const [reason, setReason] = useState<PostReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null); // 접수 성공 메시지(있으면 완료 화면)

  const report = useMutation({
    mutationFn: () => reportPost(postId, reason as PostReportReason, description),
    onSuccess: (res) => setDone(res.message),
    onError: (err) => setError(getApiErrorMessage(err, "신고 접수에 실패했습니다.")),
  });

  // 닫을 때 입력·상태를 초기화해 다음에 다시 열면 깨끗한 폼이 되도록 한다.
  const close = () => {
    setReason(null);
    setDescription("");
    setError(null);
    setDone(null);
    report.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>게시글 신고</DialogTitle>
          <DialogDescription>부적절한 게시글을 신고합니다. 신고 사유를 선택해 주세요.</DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <p className="text-sm text-foreground">{done}</p>
            <button
              onClick={close}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
            >
              확인
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {REPORT_REASONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setReason(value)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                    reason === value
                      ? "border-destructive bg-destructive/5 text-destructive"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="상세 내용을 입력하세요 (선택, 최대 1000자)"
              className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
            />

            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className="flex gap-2 justify-end">
              <button
                onClick={close}
                disabled={report.isPending}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
              >
                취소
              </button>
              <button
                onClick={() => {
                  setError(null);
                  report.mutate();
                }}
                disabled={report.isPending || reason === null}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-destructive text-white text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flag size={14} /> {report.isPending ? "접수 중…" : "신고하기"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
