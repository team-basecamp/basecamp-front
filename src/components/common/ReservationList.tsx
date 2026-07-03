/**
 * 예약 목록을 보여주는 컴포넌트 (마이페이지, 예약내역 페이지 등 여러 화면에서 재사용)
 * - reservationStore를 사용하는 이유: 예약 목록을 각 페이지의 로컬 useState로 들고 있으면
 *   다른 화면(결제 페이지 등)에서 취소/결제완료 처리를 해도 이 목록에는 반영되지 않는 문제가 있어서,
 *   전역 스토어로 옮겨 어디서 상태를 바꾸든 모든 화면에서 동일하게 보이도록 함
 */
import { useNavigate } from "react-router-dom";
import { CAMPS } from "../../data/camps";
import useReservationStore from "../../store/reservationStore";
import ReservationCard from "./ReservationCard";

export default function ReservationList() {
  const navigate = useNavigate();
  const reservations = useReservationStore((s) => s.reservations);
  const cancelReservation = useReservationStore((s) => s.cancelReservation);

  const onCampClick = (campId: number) => navigate(`/campsites/${campId}`);

  const onPay = (reservationId: number) => {
    const reservation = reservations.find((r) => r.reservationId === reservationId);
    const camp = reservation ? CAMPS.find((c) => c.contentId === reservation.campId) : undefined;
    if (!camp) return;
    navigate("/payment", { state: { camp, reservationId } });
  };

  const onReview = (campId: number) => {
    navigate(`/campsites/${campId}`, { state: { openReviewForm: true } });
  };

  return (
    <div className="space-y-4">
      {reservations.map((r) => (
        <ReservationCard
          key={r.reservationId}
          reservation={r}
          onCampClick={onCampClick}
          onCancel={cancelReservation}
          onPay={onPay}
          onReview={onReview}
        />
      ))}
    </div>
  );
}
