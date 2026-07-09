/**
 * 상단 네비게이션 바 (모든 화면 공통, Layout.tsx에서 렌더링)
 * - 로그인 상태(authStore)에 따라 로그인 버튼 / 프로필 드롭다운을 다르게 보여줌
 * - 알림 뱃지 숫자는 notificationStore의 unreadCount를 그대로 구독해서 표시
 */
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, X, User, ChevronDown } from "lucide-react";
import useAuthStore, { type SocialProvider } from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import "./Header.css";

// Basecamp logo SVG — shield/pin shape with mountain+tent
function BasecampLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2C14 2 8 7.5 8 14.5C8 22 20 38 20 38C20 38 32 22 32 14.5C32 7.5 26 2 20 2Z" fill="#2D6A4F"/>
      <path d="M20 2C14 2 8 7.5 8 14.5C8 22 20 38 20 38C20 38 32 22 32 14.5C32 7.5 26 2 20 2Z" fill="url(#shield_grad)"/>
      {/* Mountain */}
      <path d="M13 22L20 10L27 22H13Z" fill="white" fillOpacity="0.9"/>
      {/* Snow cap */}
      <path d="M20 10L23 15.5H17L20 10Z" fill="white"/>
      {/* Tent */}
      <path d="M15 22L18 18L21 22H15Z" fill="#C09A5B"/>
      <defs>
        <linearGradient id="shield_grad" x1="8" y1="2" x2="32" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2D6A4F"/>
          <stop offset="1" stopColor="#1E4D3A"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * 프로필 아바타 — 소셜 로그인 provider 로고를 원형으로 보여준다.
 * provider 정보가 없으면(구버전 세션 등) 닉네임 첫 글자로 폴백한다.
 */
function ProfileAvatar({ nickname, provider }: { nickname: string; provider?: SocialProvider }) {
  if (provider === "KAKAO") {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#FEE500" }} aria-label="카카오 로그인">
        <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
          <path d="M9 0.5C4.306 0.5 0.5 3.46 0.5 7.1c0 2.353 1.56 4.42 3.92 5.59l-.997 3.71c-.088.33.28.6.57.41l4.33-2.88c.217.016.437.024.657.024 4.694 0 8.5-2.96 8.5-6.6S13.694.5 9 .5z" fill="#191919"/>
        </svg>
      </div>
    );
  }
  if (provider === "NAVER") {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#03C75A" }} aria-label="네이버 로그인">
        <span className="font-black text-xs leading-none">N</span>
      </div>
    );
  }
  if (provider === "GOOGLE") {
    return (
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-200" aria-label="구글 로그인">
        <svg width="13" height="13" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
      </div>
    );
  }
  return (
    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold">
      {nickname?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

const NAV_ITEMS: { label: string; to: string }[] = [
  { label: "찾아보기", to: "/campsites" },
  { label: "지도", to: "/map" },
  { label: "커뮤니티", to: "/posts" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const isActive = (to: string) => location.pathname.startsWith(to);

  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMenus();
    navigate("/");
  };

  return (
    <header className="navbar sticky top-0 z-50 border-b border-border bg-card/95">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" onClick={closeMenus} className="flex items-center gap-2.5 flex-shrink-0">
          <BasecampLogo size={34} />
          <span className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Basecamp
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV_ITEMS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              onClick={closeMenus}
              className={`nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(to)
                  ? "active text-primary bg-secondary"
                  : "text-foreground/60 hover:text-foreground hover:bg-muted"
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Auth actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <Link
                to="/notifications"
                onClick={closeMenus}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-muted transition-all"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-white text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-all text-sm"
                >
                  <ProfileAvatar nickname={user.nickname} provider={user.provider} />
                  <span className="hidden sm:block font-medium max-w-[100px] truncate">{user.nickname}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <Link to="/mypage" onClick={closeMenus} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted transition-colors">
                      <User size={14} /> 마이페이지
                    </Link>
                    <Link to="/business/campsites" onClick={closeMenus} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted transition-colors">
                      <BasecampLogo size={14} /> 캠핑업체 대시보드
                    </Link>
                    <Link to="/admin/members" onClick={closeMenus} className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted transition-colors">
                      <BasecampLogo size={14} /> 관리자 페이지
                    </Link>
                    <div className="border-t border-border" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors">
                      <LogOut size={14} /> 로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              로그인
            </Link>
          )}

          {/* Mobile hamburger */}
          <button className="md:hidden p-1" onClick={() => setMobileOpen((v) => !v)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          <Link to="/" onClick={closeMenus} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm text-foreground/60 hover:text-foreground hover:bg-muted transition-all">홈</Link>
          {NAV_ITEMS.map(({ label, to }) => (
            <Link key={to} to={to} onClick={closeMenus} className={`w-full text-left block px-3 py-2.5 rounded-lg text-sm transition-all ${isActive(to) ? "bg-secondary text-primary font-medium" : "text-foreground/60 hover:text-foreground hover:bg-muted"}`}>
              {label}
            </Link>
          ))}
          {user && (
            <>
              <Link to="/mypage" onClick={closeMenus} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm text-foreground/60 hover:text-foreground hover:bg-muted transition-all">마이페이지</Link>
              <Link to="/business/campsites" onClick={closeMenus} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm text-foreground/60 hover:text-foreground hover:bg-muted transition-all">캠핑업체 대시보드</Link>
              <Link to="/admin/members" onClick={closeMenus} className="w-full text-left block px-3 py-2.5 rounded-lg text-sm text-foreground/60 hover:text-foreground hover:bg-muted transition-all">관리자 페이지</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
