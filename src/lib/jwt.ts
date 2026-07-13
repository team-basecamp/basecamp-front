/**
 * access 토큰(JWT) 페이로드 디코딩.
 *
 * 서명은 검증하지 않는다. 여기서 꺼낸 role 은 메뉴 표시 여부를 정하는 용도일 뿐이고,
 * 실제 접근 통제는 서버(SecurityConfig 의 ROLE_* 검사)가 한다.
 * 토큰을 위조해 메뉴를 띄워도 API 는 403 을 돌려준다.
 */
import type { MemberRole } from "../store/authStore";

/** 백엔드 JwtTokenProvider 가 심는 클레임 중 프론트가 쓰는 것만 추린다. */
interface AccessTokenPayload {
  sub?: string;
  role?: string;
  type?: string;
  exp?: number;
}

const ROLES: readonly MemberRole[] = ["CUSTOMER", "CAMP_OWNER", "ADMIN"];

const isMemberRole = (value: unknown): value is MemberRole =>
  typeof value === "string" && (ROLES as readonly string[]).includes(value);

/** base64url → UTF-8 문자열. JWT 는 padding 을 생략하고 +/ 대신 -_ 를 쓴다. */
function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  // 닉네임 등 비ASCII 클레임이 섞여도 깨지지 않도록 UTF-8 로 되돌린다.
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** 형식이 깨진 토큰이면 null. 호출부는 "권한 없음"으로 취급한다. */
export function decodeAccessToken(token: string | null): AccessTokenPayload | null {
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    const parsed: unknown = JSON.parse(decodeBase64Url(payload));
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as AccessTokenPayload;
  } catch {
    return null;
  }
}

/**
 * 토큰에서 회원 권한을 꺼낸다.
 * 백엔드가 모르는 값(구버전 토큰, 오타 등)을 담아 보내면 null 을 돌려 권한을 넓게 잡지 않는다.
 */
export function getRoleFromToken(token: string | null): MemberRole | null {
  const role = decodeAccessToken(token)?.role;
  return isMemberRole(role) ? role : null;
}
