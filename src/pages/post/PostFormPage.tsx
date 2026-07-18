import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { createPost, getPostDetail, updatePost } from "../../api/post";
import { getApiErrorMessage } from "../../lib/apiError";
import { resolveImageUrl } from "../../lib/imageUrl";
import useAuthStore from "../../store/authStore";
import type { PostCategory } from "../../types";

const CATEGORY_OPTIONS: { value: PostCategory; label: string; desc: string }[] = [
  { value: "GENERAL", label: "일반", desc: "자유롭게 캠핑 정보를 나눠요" },
  { value: "CAMP_MATE", label: "캠우 모집", desc: "같이 캠핑 갈 동행을 구해요" },
  { value: "RESERVATION_TRANSFER", label: "예약 양도", desc: "예약 날짜를 양도합니다" },
];

/** 첨부 이미지 최대 개수. 백엔드 file.upload.max-count 와 맞춰야 한다(초과 시 IMAGE_COUNT_EXCEEDED). */
const MAX_IMAGES = 10;

/**
 * 게시글 작성/수정 (/posts/new, /posts/:postId/edit)
 * - postId 파라미터 유무로 작성 모드와 수정 모드를 함께 처리 (postId가 있으면 GET /v1/posts/{postId}로 기존 글을 불러옴)
 * - 이미지는 전체 교체 방식이다. 최종 첨부 = 남긴 기존 이미지(keepImageUrls) + 새로 고른 파일(images) 이고,
 *   화면에서 지운 기존 이미지는 keepImageUrls 에서 빠지므로 서버에서 파일까지 삭제된다.
 */
export default function PostFormPage() {
  const { postId: postIdParam } = useParams<{ postId: string }>();
  const postId = postIdParam ? Number(postIdParam) : undefined;
  const isEdit = postId !== undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: editingPost, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostDetail(postId!),
    enabled: isEdit,
    retry: false,
  });

  const [category, setCategory] = useState<PostCategory>("GENERAL");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keepImageUrls, setKeepImageUrls] = useState<string[]>([]); // 수정 시 남길 기존 이미지 경로
  const [newFiles, setNewFiles] = useState<File[]>([]); // 이번에 새로 올릴 파일
  const [error, setError] = useState<string | null>(null);

  // 수정 모드는 기존 글을 비동기로 받아오므로, 도착한 시점에 폼 초기값을 채운다.
  useEffect(() => {
    if (!editingPost) return;
    setCategory(editingPost.category);
    setTitle(editingPost.title);
    setContent(editingPost.content);
    setKeepImageUrls(editingPost.imageUrls);
  }, [editingPost]);

  // 새 파일 미리보기 URL. 렌더마다 createObjectURL 을 부르면 제목 한 글자 칠 때마다 blob 이 새로 쌓이므로
  // 파일 목록이 바뀔 때만 만들고, 바뀌기 직전 것은 revoke 해 되돌려준다.
  const previewUrls = useMemo(() => newFiles.map((file) => URL.createObjectURL(file)), [newFiles]);
  useEffect(() => () => previewUrls.forEach((url) => URL.revokeObjectURL(url)), [previewUrls]);

  const imageCount = keepImageUrls.length + newFiles.length;
  const canSubmit = title.trim().length > 0 && content.trim().length > 0 && imageCount <= MAX_IMAGES;

  const onBack = () => navigate(isEdit ? `/posts/${postId}` : "/posts");

  const submit = useMutation({
    mutationFn: () => {
      const request = { category, title: title.trim(), content: content.trim() };
      return isEdit
        ? updatePost(postId!, { ...request, keepImageUrls }, newFiles)
        : createPost(request, newFiles);
    },
    onSuccess: (post) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["post", post.postId] });
      navigate(`/posts/${post.postId}`);
    },
    onError: (err) =>
      setError(getApiErrorMessage(err, isEdit ? "게시글 수정에 실패했습니다." : "게시글 등록에 실패했습니다.")),
  });

  const onPickFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files);
    const room = MAX_IMAGES - imageCount;
    if (picked.length > room) {
      setError(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
    }
    setNewFiles((prev) => [...prev, ...picked.slice(0, Math.max(room, 0))]);
  };

  if (isEdit && isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

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
            maxLength={200}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          />
          <p className="text-xs text-muted-foreground text-right mt-1">{title.length}/200</p>
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

        {/* Images */}
        <div>
          <label className="text-sm font-semibold mb-2 block">
            이미지 <span className="text-xs font-normal text-muted-foreground">({imageCount}/{MAX_IMAGES})</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {/* 기존 이미지: 지우면 keepImageUrls 에서 빠져 서버에서도 삭제된다 */}
            {keepImageUrls.map((url) => (
              <div key={url} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                <img src={resolveImageUrl(url)} alt="첨부 이미지" className="w-full h-full object-cover" />
                <button
                  onClick={() => setKeepImageUrls((prev) => prev.filter((u) => u !== url))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* 새로 고른 파일: 아직 업로드 전이라 로컬 미리보기(objectURL)로 보여준다 */}
            {newFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                <img src={previewUrls[i]} alt={file.name} className="w-full h-full object-cover" />
                <button
                  onClick={() => setNewFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {imageCount < MAX_IMAGES && (
              <label className="w-24 h-24 rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer text-muted-foreground hover:border-primary hover:text-primary transition-all">
                <ImagePlus size={18} />
                <span className="text-xs">추가</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    setError(null);
                    onPickFiles(e.target.files);
                    e.target.value = ""; // 같은 파일을 연속으로 고를 수 있게 초기화
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onBack} className="px-6 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all">
            취소
          </button>
          <button
            onClick={() => {
              if (!user) { navigate("/login"); return; }
              setError(null);
              submit.mutate();
            }}
            disabled={!canSubmit || submit.isPending}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submit.isPending ? "저장 중…" : isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
