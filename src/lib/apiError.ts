import { AxiosError } from "axios";
import type { ApiResponse } from "../api/instance";

type ErrorBody = Partial<ApiResponse<unknown>>;

/**
 * 백엔드 공통 오류 응답(ApiResponse, success=false)의 message 를 최대한 뽑아낸다.
 * axios 에러가 아니거나 message 가 없으면 fallback 을 반환한다.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ErrorBody | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}

/**
 * Bean Validation 실패 시 어떤 필드들이 왜 틀렸는지 목록을 뽑아낸다(없으면 빈 배열).
 * 폼에서 필드별 에러를 한 번에 표시할 때 쓴다.
 */
export function getApiFieldErrors(err: unknown): { field: string; reason: string }[] {
  if (err instanceof AxiosError) {
    const data = err.response?.data as ErrorBody | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => ({ field: e.field, reason: e.reason }));
    }
  }
  return [];
}
