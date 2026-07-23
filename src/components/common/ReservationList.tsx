/**
 * 예약 목록 (마이페이지, 예약내역 페이지 등에서 재사용)
 * - GET /v1/reservations/me 로 서버에서 직접 조회한다 (서버가 원본).
 *   기존에 reservationStore(zustand)를 쓴 이유는 화면 간 상태 동기화였는데,
 *   서버 연동 후에는 "취소 시 응답으로 갱신 + 화면 진입 시 재조회"로 해결된다.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";
import {
  getMyReservations,
  cancelReservation as cancelReservationApi,
  type ReservationListResponse,
} from "../../api/reservation";
import { getCampsiteDetail } from "../../api/campsite";
import ReservationCard from "./ReservationCard";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";

export default function ReservationList() {
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<ReservationListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [cancelTargetId, setCancelTargetId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getMyReservations({ page: 0, size: 50 })
      .then((page) => { if (!cancelled) setReservations(page.content); })
      .catch((e: any) => {
        if (!cancelled) setError(e?.response?.data?.message ?? "예약 내역을 불러오지 못했습니다");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const onCampClick = (campId: number) => navigate(`/campsites/${campId}`);

  const onCancel = (reservationId: number) => setCancelTargetId(reservationId);

  const confirmCancel = async () => {
    if (cancelTargetId === null) return;
    const reservationId = cancelTargetId;
    setCancelTargetId(null);

    setProcessingId(reservationId);
    setError(null);
    try {
      // const updated = await cancelReservationApi(reservationId);
      // setReservations((prev) => prev.map((r) => (r.id === reservationId ? updated : r)));
      await cancelReservationApi(reservationId);

      const page = await getMyReservations({ page: 0, size: 50 });
      setReservations(page.content);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "예약 취소에 실패했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  // PENDING_PAYMENT 예약을 이어서 결제한다. 결제 페이지가 camp 를 요구하므로 여기서 조회해 넘긴다.
  const onPay = async (reservationId: number) => {
    const reservation = reservations.find((r) => r.id === reservationId);
    if (!reservation) return;

    setProcessingId(reservationId);
    setError(null);
    try {
      const res = await getCampsiteDetail(reservation.campId);
      navigate("/payment", {
        state: { camp: res, reservationId, totalPrice: reservation.totalPrice },
      });
    } catch {
      setError("캠핑장 정보를 불러오지 못했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  const onReview = (campId: number, reservationId: number) =>
    navigate(`/campsites/${campId}`, {
      state: { openReviewForm: true, reservationId },
    });

  if (loading) {
    return <p className="py-16 text-center text-muted-foreground text-sm">불러오는 중...</p>;
  }

  if (reservations.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Calendar size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">예약 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {reservations.map((r) => (
        <ReservationCard
          key={r.id}
          reservation={r}
          processing={processingId === r.id}
          onCampClick={onCampClick}
          onCancel={onCancel}
          onPay={onPay}
          onReview={onReview}
        />
      ))}

      <AlertDialog open={cancelTargetId !== null} onOpenChange={(o) => !o && setCancelTargetId(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>예약 취소</AlertDialogTitle>
            <AlertDialogDescription>예약을 취소하시겠습니까?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>아니오</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>예</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}