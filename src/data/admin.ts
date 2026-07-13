/**
 * 관리자 화면(pages/admin/*)에서 쓰이는 mock 데이터 및 타입 모음.
 * - ADMIN_REPORTS: ReportListPage.tsx의 게시글 신고 목록.
 *
 * 회원 관리·블랙리스트는 실제 API(src/api/admin.ts)로 연동되어 여기 mock 을 더 이상 쓰지 않는다.
 * 신고(report)는 아직 백엔드 엔드포인트가 없어 mock 을 유지한다. API 가 생기면 함께 교체한다.
 */
export interface AdminReport {
  reportId: number;
  postId: number;
  postTitle: string;
  reporter: string;
  reason: string;
  status: "PENDING" | "RESOLVED" | "REJECTED";
  createdAt: string;
}

export const ADMIN_REPORTS: AdminReport[] = [
  { reportId: 1, postId: 3, postTitle: "초특가 캠핑용품 판매합니다 (광고)", reporter: "등산매니아", reason: "SPAM", status: "PENDING", createdAt: "2026-06-27T15:30:00" },
  { reportId: 2, postId: 7, postTitle: "이 캠핑장 정말 별로였어요...", reporter: "글램퍼_지은", reason: "ABUSE", status: "PENDING", createdAt: "2026-06-28T10:15:00" },
  { reportId: 3, postId: 2, postTitle: "캠핑 동행 구합니다 (성별 무관)", reporter: "바다사랑", reason: "ETC", status: "RESOLVED", createdAt: "2026-06-15T09:00:00" },
];
