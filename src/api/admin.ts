import instance from "./instance";

/**
 * 관리자(admin) 전용 API 함수 모음 - 회원/블랙리스트/신고 관리, 게시글 블라인드 처리.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/admin/* (MemberManagePage, BlacklistPage, ReportListPage 등)는
 *   이 함수들을 호출하지 않고 data/admin.ts의 mock 데이터를 그대로 사용 중.
 *   실제 백엔드 연동 시 여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const blacklistMember = (memberId: number, reason: string) =>
  instance.post(`/v1/admin/tokens/blacklist`, { memberId, reason });

export const getBlacklist = (pageNo = 1, numOfRows = 10) =>
  instance.get<{
    blacklist: { memberId: number; nickname: string; reason: string; blacklistedAt: string; expiresAt: string }[];
  }>("/v1/admin/tokens/blacklist", { params: { pageNo, numOfRows } });

// 실제로는 블랙리스트 해제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const removeFromBlacklist = (memberId: number) =>
  instance.post(`/v1/admin/tokens/blacklist/${memberId}/remove`, { memberId });

export const getMembers = (pageNo = 1, numOfRows = 10, keyword = "") =>
  instance.get<{
    members: { memberId: number; nickname: string; email: string; status: string; createdAt: string }[];
  }>("/v1/admin/members", { params: { pageNo, numOfRows, keyword } });

export const getReports = (status: "PENDING" | "RESOLVED" | "ALL" = "PENDING", pageNo = 1, numOfRows = 10) =>
  instance.get<{
    reports: {
      reportId: number;
      postId: number;
      postTitle: string;
      reporter: string;
      reason: string;
      status: string;
      createdAt: string;
    }[];
  }>("/v1/admin/reports", { params: { status, pageNo, numOfRows } });

// 게시글을 블라인드(비공개) 처리
export const blindPost = (postId: number, reason: string) =>
  instance.post(`/v1/admin/posts/${postId}/blind`, { postId, reason });
