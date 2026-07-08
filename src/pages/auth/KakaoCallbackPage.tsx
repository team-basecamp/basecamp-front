import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithKakao } from "../../api/auth";
import useAuthStore from "../../store/authStore";

/**
 * 카카오 로그인 콜백 페이지 (/oauth/kakao/callback)
 * - 카카오 authorize 후 redirect_uri 로 돌아오는 지점. 주소의 인가 코드(?code=)를 백엔드로 넘겨
 *   자체 JWT(accessToken)를 받고, authStore 에 사용자/토큰을 저장한 뒤 홈으로 이동한다.
 * - refreshToken 은 백엔드가 HttpOnly 쿠키로 내려주므로 여기서 다루지 않는다.
 */
export default function KakaoCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  // 인가 코드는 일회용이라, StrictMode 의 이펙트 이중 실행으로 두 번 호출되지 않도록 가드한다.
  const requested = useRef(false);

  useEffect(() => {
    const errorParam = params.get("error");
    if (errorParam) {
      setError("카카오 로그인이 취소되었거나 거부되었습니다.");
      return;
    }

    const code = params.get("code");
    if (!code) {
      setError("인가 코드가 전달되지 않았습니다.");
      return;
    }

    if (requested.current) return;
    requested.current = true;

    loginWithKakao(code)
      .then((res) => {
        // 백엔드 계약(userId/profileImageUrl)을 authStore 형태(memberId/profileImage)로 매핑한다.
        setUser(
          {
            memberId: res.userId,
            nickname: res.nickname,
            email: res.email,
            profileImage: res.profileImageUrl ?? undefined,
            role: res.role,
          },
          res.accessToken
        );
        navigate("/", { replace: true });
      })
      .catch(() => {
        setError("로그인 처리에 실패했습니다. 다시 시도해 주세요.");
      });
  }, [params, setUser, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background p-6 text-center">
      {error ? (
        <>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200"
          >
            로그인 화면으로
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">카카오 로그인 처리 중…</p>
      )}
    </div>
  );
}
