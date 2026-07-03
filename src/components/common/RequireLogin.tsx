/**
 * 로그인이 필요한 화면에서 공통으로 보여주는 안내 컴포넌트
 * - 로그인이 안 된 사용자가 마이페이지 등 접근 시, 각 페이지가 이 컴포넌트를 렌더링해서
 *   "로그인 후 이용 가능" 안내와 로그인 페이지 이동 버튼을 동일한 형태로 보여줌
 */
import { useNavigate } from "react-router-dom";

export default function RequireLogin() {
  const navigate = useNavigate();
  return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground mb-6">로그인 후 이용할 수 있습니다</p>
      <button onClick={() => navigate("/login")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
        로그인하기
      </button>
    </div>
  );
}
