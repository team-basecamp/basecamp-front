/**
 * 관리자 화면(pages/admin/*)에서 쓰이는 mock 데이터 및 타입 모음.
 * - ADMIN_MEMBERS: MemberManagePage.tsx의 회원 목록.
 * - BLACKLIST_ENTRIES: BlacklistPage.tsx의 블랙리스트 목록.
 * - ADMIN_REPORTS: ReportListPage.tsx의 게시글 신고 목록.
 */
export interface AdminMember {
  memberId: number;
  nickname: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
  createdAt: string;
}

export interface BlacklistEntry {
  memberId: number;
  nickname: string;
  reason: string;
  blacklistedAt: string;
  expiresAt: string;
}

export interface AdminReport {
  reportId: number;
  postId: number;
  postTitle: string;
  reporter: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}

export const ADMIN_MEMBERS: AdminMember[] = [
  { memberId: 1, nickname: "캠핑왕_철수", email: "chulsoo@email.com", status: "ACTIVE", createdAt: "2026-01-04T09:12:00" },
  { memberId: 2, nickname: "숲속요정", email: "forest@email.com", status: "ACTIVE", createdAt: "2026-01-18T14:02:00" },
  { memberId: 3, nickname: "등산매니아", email: "hiking@email.com", status: "ACTIVE", createdAt: "2026-02-02T11:30:00" },
  { memberId: 4, nickname: "글램퍼_지은", email: "jieun@email.com", status: "SUSPENDED", createdAt: "2026-02-20T18:44:00" },
  { memberId: 5, nickname: "바다사랑", email: "sea@email.com", status: "ACTIVE", createdAt: "2026-03-11T08:55:00" },
  { memberId: 6, nickname: "탈퇴한사용자", email: "left@email.com", status: "WITHDRAWN", createdAt: "2026-01-25T10:00:00" },
];

export const BLACKLIST_ENTRIES: BlacklistEntry[] = [
  { memberId: 4, nickname: "글램퍼_지은", reason: "커뮤니티 규정 위반 (도배성 게시글)", blacklistedAt: "2026-06-20T15:30:00", expiresAt: "2026-07-20T15:30:00" },
  { memberId: 7, nickname: "불량이용자22", reason: "결제 어뷰징 신고 다수 접수", blacklistedAt: "2026-06-25T09:10:00", expiresAt: "2026-08-25T09:10:00" },
];

export const ADMIN_REPORTS: AdminReport[] = [
  { reportId: 1, postId: 3, postTitle: "초특가 캠핑용품 판매합니다 (광고)", reporter: "등산매니아", reason: "SPAM", status: "PENDING", createdAt: "2026-06-27T15:30:00" },
  { reportId: 2, postId: 7, postTitle: "이 캠핑장 정말 별로였어요...", reporter: "글램퍼_지은", reason: "ABUSE", status: "PENDING", createdAt: "2026-06-28T10:15:00" },
  { reportId: 3, postId: 2, postTitle: "캠핑 동행 구합니다 (성별 무관)", reporter: "바다사랑", reason: "ETC", status: "RESOLVED", createdAt: "2026-06-15T09:00:00" },
];
