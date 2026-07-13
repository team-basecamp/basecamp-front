import instance from "./instance";

/**
 * 캠핑업체(CAMP_OWNER) 권한 승격 관련 API.
 * - 회원(신청/내 신청 조회): /v1/camp-owner/applications
 * - 관리자(심사): /v1/admin/camp-owner/applications
 *
 * 백엔드 계약은 basecamp-back/docs/camp-owner-promotion.md 를 따른다.
 * instance 의 응답 인터셉터가 res.data 로 언래핑하므로, 각 함수의 실제 resolve 값은
 * 제네릭 타입 그대로다(axios 타입과 런타임을 일치시키는 캐스팅).
 */

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

/** 승격 신청 상세. 본인 조회와 관리자 목록이 같은 형태를 쓴다(CampOwnerApplicationResponse). */
export interface CampOwnerApplication {
  applicationId: number;
  userId: number;
  businessNumber: string;
  businessName: string;
  representativeName: string;
  status: ApplicationStatus;
  /** 반려된 신청에만 값이 있다. */
  rejectReason: string | null;
  createdAt: string;
  /** 승인·반려된 신청에만 값이 있다. */
  processedAt: string | null;
}

export interface CampOwnerApplyRequest {
  /** 하이픈 제외 숫자 10자리. 백엔드가 \d{10} 로만 검증한다(실체 확인은 관리자 심사). */
  businessNumber: string;
  businessName: string;
  representativeName: string;
}

/** Spring Data Page 응답 중 화면에서 쓰는 필드만 추린다. */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  /** 현재 페이지 번호(0-base). */
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ── 회원 ──────────────────────────────────────────────

/** 캠핑업체 전환 신청. 이미 심사 중이면 409(CO002), 이미 CAMP_OWNER 면 409(CO003). */
export const applyCampOwner = (body: CampOwnerApplyRequest) =>
  instance.post<CampOwnerApplication>("/v1/camp-owner/applications", body) as unknown as Promise<CampOwnerApplication>;

/** 본인의 가장 최근 신청 1건. 이력이 없으면 404(CO001). */
export const getMyCampOwnerApplication = () =>
  instance.get<CampOwnerApplication>("/v1/camp-owner/applications/me") as unknown as Promise<CampOwnerApplication>;

// ── 관리자 ────────────────────────────────────────────

/** 상태별 신청 목록(신청 일시 최신순). page 는 0-base. */
export const getCampOwnerApplications = (status: ApplicationStatus = "PENDING", page = 0, size = 20) =>
  instance.get<Page<CampOwnerApplication>>("/v1/admin/camp-owner/applications", {
    params: { status, page, size },
  }) as unknown as Promise<Page<CampOwnerApplication>>;

/** 승인 → 회원을 CAMP_OWNER 로 승격. 204. 이미 처리된 신청이면 409(CO004). */
export const approveCampOwnerApplication = (applicationId: number) =>
  instance.post<void>(`/v1/admin/camp-owner/applications/${applicationId}/approve`) as unknown as Promise<void>;

/** 반려. 204. 사유는 필수(최대 200자). 이미 처리된 신청이면 409(CO004). */
export const rejectCampOwnerApplication = (applicationId: number, reason: string) =>
  instance.post<void>(`/v1/admin/camp-owner/applications/${applicationId}/reject`, { reason }) as unknown as Promise<void>;
