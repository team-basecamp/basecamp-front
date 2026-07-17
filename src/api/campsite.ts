import instance from "./instance";
import type { Camp, CampRegistrationRequest, WeatherDay } from "../types";

/**
 * 캠핑장(campsite) 관련 API 함수 모음 - 목록/검색/상세/인기 캠핑장, 날씨, 찜하기,
 * 그리고 캠핑업체 전용 CRUD.
 * - createCampsite(POST /v1/camps/register), getMyCampsites(GET /v1/camps/my),
 *   updateCampsite(PATCH /v1/camps/{campId})는 실제 백엔드와 연동됨.
 * - deleteCampsite는 대응하는 백엔드 엔드포인트가 아직 없음.
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

/** 캠핑장 목록 공통 envelope (CampListResponseDto) */
export interface CampListEnvelope {
  resultCode: string;
  resultMsg: string;
  data: Camp[];
  totalCount: number;
}

/** 찜 토글 응답 (WishlistToggleResponse) */
export interface WishlistToggleResponse {
  campId: number;
  wished: boolean;
}

/** 내 찜 목록 항목 (WishlistResponse) */
export interface WishlistItem {
  campId: number;
  facltNm: string;
  addr1: string;
  firstImageUrl: string;
  createdAt: string;
}

// 키워드/지역/유형/최대금액 필터 + 정렬 + 페이징을 조합한 캠핑장 검색(=목록 조회)
export const getCampsites = (params: GetCampsitesParams = {}) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[]; totalCount: number }>(
    "/v1/camps/search",
    { params }
  );

// campId(실제 PK)로 상세 조회. 자체 등록 캠핑장은 contentId가 null이라 PK 기준으로 통일한다.
export const getCampsiteDetail = (campId: number) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp }>(`/v1/camps/${campId}`);

export const getHotCampsites = (sortBy: "rating" | "reservationCount" = "rating", numOfRows = 10, pageNo = 1) =>
  instance.get<{ resultCode: string; resultMsg: string; data: Camp[] }>("/v1/camps/hot", {
    params: { sortBy, numOfRows, pageNo },
  });

export const getCampsiteWeather = (contentId: number, checkInDate: string, checkOutDate: string) =>
  instance.get<{ contentId: number; weather: WeatherDay[] }>(`/v1/camps/${contentId}/weather`, {
    params: { checkInDate, checkOutDate },
  });

// 찜 토글 (POST /v1/camps/{campId}/wishlist)
// 이미 찜한 캠핑장이면 해제하고 아니면 등록한다. 결과 상태는 응답의 wished 로 내려온다.
// 회원 식별은 서버가 JWT 에서 하므로 요청 본문이 없다.
export const toggleWish = (campId: number) =>
  instance.post<WishlistToggleResponse>(
    `/v1/camps/${campId}/wishlist`,
    undefined
  ) as unknown as Promise<WishlistToggleResponse>;

// 내 찜 목록 (GET /v1/wishlists/me) - 최신 찜 순
export const getMyWishlists = () =>
  instance.get<WishlistItem[]>("/v1/wishlists/me") as unknown as Promise<WishlistItem[]>;

// 캠핑업체 전용
// 등록 직후 응답의 contentId는 항상 null (고캠핑 공공API 연동 캠핑장이 아니므로 자체 발급된 camp_id만 존재)
export const createCampsite = (payload: CampRegistrationRequest) =>
  instance.post<{ resultCode: string; resultMsg: string; data: Camp }>("/v1/camps/register", payload);

export const getMyCampsites = () =>
  instance.get<CampListEnvelope>("/v1/camps/my") as unknown as Promise<CampListEnvelope>;

// 캠핑장 정보 수정 (PATCH /v1/camps/{campId}) - 실제 백엔드와 연동됨
export const updateCampsite = (campId: number, payload: Partial<Camp>) =>
  instance.patch(`/v1/camps/${campId}`, payload);

// 캠핑장 삭제 (DELETE /v1/camps/{campId})
export const deleteCampsite = (campId: number) =>
  instance.delete(`/v1/camps/${campId}`);

// 관리자 전용
// 고캠핑 공공API 전체를 백엔드가 직접 호출해 DB에 동기화 (POST /v1/camps/fetch, ADMIN 전용).
// 페이지 전체를 순회하며 저장하므로 시간이 오래 걸릴 수 있어 axios 기본 타임아웃(10s)을 끈다.
// 성공/실패 모두 JSON이 아닌 순수 텍스트 메시지를 그대로 응답 본문으로 돌려준다.
export const fetchGocampingCamps = () =>
  instance.post<string>("/v1/camps/fetch", undefined, { timeout: 0 }) as unknown as Promise<string>;
