/**
 * Spring Data 의 Page 응답 중 화면에서 실제로 쓰는 필드만 추린 공용 타입.
 * 백엔드가 Page<T> 를 그대로 직렬화하므로 목록형 API 응답은 전부 이 형태를 공유한다.
 */
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
