/**
 * 백엔드가 내려주는 이미지 경로를 <img src>에 바로 쓸 수 있는 URL로 바꾼다.
 *
 * 업로드된 이미지는 DB에 "/images/abc123.jpg" 같은 상대경로로만 저장되고(FileStorageProperties.urlPrefix),
 * 실제 파일은 API가 아니라 백엔드 루트(예: http://localhost:8080/images/abc123.jpg)에서 정적으로 서빙된다.
 * 반면 axios baseURL 은 "/api"까지 포함하므로(.env VITE_API_BASE_URL), 그 baseURL 을 그대로 붙이면
 * "/api/images/..." 가 되어 404 가 난다. 여기서 오리진만 뽑아 쓴다.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

// baseURL 이 상대경로("/api")면 프론트와 같은 오리진(프록시 사용)이고, 절대 URL 이면 그 오리진이 백엔드다.
const BACKEND_ORIGIN = new URL(API_BASE, window.location.origin).origin;

/**
 * 상대경로는 백엔드 오리진을 붙여 절대 URL 로, 이미 절대 URL(http/https)이거나 data URI 면 그대로 둔다.
 * (프로필 이미지는 소셜 로그인 CDN URL 이 그대로 들어오기도 해서 절대 URL 통과가 필요하다.)
 */
export function resolveImageUrl(url: string): string;
export function resolveImageUrl(url: string | null | undefined): string | undefined;
export function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
