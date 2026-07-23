/**
 * 역할(Role) 기반 라우트 가드.
 * - 라우트 그룹의 element 로 올려두고 하위 페이지를 <Outlet /> 자리에 렌더한다.
 *   허용된 역할이 아니면 하위 페이지를 아예 마운트하지 않으므로, URL 직접 접근을 막는다.
 * - 이 가드는 UX 용이다. 실제 인가는 서버(SecurityConfig 의 ROLE_* 검사)가 하고,
 *   토큰을 위조해 화면을 열더라도 API 는 401/403 을 돌려준다.
 *
 * 권한 판정은 authStore.user.role 이 아니라 access 토큰에서 꺼낸다(useRole).
 * 재발급 시 토큰만 교체되므로 토큰 쪽이 항상 서버가 인정하는 최신 권한이다.
 */
import { Outlet } from "react-router-dom";
import useRole from "../../hooks/useRole";
import useAuthStore, { type MemberRole } from "../../store/authStore";
import RequireLogin from "./RequireLogin";

export default function RequireRole({ allow }: { allow: MemberRole[] }) {
  const user = useAuthStore((s) => s.user);
  const role = useRole();

  // 비로그인: 로그인 유도 화면(마이페이지 등과 동일한 안내)을 보여준다.
  if (!user) return <RequireLogin />;

  // 로그인했지만 권한 불일치(토큰 이상으로 role=null 인 경우 포함): 접근 차단 안내.
  if (!role || !allow.includes(role)) return <Forbidden />;

  return <Outlet />;
}

function Forbidden() {
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-lg font-semibold mb-2">접근 권한이 없습니다</p>
      <p className="text-muted-foreground mb-6">이 페이지는 해당 권한을 가진 사용자만 이용할 수 있습니다.</p>
      <a href="/" className="inline-block px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
        홈으로 가기
      </a>
    </div>
  );
}
