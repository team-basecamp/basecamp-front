import ReservationList from "../../components/common/ReservationList";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import MyPageHeader from "../mypage/MyPageHeader";

/**
 * 예약 내역 페이지 (/reservations)
 * - 로그인한 사용자의 예약 목록을 마이페이지 레이아웃(MyPageHeader) 안에서 보여줌
 * - 실제 목록 렌더링/데이터는 공통 컴포넌트 ReservationList에 위임
 * - 비로그인 상태면 RequireLogin으로 대체 화면을 보여줌
 */
export default function ReservationHistoryPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <RequireLogin />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="reservations" />
      <ReservationList />
    </div>
  );
}
