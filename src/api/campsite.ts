import instance from "./instance";
import type { Camp, CampRegistrationRequest, WeatherDay } from "../types";

/**
 * 캠핑장(campsite) 관련 API 함수 모음 - 목록/검색/상세/인기 캠핑장, 날씨, 찜하기,
 * 그리고 캠핑업체 전용 CRUD.
 * - createCampsite(POST /v1/camps/register), getMyCampsites(GET /v1/camps/my)는 실제 백엔드와 연동됨.
 * - updateCampsite/deleteCampsite는 대응하는 백엔드 엔드포인트가 아직 없음.
 */
export const getMapData = (mapX: number, mapY: number) =>
  instance.get("/v1/map", { params: { mapX, mapY } });

export interface GetCampsitesParams {
  keyword?: string;
  region?: string;
  induty?: string;
  priceMax?: number;
  sort?: "recommended" | "rating" | "reviewCount" | "priceAsc" | "recent";
  pageNo?: number;
  numOfRows?: number;
}

// 키워드/지역/유형/최대금액 필터 + 정렬 + 페이징을 조합한 캠핑장 검색(=목록 조회)
export const getCampsites = (params: GetCampsitesParams = {}) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[]; totalCount: number }>(
    "/v1/camps/search",
    { params }
  );

export const getCampsiteDetail = (contentId: number) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp }>(`/v1/camps/content/${contentId}`);

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
// 등록 직후 응답의 contentId는 항상 null (고캠핑 공공API 연동 캠핑장이 아니므로 자체 발급된 camp_id만 존재)
export const createCampsite = (payload: CampRegistrationRequest) =>
  instance.post<{ resultCode: string; resultMsg: string; data: Camp }>("/v1/camps/register", payload);

export const getMyCampsites = () =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[]; totalCount: number }>("/v1/camps/my");

// 실제로는 수정(UPDATE) 처리 (REST 컨벤션상 POST로 구현됨)
export const updateCampsite = (contentId: number, payload: Partial<Camp>) =>
  instance.post(`/v1/camps/${contentId}/update`, payload);

// 실제로는 삭제(DELETE) 처리 (REST 컨벤션상 POST로 구현됨)
export const deleteCampsite = (contentId: number) =>
  instance.post(`/v1/camps/${contentId}/delete`, { contentId });
