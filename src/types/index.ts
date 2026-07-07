// ─── Camp (matches 고캠핑 API schema 및 ERD의 camps 테이블) ─────
export interface Camp {
  contentId: number;
  ownerId?: number;         // 캠핑업체 회원(users.user_id) - 이 캠핑장을 소유/관리하는 업체 계정
  facltNm: string;          // 시설명
  addr1: string;            // 주소
  mapX: number;
  mapY: number;
  firstImageUrl: string;
  induty: string;           // 야영장 유형 (일반야영장, 글램핑, 오토캠핑장...)
  gnrlSiteCo: number;       // 일반사이트 수
  autoSiteCo: number;       // 자동차야영장 수
  glampSiteCo: number;      // 글램핑 수
  tel: string;
  rating: number;
  averageRating?: number;   // 백엔드 응답 필드명 (mock 데이터의 rating과 다름)
  manageSttus?: string;     // 운영 상태 (ERD의 manage_sttus, 예: 운영/휴업)
  reservationCount?: number;
  createdAt?: string;       // 캠핑장 등록 일시 (최근 등록 캠핑장 정렬용)
  // legacy compat for existing CampCard usage
  region?: string;
  price?: number;
  tags?: string[];
  image?: string;
  description?: string;
  facilities?: string[];
  website?: string;
  operatingHours?: string;
  maxPeople?: number;
  reviewCount?: number;
}

// ─── Review ─────────────────────────────────────────────────────
export interface Review {
  id: number;
  campId: number;
  author: string;
  rating: number;
  content: string;
  date: string;
  avatar?: string;
  images: string[];
  likes: number;
  comments: Comment[];
}

// ─── Comment ────────────────────────────────────────────────────
export interface Comment {
  id: number;
  reviewId: number;
  author: string;
  avatar?: string;
  content: string;
  date: string;
  likes: number;
}

// ─── Community Post ─────────────────────────────────────────────
export type PostCategory = "GENERAL" | "CREW" | "TRANSFER";

export interface Post {
  postId: number;
  category: PostCategory;
  title: string;
  content: string;
  writer: string;
  avatar?: string;
  createdAt: string;
  viewCount: number;
  commentCount: number;
  isBlinded?: boolean;
}

export interface PostComment {
  commentId: number;
  postId: number;
  writer: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

// ─── Reservation ────────────────────────────────────────────────
export type ReservationStatus = "PENDING" | "RESERVED" | "CANCELLED" | "REJECTED" | "COMPLETED";

export interface Reservation {
  reservationId: number;
  campId: number;
  campName: string;
  campImage: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  guestCount: number;
  amount?: number;
  paymentStatus?: "PAID" | "UNPAID";
  rejectReason?: string;    // 업체가 예약을 거절할 때 입력하는 사유 (ERD의 reservations.reject_reason)
}

// ─── Notification ────────────────────────────────────────────────
export type NotificationType =
  | "RESERVATION_CONFIRMED"
  | "RESERVATION_REJECTED"
  | "RESERVATION_CANCELLED"
  | "REVIEW_COMMENT"
  | "POST_COMMENT";

export interface Notification {
  notificationId: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
  refId?: number;           // 알림이 가리키는 대상의 id (ERD의 notifications.ref_id) - 예약/게시글/리뷰 id 등, type에 따라 의미가 다름
}

// ─── Wishlist ────────────────────────────────────────────────────
export interface WishCamp {
  contentId: number;
  facltNm: string;
  addr1: string;
  firstImageUrl: string;
  rating: number;
}

// ─── Chat ────────────────────────────────────────────────────────
export interface ChatRoom {
  id: number;
  campId: number;
  campName: string;
  campImage: string;
  ownerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

export interface ChatMessage {
  id: number;
  roomId: number;
  sender: "user" | "owner";
  text: string;
  time: string;
}

// ─── Weather ─────────────────────────────────────────────────────
export interface WeatherDay {
  date: string;
  temp: number;
  condition: string;
  humidity: number;
  icon: string;
}
