import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Save, X } from "lucide-react";
import { getMyProfile, updateMyProfile } from "../../api/member";
import RequireLogin from "../../components/common/RequireLogin";
import { getApiErrorMessage } from "../../lib/apiError";
import { resolveImageUrl } from "../../lib/imageUrl";
import useAuthStore from "../../store/authStore";

/**
 * 내 정보 수정 (/mypage/profile)
 * - 백엔드 UserController(GET·POST /v1/users/me)와 연동. 닉네임과 프로필 이미지(파일 업로드)만 수정 가능하며
 *   이메일·소셜 제공자·권한은 바꿀 수 없다(서버가 요청 필드로 받지 않는다).
 * - 프로필 이미지는 MinIO 로 업로드된다. 파일을 고르면 교체, "제거"를 누르면 삭제(removeImage), 아무것도 안 하면 유지.
 * - 저장 성공 시 authStore 의 user 를 함께 갱신해, 헤더/프로필 카드에 즉시 반영한다.
 */
export default function ProfileEditPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [nickname, setNickname] = useState("");
  // 서버에 저장돼 있는 기존 프로필 이미지 URL(없으면 null). 미리보기/제거 판단에 쓴다.
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  // 이번에 새로 고른 파일. 있으면 이 파일로 교체한다.
  const [newFile, setNewFile] = useState<File | null>(null);
  // 파일 없이 기존 이미지를 지우겠다고 "제거"를 누른 상태.
  const [removeExisting, setRemoveExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 서버의 최신 프로필로 폼을 채운다(닉네임/이미지가 다른 기기에서 바뀌었을 수 있으므로 store 대신 서버를 신뢰).
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
  });

  useEffect(() => {
    if (data) {
      setNickname(data.nickname);
      setExistingImageUrl(data.profileImageUrl ?? null);
    }
  }, [data]);

  // 새로 고른 파일의 로컬 미리보기(objectURL). 파일이 바뀔 때만 만들고 직전 것은 revoke 한다.
  const newFilePreview = useMemo(() => (newFile ? URL.createObjectURL(newFile) : null), [newFile]);
  useEffect(() => () => { if (newFilePreview) URL.revokeObjectURL(newFilePreview); }, [newFilePreview]);

  // 실제로 화면에 보여줄 미리보기: 새 파일 > (제거 안 했으면) 기존 이미지 > 없음.
  const previewSrc = newFilePreview ?? (removeExisting ? null : resolveImageUrl(existingImageUrl));
  const hasImage = !!previewSrc;

  const pickFile = (file: File | null) => {
    if (!file) return;
    setNewFile(file);
    setRemoveExisting(false);
    setError(null);
  };

  // "제거": 새로 고른 파일이 있으면 그것만 취소하고, 기존 이미지가 있으면 삭제 표시한다.
  const clearImage = () => {
    setNewFile(null);
    if (existingImageUrl) setRemoveExisting(true);
  };

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile(
        // 파일을 새로 올리면 removeImage 는 무시되므로 파일이 없을 때만 의미가 있다.
        { nickname: nickname.trim(), removeImage: !newFile && removeExisting },
        newFile
      ),
    onSuccess: (updated) => {
      // store 를 갱신하되 accessToken 은 유지한다(setUser 는 두 번째 인자가 없으면 토큰을 지운다).
      if (user) {
        setUser(
          {
            ...user,
            nickname: updated.nickname,
            profileImage: updated.profileImageUrl ?? undefined,
          },
          accessToken ?? undefined
        );
      }
      navigate("/mypage");
    },
    onError: (err) => setError(getApiErrorMessage(err, "프로필 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.")),
  });

  if (!user) return <RequireLogin />;

  const trimmed = nickname.trim();
  const canSubmit = trimmed.length > 0 && trimmed.length <= 50 && !save.isPending;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate("/mypage")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> 마이페이지
      </button>

      <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        내 정보 수정
      </h1>
      <p className="text-muted-foreground text-sm mb-8">닉네임과 프로필 이미지를 변경할 수 있습니다.</p>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : isError ? (
        <div className="py-16 text-center text-destructive text-sm">프로필을 불러오지 못했습니다.</div>
      ) : (
        <div className="space-y-6">
          {/* 프로필 이미지 미리보기 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary overflow-hidden flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
              {previewSrc ? (
                <img src={previewSrc} alt="프로필 미리보기" className="w-full h-full object-cover" />
              ) : (
                (trimmed[0] ?? user.nickname[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <div>{data?.email}</div>
              <div className="mt-0.5">{data?.provider} 계정 · 이메일은 변경할 수 없습니다.</div>
            </div>
          </div>

          {/* 프로필 이미지 업로드 */}
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              프로필 이미지
              {hasImage && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={11} /> 제거
                </button>
              )}
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all cursor-pointer">
              <ImagePlus size={16} />
              {hasImage ? "이미지 변경" : "이미지 선택"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0] ?? null);
                  e.target.value = ""; // 같은 파일을 다시 고를 수 있게 초기화
                }}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">이미지를 고르면 교체되고, "제거"를 누르면 삭제됩니다.</p>
          </div>

          {/* 닉네임 */}
          <div>
            <label className="text-sm font-semibold mb-2 block">닉네임</label>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={50}
              placeholder="닉네임을 입력해주세요"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">{trimmed.length}/50</p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => navigate("/mypage")}
              disabled={save.isPending}
              className="flex-1 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
            >
              취소
            </button>
            <button
              onClick={() => canSubmit && save.mutate()}
              disabled={!canSubmit}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save size={15} /> {save.isPending ? "저장 중…" : "저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
