import ReservationList from "../../components/common/ReservationList";
import RequireLogin from "../../components/common/RequireLogin";
import useAuthStore from "../../store/authStore";
import MyPageHeader from "./MyPageHeader";

/**
 * 마이페이지 홈 (/mypage)
 * - 프로필 카드 + 탭 네비게이션(MyPageHeader)을 렌더링하고, 기본 탭인 예약 내역 목록(ReservationList)을 보여줌
 * - 예약 데이터는 store/reservationStore(zustand)에서 가져와 예약내역/결제 화면과 상태가 동기화됨
 * - 비로그인 상태면 RequireLogin으로 대체 렌더링
 */
export default function MyPage() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <RequireLogin />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <MyPageHeader active="reservations" />
      <ReservationList />
    </div>
  );
}
