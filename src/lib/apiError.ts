import { AxiosError } from "axios";

/**
 * 백엔드 공통 에러 응답(ErrorResponse)의 message 를 최대한 뽑아낸다.
 * axios 에러가 아니거나 message 가 없으면 fallback 을 반환한다.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}
