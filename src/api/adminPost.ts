import instance from "./instance";
import type { Page } from "./page";

/**
 * 관리자(admin) 게시글/신고 API. 백엔드 AdminPostController 계약을 그대로 따른다.
 * - 신고 목록 조회: GET  /v1/admin/posts/reports      (status·page·size 선택)
 * - 게시글 상세:    GET  /v1/admin/posts/{postId}     (상태 무관, 블라인드/삭제 글도 열람)
 * - 블라인드 처리:  POST /v1/admin/posts/{postId}/blind  (사유 필수, 204)
 *
 * instance 의 응답 인터셉터가 res.data 로 언래핑하므로, 각 함수의 실제 resolve 값은
 * 제네릭 타입 그대로다(axios 타입과 런타임을 일치시키는 캐스팅).
 *
 * ⚠️ 신고 "반려" 엔드포인트는 아직 백엔드에 없다. 블라인드 처리 시 해당 글의 PENDING 신고가
 *    자동으로 ACCEPTED 로 정리된다(AdminPostService.blindPost 참고).
 */

/** 게시글 상태. posts.status 와 매핑된다. */
export type PostStatus = "ACTIVE" | "BLINDED" | "DELETED";
/** 신고 처리 상태. post_reports.status 와 매핑된다. */
export type ReportStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** 관리자 신고 목록 항목(ReportedPostResponse). 신고 1건 + 대상 게시글·신고자 정보. */
export interface ReportedPost {
  reportId: number;
  postId: number;
  postTitle: string;
  /** 대상 게시글의 현재 상태. BLINDED 면 이미 블라인드된 글이다. */
  postStatus: PostStatus;
  category: string;
  /** 신고 사유 코드 (SPAM / INAPPROPRIATE / ILLEGAL / ETC). */
  reason: string;
  description: string | null;
  reportStatus: ReportStatus;
  reporterId: number;
  reporterNickname: string;
  createdAt: string;
}

/** 관리자용 게시글 상세(AdminPostDetailResponse). 상태와 무관하게 원문을 담는다. */
export interface AdminPostDetail {
  postId: number;
  userId: number;
  nickname: string;
  category: string;
  title: string;
  content: string;
  viewCount: number;
  status: PostStatus;
  /** 블라인드 상태가 아니면 null. */
  blindReason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

/**
 * 신고 목록. status 를 생략하면 백엔드가 PENDING 만 반환한다.
 * 접수 최신순(createdAt DESC)으로 정렬되며 page 는 0-base.
 */
export const getAdminReports = (params: {
  status?: ReportStatus;
  page?: number;
  size?: number;
}) =>
  instance.get<Page<ReportedPost>>("/v1/admin/posts/reports", {
    params,
  }) as unknown as Promise<Page<ReportedPost>>;

/** 게시글 상세. 블라인드·삭제된 글도 조회되며, 없는 글이면 404. */
export const getAdminPostDetail = (postId: number) =>
  instance.get<AdminPostDetail>(`/v1/admin/posts/${postId}`) as unknown as Promise<AdminPostDetail>;

/** 게시글 블라인드 처리. 이미 블라인드면 409, 없거나 삭제된 글이면 404. 사유는 필수(최대 200자). */
export const blindPost = (postId: number, reason: string) =>
  instance.post<void>(`/v1/admin/posts/${postId}/blind`, { reason }) as unknown as Promise<void>;
