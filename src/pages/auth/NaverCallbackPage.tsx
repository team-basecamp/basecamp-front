import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loginWithNaver } from "../../api/auth";
import { getApiErrorMessage } from "../../lib/apiError";
import useAuthStore from "../../store/authStore";

/**
 * 네이버 로그인 콜백 페이지 (/oauth/naver/callback)
 * - 네이버 authorize 후 redirect_uri 로 돌아오는 지점. 주소의 code/state 를 그대로 백엔드로 넘긴다.
 * - CSRF 방지(state 서명·만료 검증)는 서버가 담당하므로 프론트는 별도 대조를 하지 않는다.
 * - 이후 흐름(백엔드 code+state 교환 → JWT/유저 저장 → 홈)은 카카오와 동일.
 */
export default function NaverCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);
  // 인가 코드는 일회용이라, StrictMode 이펙트 이중 실행으로 두 번 처리되지 않도록 가드한다.
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    const errorParam = params.get("error");
    if (errorParam) {
      setError("네이버 로그인이 취소되었거나 거부되었습니다.");
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setError("인가 코드 또는 state 가 전달되지 않았습니다.");
      return;
    }

    // state 검증(서명·만료)은 백엔드가 수행한다. 여기서는 받은 값을 그대로 넘기기만 한다.
    loginWithNaver(code, state)
      .then((res) => {
        // 백엔드 계약(userId/profileImageUrl)을 authStore 형태(memberId/profileImage)로 매핑한다.
        setUser(
          {
            memberId: res.userId,
            nickname: res.nickname,
            email: res.email,
            profileImage: res.profileImageUrl ?? undefined,
            role: res.role,
            provider: "NAVER",
          },
          res.accessToken
        );
        navigate("/", { replace: true });
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "로그인 처리에 실패했습니다. 다시 시도해 주세요."));
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
        <p className="text-sm text-muted-foreground">네이버 로그인 처리 중…</p>
      )}
    </div>
  );
}
