/**
 * 고객/업체/관리자 화면이 공통으로 사용하는 뼈대(Header + 본문 + Footer)
 * - router/index.tsx에서 각 그룹(/, /business, /admin)의 상위 element로 이 컴포넌트를 지정
 * - <Outlet />이 있는 자리에 현재 라우트에 매칭된 하위 페이지 컴포넌트가 렌더링됨
 */
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div
      className="min-h-screen bg-background text-foreground flex flex-col"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
