import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { getKakaoAuthorizeUrl } from "../../api/auth";
import "./LoginPage.css";

function BasecampLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 2C14 2 8 7.5 8 14.5C8 22 20 38 20 38C20 38 32 22 32 14.5C32 7.5 26 2 20 2Z" fill="#2D6A4F"/>
      <path d="M13 22L20 10L27 22H13Z" fill="white" fillOpacity="0.9"/>
      <path d="M20 10L23 15.5H17L20 10Z" fill="white"/>
      <path d="M15 22L18 18L21 22H15Z" fill="#C09A5B"/>
    </svg>
  );
}

/**
 * 로그인 페이지 (/login)
 * - 카카오/네이버/Google 소셜 로그인 버튼 UI만 제공 (레이아웃 없이 단독 렌더링)
 * - 실제 OAuth 연동 전이라 버튼 클릭 시 mock 사용자 정보로 즉시 로그인 처리 후 홈으로 이동
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  // 카카오는 실제 OAuth 연동: 카카오 authorize 페이지로 이동 → 콜백(/oauth/kakao/callback)에서 백엔드 로그인 처리.
  const onKakaoLogin = () => {
    window.location.href = getKakaoAuthorizeUrl();
  };

  // 네이버/Google 은 아직 연동 전이라, 클릭한 provider의 닉네임으로 mock 로그인 처리(추후 카카오와 동일 방식으로 교체).
  const onLogin = (nickname: string) => {
    setUser({ memberId: Date.now(), nickname, role: "CUSTOMER" }, "mock-access-token");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — hero image panel */}
      <div
        className="login-left-panel hidden lg:flex flex-col justify-between w-1/2 relative p-12"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=900&h=1200&fit=crop&auto=format')" }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(20,40,25,0.7) 0%, rgba(20,40,25,0.45) 60%, rgba(20,40,25,0.8) 100%)" }} />

        <div className="relative flex items-center gap-3">
          <BasecampLogo size={36} />
          <span className="text-2xl font-bold text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Basecamp</span>
        </div>

        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Find your perfect<br />campground.
          </h2>
          <p className="text-white/70 leading-relaxed text-sm">
            전국 1,200개 이상의 캠핑장 정보와<br />
            실제 이용자 후기를 한곳에서.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="login-form-container w-full max-w-md">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={16} /> 홈으로
          </button>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <BasecampLogo size={32} />
            <span className="text-xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Basecamp</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            로그인
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            소셜 계정으로 간편하게 시작하세요
          </p>

          {/* Social login */}
          <div className="space-y-3">
            <button
              onClick={onKakaoLogin}
              className="social-btn w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 0.5C4.306 0.5 0.5 3.46 0.5 7.1c0 2.353 1.56 4.42 3.92 5.59l-.997 3.71c-.088.33.28.6.57.41l4.33-2.88c.217.016.437.024.657.024 4.694 0 8.5-2.96 8.5-6.6S13.694.5 9 .5z" fill="#191919"/>
              </svg>
              카카오로 계속하기
            </button>

            <button
              onClick={() => onLogin("네이버 사용자")}
              className="social-btn w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm text-white"
              style={{ backgroundColor: "#03C75A" }}
            >
              <span className="font-black text-lg leading-none">N</span>
              네이버로 계속하기
            </button>

            <button
              onClick={() => onLogin("Google 사용자")}
              className="social-btn w-full flex items-center justify-center gap-3 py-3 rounded-xl font-semibold text-sm bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Google로 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
