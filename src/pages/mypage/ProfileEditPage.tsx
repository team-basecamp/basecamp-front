import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, X } from "lucide-react";
import { getMyProfile, updateMyProfile } from "../../api/member";
import RequireLogin from "../../components/common/RequireLogin";
import { getApiErrorMessage } from "../../lib/apiError";
import useAuthStore from "../../store/authStore";

/**
 * 내 정보 수정 (/mypage/profile)
 * - 백엔드 UserController(GET·PATCH /v1/users/me)와 연동. 닉네임과 프로필 이미지 URL 만 수정 가능하며
 *   이메일·소셜 제공자·권한은 바꿀 수 없다(서버가 요청 필드로 받지 않는다).
 * - 저장 성공 시 authStore 의 user 를 함께 갱신해, 헤더/프로필 카드에 즉시 반영한다.
 */
export default function ProfileEditPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const [nickname, setNickname] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 서버의 최신 프로필로 폼을 채운다(닉네임/이미지가 다른 기기에서 바뀌었을 수 있으므로 store 대신 서버를 신뢰).
  const { data, isLoading, isError } = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyProfile,
  });

  useEffect(() => {
    if (data) {
      setNickname(data.nickname);
      setImageUrl(data.profileImageUrl ?? "");
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updateMyProfile({ nickname: nickname.trim(), profileImageUrl: imageUrl.trim() || null }),
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
              {imageUrl ? (
                <img src={imageUrl} alt="프로필 미리보기" className="w-full h-full object-cover" />
              ) : (
                (trimmed[0] ?? user.nickname[0] ?? "?").toUpperCase()
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              <div>{data?.email}</div>
              <div className="mt-0.5">{data?.provider} 계정 · 이메일은 변경할 수 없습니다.</div>
            </div>
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

          {/* 프로필 이미지 URL */}
          <div>
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              프로필 이미지 URL
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X size={11} /> 제거
                </button>
              )}
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/profile.png"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">비워 두면 이미지가 제거됩니다.</p>
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
