import instance from "./instance";
import type { Camp, WeatherDay } from "../types";

/**
 * 캠핑장(campsite) 관련 API 함수 모음 - 목록/검색/상세/인기 캠핑장, 날씨, 찜하기,
 * 그리고 캠핑업체 전용 CRUD.
 * - 엔드포인트/스키마는 src/imports/pasted_text/api-endpoints.md 스펙을 따름
 * - 주의: 현재 pages/campsite/*, pages/business/* 등은 이 함수들을 호출하지 않고
 *   data/camps.ts의 mock 배열을 그대로 사용 중. 실제 백엔드 연동 시
 *   여기 함수들을 TanStack Query로 교체하면 됨.
 */
export const getMapData = (mapX: number, mapY: number) =>
  instance.get("/v1/map", { params: { mapX, mapY } });

export const getCampsites = (params: { numOfRows?: number; pageNo?: number } = {}) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[] }>("/v1/camps", { params });

export const searchCampsites = (params: { keyword: string; numOfRows?: number; pageNo?: number }) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[] }>("/v1/camps/search", { params });

export const getCampsiteDetail = (contentId: number) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp }>(`/v1/camps/${contentId}`);

export const getHotCampsites = (sortBy: "rating" | "reservationCount" = "rating", numOfRows = 10, pageNo = 1) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[] }>("/v1/camps/hot", {
    params: { sortBy, numOfRows, pageNo },
  });

export const getCampsiteWeather = (contentId: number, checkInDate: string, checkOutDate: string) =>
  instance.get<{ contentId: number; weather: WeatherDay[] }>(`/v1/camps/${contentId}/weather`, {
    params: { checkInDate, checkOutDate },
  });

export const toggleWish = (contentId: number) =>
  instance.post<{ contentId: number; wished: boolean; message: string }>(`/v1/camps/${contentId}/wish`, {
    contentId,
  });

// 캠핑업체 전용
export const createCampsite = (payload: Partial<Camp>) => instance.post("/v1/camps", payload);

export const getMyCampsites = () => instance.get<{ camps: Camp[] }>("/v1/camps/my");

// 실제로는 수정(UPDATE) 처리 (REST 컨벤션상 POST로 구현됨)
export const updateCampsite = (contentId: number, payload: Partial<Camp>) =>
  instance.post(`/v1/camps/${contentId}/update`, payload);

// 실제로는 삭제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const deleteCampsite = (contentId: number) =>
  instance.post(`/v1/camps/${contentId}/delete`, { contentId });
