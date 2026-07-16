// ─── Camp (matches 고캠핑 API schema 및 ERD의 camps 테이블) ─────
export interface Camp {
  contentId: number;
  campId?: number;          // 실제 PK(camps.camp_id). 자체 등록 캠핑장은 contentId가 항상 null이라 식별에 이 값을 써야 함
  ownerId?: number;         // 캠핑업체 회원(users.user_id) - 이 캠핑장을 소유/관리하는 업체 계정
  facltNm: string;          // 시설명
  addr1: string;            // 주소
  addr2?: string;           // 상세주소
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
  lineIntro?: string;       // 한줄 소개 (고캠핑 API: lineIntro)
  intro?: string;           // 상세 소개 (고캠핑 API: intro)
  facilities?: string[];
  homepage?: string;        // 캠핑장 웹사이트 (고캠핑 API: homepage)
  operatingHours?: string;
  maxPeople?: number;
  reviewCount?: number;
}

// ─── Camp Registration (POST /v1/camps/register 요청 바디) ───────
// 백엔드 CampRegistrationRequest(domain/camp/dto/request)와 1:1 대응.
// tel은 "010-1234-5678" 또는 "033-123-4567" 형태의 정규식 검증을 백엔드에서 수행한다.
export interface CampRegistrationRequest {
  facltNm: string;          // 필수, 2~100자
  addr1: string;            // 필수, 최대 200자
  tel: string;              // 필수, 전화번호 형식
  induty: string;           // 필수, 최대 100자
  price: number;            // 필수, 0 이상
  addr2?: string;           // 최대 200자
  gnrlSiteCo?: number;      // 0~10000
  autoSiteCo?: number;      // 0~10000
  glampSiteCo?: number;     // 0~10000
  lineIntro?: string;       // 최대 500자
  firstImageUrl?: string;   // 최대 255자
  homepage?: string;        // 최대 255자
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
