import type { Reservation, ChatRoom, ChatMessage } from "../types";

/**
 * 로그인한 사용자(회원) 및 캠핑업체 사장님 관점의 mock 데이터 모음.
 * - MY_RESERVATIONS: 내 예약 내역. store/reservationStore.ts의 초기 상태(reservations)로 사용됨
 *   (pages/reservation/ReservationPage.tsx, components/common/ReservationList.tsx 등에서 스토어 경유로 조회).
 * - CHAT_ROOMS / CHAT_MESSAGES: 캠핑장 사장님과의 채팅 목데이터(채팅 관련 화면에서 사용).
 * - OWNER_RESERVATIONS: 캠핑업체 사장님이 보는 예약 관리 화면(pages/business/ReservationManagePage.tsx)에서 사용.
 */
export const MY_RESERVATIONS: Reservation[] = [
  {
    reservationId: 1,
    campId: 1,
    campName: "별빛 숲속 캠핑장",
    campImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=150&fit=crop&auto=format",
    checkInDate: "2026-07-15",
    checkOutDate: "2026-07-17",
    status: "RESERVED",
    guestCount: 4,
    amount: 90000,
    paymentStatus: "PAID",
  },
  {
    reservationId: 2,
    campId: 3,
    campName: "계곡 힐링 캠핑파크",
    campImage: "https://images.unsplash.com/photo-1487730116645-74489c95b41b?w=200&h=150&fit=crop&auto=format",
    checkInDate: "2026-08-02",
    checkOutDate: "2026-08-04",
    status: "PENDING",
    guestCount: 2,
    amount: 70000,
    paymentStatus: "UNPAID",
  },
  {
    reservationId: 3,
    campId: 2,
    campName: "바다솔 오션캠프",
    campImage: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=200&h=150&fit=crop&auto=format",
    checkInDate: "2026-06-01",
    checkOutDate: "2026-06-03",
    status: "COMPLETED",
    guestCount: 2,
    amount: 110000,
    paymentStatus: "PAID",
  },
  {
    reservationId: 4,
    campId: 5,
    campName: "설악산 베이스캠프",
    campImage: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=200&h=150&fit=crop&auto=format",
    checkInDate: "2026-05-20",
    checkOutDate: "2026-05-21",
    status: "CANCELLED",
    guestCount: 3,
    amount: 40000,
    paymentStatus: "UNPAID",
  },
];

export const CHAT_ROOMS: ChatRoom[] = [
  {
    id: 1,
    campId: 1,
    campName: "별빛 숲속 캠핑장",
    campImage: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=100&h=100&fit=crop&auto=format",
    ownerName: "김사장님",
    lastMessage: "네, 반려동물 동반 가능합니다! 리드줄 착용 필수예요 😊",
    lastTime: "10분 전",
    unread: 1,
  },
  {
    id: 2,
    campId: 2,
    campName: "바다솔 오션캠프",
    campImage: "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=100&h=100&fit=crop&auto=format",
    ownerName: "이사장님",
    lastMessage: "글램핑 예약 가능한 날짜 확인해드릴게요!",
    lastTime: "어제",
    unread: 0,
  },
];

export const CHAT_MESSAGES: ChatMessage[] = [
  { id: 1, roomId: 1, sender: "user", text: "안녕하세요! 반려동물 동반 캠핑 가능한가요?", time: "오후 2:10" },
  { id: 2, roomId: 1, sender: "owner", text: "안녕하세요! 네, 반려동물 동반 가능합니다 🐾\n리드줄 착용 필수이고, 소형견은 전용 사이트 이용 가능해요!", time: "오후 2:15" },
  { id: 3, roomId: 1, sender: "user", text: "감사합니다! 다음 주 금요일 자리 있나요?", time: "오후 2:16" },
  { id: 4, roomId: 1, sender: "owner", text: "잠시만요, 확인해볼게요 📋", time: "오후 2:17" },
  { id: 5, roomId: 1, sender: "owner", text: "반려동물 전용 사이트 2자리 남아있어요!\n앱에서 예약하시거나 전화 주셔도 됩니다 😊", time: "오후 2:20" },
];

export const OWNER_RESERVATIONS: Reservation[] = [
  {
    reservationId: 10,
    campId: 1,
    campName: "별빛 숲속 캠핑장",
    campImage: "",
    checkInDate: "2026-07-15",
    checkOutDate: "2026-07-17",
    status: "PENDING",
    guestCount: 4,
    amount: 90000,
  },
  {
    reservationId: 11,
    campId: 1,
    campName: "별빛 숲속 캠핑장",
    campImage: "",
    checkInDate: "2026-07-18",
    checkOutDate: "2026-07-19",
    status: "RESERVED",
    guestCount: 2,
    amount: 45000,
  },
  {
    reservationId: 12,
    campId: 1,
    campName: "별빛 숲속 캠핑장",
    campImage: "",
    checkInDate: "2026-07-20",
    checkOutDate: "2026-07-22",
    status: "RESERVED",
    guestCount: 6,
    amount: 90000,
  },
];
