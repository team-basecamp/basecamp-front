import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Eye, Send, Edit3, Trash2, Flag, MessageCircle, Check } from "lucide-react";
import {
  getPostDetail,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  deletePost,
  reportPost,
  type PostReportReason,
} from "../../api/post";
import { getApiErrorMessage } from "../../lib/apiError";
import { resolveImageUrl } from "../../lib/imageUrl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/common/dialog";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import useAuthStore from "../../store/authStore";
import type { PostCategory } from "../../types";

const REPORT_REASONS: { value: PostReportReason; label: string }[] = [
  { value: "SPAM", label: "스팸/광고" },
  { value: "INAPPROPRIATE", label: "부적절한 내용" },
  { value: "ILLEGAL", label: "불법 정보" },
  { value: "ETC", label: "기타" },
];

const CATEGORY_LABELS: Record<PostCategory, string> = {
  GENERAL: "일반",
  CAMP_MATE: "캠우 모집",
  RESERVATION_TRANSFER: "예약 양도",
};

const CATEGORY_COLORS: Record<PostCategory, string> = {
  GENERAL: "bg-secondary text-primary",
  CAMP_MATE: "bg-accent/10 text-accent",
  RESERVATION_TRANSFER: "bg-chart-3/10 text-chart-3",
};

/**
 * 게시글 상세 (/posts/:postId)
 * - GET /v1/posts/{postId} 로 본문을, GET /v1/posts/{postId}/comments 로 댓글 목록을 불러온다.
 * - 게시글/댓글 수정·삭제 버튼은 작성자 본인(userId 일치)에게만 노출된다.
 *   닉네임이 아니라 userId 로 비교해야 동명이인·닉네임 변경에도 안전하다.
 * - 삭제된/블라인드된 댓글은 백엔드가 본문을 안내 문구로 바꿔 내려주므로 그대로 노출하고 수정·삭제는 막는다.
 */
export default function PostDetailPage() {
  const { postId: postIdParam } = useParams<{ postId: string }>();
  const postId = Number(postIdParam);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [input, setInput] = useState(""); // 새 댓글 입력값
  const [editId, setEditId] = useState<number | null>(null); // 현재 수정 중인 댓글 id (없으면 null)
  const [editText, setEditText] = useState(""); // 수정 중인 댓글의 입력값
  const [reportOpen, setReportOpen] = useState(false); // 신고 다이얼로그 열림 여부
  const [actionError, setActionError] = useState<string | null>(null); // 게시글/댓글 변경 실패 메시지
  const [confirmPostDelete, setConfirmPostDelete] = useState(false); // 게시글 삭제 확인 다이얼로그
  const [confirmCommentId, setConfirmCommentId] = useState<number | null>(null); // 삭제 확인 중인 댓글 id

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostDetail(postId),
    enabled: Number.isFinite(postId),
    retry: false, // 404(삭제)·403(블라인드)는 재시도해도 결과가 같다.
    // 이 GET 은 서버에서 조회수를 1 올리는 부수효과가 있어, 자동 재조회가 곧 조회수 뻥튀기가 된다.
    // (탭을 옮겼다 돌아올 때마다 +1). 글 내용은 읽는 도중 바뀔 일이 드무니 자동 갱신을 모두 끄고,
    // 수정 직후처럼 실제로 바뀐 시점에만 invalidate 로 다시 불러온다.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["post", postId, "comments"],
    queryFn: () => getComments(postId),
    enabled: Number.isFinite(postId) && !!post, // 글을 못 보면 댓글도 볼 수 없다(404/403).
  });

  // 댓글 수(목록 화면의 commentCount)까지 다시 맞춰야 하므로 posts 목록도 함께 무효화한다.
  const invalidateComments = () => {
    queryClient.invalidateQueries({ queryKey: ["post", postId, "comments"] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const removePost = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.removeQueries({ queryKey: ["post", postId] });
      navigate("/posts");
    },
    // 실패하면 확인 다이얼로그를 닫아 그 뒤의 오류 메시지가 보이도록 한다.
    onError: (err) => {
      setConfirmPostDelete(false);
      setActionError(getApiErrorMessage(err, "게시글 삭제에 실패했습니다."));
    },
  });

  const addComment = useMutation({
    mutationFn: (content: string) => createComment(postId, content),
    onSuccess: () => {
      setInput("");
      invalidateComments();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "댓글 작성에 실패했습니다.")),
  });

  const editComment = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      updateComment(commentId, content),
    onSuccess: () => {
      setEditId(null);
      setEditText("");
      invalidateComments();
    },
    onError: (err) => setActionError(getApiErrorMessage(err, "댓글 수정에 실패했습니다.")),
  });

  const removeComment = useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    // 성공·실패 모두 확인 다이얼로그를 닫는다. (실패 시엔 그 뒤의 오류 메시지가 보여야 한다)
    onSuccess: () => {
      setConfirmCommentId(null);
      invalidateComments();
    },
    onError: (err) => {
      setConfirmCommentId(null);
      setActionError(getApiErrorMessage(err, "댓글 삭제에 실패했습니다."));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">
          {getApiErrorMessage(error, "게시글을 찾을 수 없습니다")}
        </p>
        <button onClick={() => navigate("/posts")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
          커뮤니티로
        </button>
      </div>
    );
  }

  const onLoginRequest = () => navigate("/login");
  const isAuthor = user?.memberId === post.userId;

  const submitComment = () => {
    if (!input.trim() || addComment.isPending) return;
    if (!user) { onLoginRequest(); return; }
    setActionError(null);
    addComment.mutate(input.trim());
  };

  const saveEdit = () => {
    if (!editText.trim() || editId === null || editComment.isPending) return;
    setActionError(null);
    editComment.mutate({ commentId: editId, content: editText.trim() });
  };

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
            {post.nickname[0]}
          </div>
          <div>
            <div className="text-sm font-medium">{post.nickname}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{new Date(post.createdAt).toLocaleDateString("ko-KR")}</span>
              <span>·</span>
              <Eye size={10} />
              <span>{post.viewCount}</span>
            </div>
          </div>
          {isAuthor && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => navigate(`/posts/${post.postId}/edit`)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-all">
                <Edit3 size={12} /> 수정
              </button>
              <button
                onClick={() => {
                  setActionError(null);
                  setConfirmPostDelete(true);
                }}
                disabled={removePost.isPending}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs text-destructive hover:bg-destructive/5 transition-all disabled:opacity-40"
              >
                <Trash2 size={12} /> 삭제
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="text-foreground leading-relaxed text-sm whitespace-pre-line mb-6">
          {post.content}
        </div>

        {/* Images (첨부 순서대로, 없으면 렌더하지 않음) */}
        {post.imageUrls.length > 0 && (
          <div className="space-y-3 mb-6">
            {post.imageUrls.map((url) => (
              <img
                key={url}
                src={resolveImageUrl(url)}
                alt="첨부 이미지"
                loading="lazy"
                className="w-full rounded-xl border border-border object-cover"
              />
            ))}
          </div>
        )}

        {actionError && <p className="text-xs text-destructive mb-3">{actionError}</p>}

        {/* Report */}
        {!isAuthor && (
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

      <ConfirmDialog
        open={confirmPostDelete}
        onOpenChange={setConfirmPostDelete}
        title="게시글을 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요. 첨부한 이미지도 함께 사라집니다."
        confirmLabel="삭제하기"
        pendingLabel="삭제 중…"
        onConfirm={() => removePost.mutate()}
        isPending={removePost.isPending}
      />

      <ConfirmDialog
        open={confirmCommentId !== null}
        onOpenChange={(o) => !o && setConfirmCommentId(null)}
        title="댓글을 삭제할까요?"
        description="삭제한 댓글은 되돌릴 수 없어요."
        confirmLabel="삭제하기"
        pendingLabel="삭제 중…"
        onConfirm={() => confirmCommentId !== null && removeComment.mutate(confirmCommentId)}
        isPending={removeComment.isPending}
      />

      {/* Comments */}
      <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
        <h2 className="font-bold text-base mb-5 flex items-center gap-2">
          <MessageCircle size={16} className="text-primary" />
          댓글 <span className="text-primary">{comments.length}</span>
        </h2>

        {comments.length > 0 ? (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => {
              // 삭제·블라인드된 댓글은 본문이 이미 안내 문구로 대체돼 있다. 수정/삭제 버튼도 숨긴다.
              const isRemoved = comment.status !== "ACTIVE";
              const isMine = user?.memberId === comment.userId;
              const avatarUrl = resolveImageUrl(comment.profileImageUrl);

              return (
                <div key={comment.commentId} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden">
                    {avatarUrl && !isRemoved ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      comment.nickname[0]
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.nickname}</span>
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
                          maxLength={1000}
                          className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} disabled={editComment.isPending} className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium disabled:opacity-40">저장</button>
                          <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs">취소</button>
                        </div>
                      </div>
                    ) : (
                      <p className={`text-sm leading-relaxed ${isRemoved ? "text-muted-foreground/60 italic" : "text-muted-foreground"}`}>
                        {comment.content}
                      </p>
                    )}

                    {editId !== comment.commentId && isMine && !isRemoved && (
                      <div className="flex gap-3 mt-1.5">
                        <button onClick={() => { setEditId(comment.commentId); setEditText(comment.content); }} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                          <Edit3 size={10} /> 수정
                        </button>
                        <button
                          onClick={() => {
                            setActionError(null);
                            setConfirmCommentId(comment.commentId);
                          }}
                          className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-0.5 transition-colors"
                        >
                          <Trash2 size={10} /> 삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
                  maxLength={1000}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground resize-none"
                />
                <button
                  onClick={submitComment}
                  disabled={!input.trim() || addComment.isPending}
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
