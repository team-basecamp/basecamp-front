import instance from "./instance";
import type { Page } from "./page";

/**
 * 관리자(admin) 전용 API. 백엔드 AdminUserController 계약을 그대로 따른다.
 * - 회원 목록 조회: GET  /v1/admin/users            (status·role·keyword·page 선택)
 * - 회원 제재:      POST /v1/admin/users/{id}/blacklist   (강제 로그아웃 + 토큰 무효화)
 * - 제재 목록:      GET  /v1/admin/users/blacklist
 * - 제재 해제:      POST /v1/admin/users/{id}/blacklist/release
 *
 * instance 의 응답 인터셉터가 res.data 로 언래핑하므로, 각 함수의 실제 resolve 값은
 * 제네릭 타입 그대로다(axios 타입과 런타임을 일치시키는 캐스팅).
 */

export type UserStatus = "ACTIVE" | "BLACKLISTED" | "WITHDRAWN";
export type UserRole = "CUSTOMER" | "CAMP_OWNER" | "ADMIN";

/** 관리자 회원 목록 항목(AdminUserResponse). */
export interface AdminUser {
  userId: number;
  email: string;
  nickname: string;
  profileImageUrl: string | null;
  provider: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  /** 제재 중일 때만 값이 있다. */
  blacklistReason: string | null;
  blacklistedAt: string | null;
  /** 탈퇴 회원만 값이 있다. */
  deletedAt: string | null;
}

/** 제재된 회원 목록 항목(BlacklistedUserResponse). */
export interface BlacklistedUser {
  userId: number;
  email: string;
  nickname: string;
  provider: string;
  blacklistReason: string;
  blacklistedAt: string;
}

/**
 * 회원 목록. status·role·keyword 는 선택이며 지정한 것만 AND 로 묶인다.
 * keyword 는 닉네임 또는 이메일 부분 일치. page 는 0-base.
 */
export const getAdminUsers = (params: {
  status?: UserStatus;
  role?: UserRole;
  keyword?: string;
  page?: number;
  size?: number;
}) =>
  instance.get<Page<AdminUser>>("/v1/admin/users", { params }) as unknown as Promise<Page<AdminUser>>;

/** 회원 제재(강제 로그아웃). 이미 제재된 회원이면 409, 없거나 탈퇴한 회원이면 404. */
export const blacklistUser = (userId: number, reason: string) =>
  instance.post<void>(`/v1/admin/users/${userId}/blacklist`, { reason }) as unknown as Promise<void>;

/** 제재된 회원 목록(제재 일시 최신순). page 는 0-base. */
export const getBlacklistedUsers = (page = 0, size = 20) =>
  instance.get<Page<BlacklistedUser>>("/v1/admin/users/blacklist", {
    params: { page, size },
  }) as unknown as Promise<Page<BlacklistedUser>>;

/** 회원 제재 해제. 제재 상태가 아닌 회원이면 409. */
export const releaseUser = (userId: number) =>
  instance.post<void>(`/v1/admin/users/${userId}/blacklist/release`) as unknown as Promise<void>;
