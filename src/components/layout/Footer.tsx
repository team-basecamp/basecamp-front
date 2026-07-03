/**
 * 하단 푸터 (모든 화면 공통, Layout.tsx에서 렌더링)
 * - 서비스 소개/링크/기술 스택 안내 등 정적인 정보만 표시하는 컴포넌트 (상태/로직 없음)
 */
function FooterLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
      <path d="M20 2C14 2 8 7.5 8 14.5C8 22 20 38 20 38C20 38 32 22 32 14.5C32 7.5 26 2 20 2Z" fill="#2D6A4F"/>
      <path d="M13 22L20 10L27 22H13Z" fill="white" fillOpacity="0.9"/>
      <path d="M20 10L23 15.5H17L20 10Z" fill="white"/>
      <path d="M15 22L18 18L21 22H15Z" fill="#C09A5B"/>
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FooterLogo />
              <span className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Basecamp</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              전국 캠핑장 검색 · 예약 · 커뮤니티 플랫폼
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Find your perfect campground.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">서비스</p>
            <ul className="space-y-2">
              {["캠핑장 찾기", "예약하기", "커뮤니티"].map((item) => (
                <li key={item} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">기술 스택</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              <li>Backend: Java 21 · Spring Boot</li>
              <li>Frontend: React · JavaScript</li>
              <li>Auth: JWT + 소셜 로그인</li>
              <li>API: 고캠핑 공공데이터</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© 2026 Basecamp. All rights reserved.</span>
          <span style={{ fontFamily: "'DM Mono', monospace" }}>v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
