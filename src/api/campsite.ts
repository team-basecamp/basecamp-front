import instance from "./instance";
import type { Camp, CampRegistrationRequest, CampWeather } from "../types";

/**
 * 캠핑장(campsite) 관련 API 함수 모음 - 목록/검색/상세/인기 캠핑장, 날씨, 찜하기,
 * 그리고 캠핑업체 전용 CRUD.
 *
 * 이미지가 MinIO 로 이관되면서 등록/수정은 multipart/form-data 로 나간다:
 * - 캠핑장 정보는 "request"(application/json) 파트, 새 이미지 파일은 "images" 파트.
 * - 보안 정책상 GET/POST 만 쓰므로 수정은 POST /v1/camps/{campId}/update,
 *   삭제는 POST /v1/camps/{campId}/delete 다(PATCH/DELETE 아님).
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

/**
 * Spring Data Page 직렬화 형태. 검색/HOT 목록 응답이 이 구조로 내려온다.
 * (백엔드가 camp 도메인의 이중 응답 봉투를 제거하면서 목록이 Page 로 통일됨.
 *  인터셉터가 바깥 봉투의 data 를 벗겨주므로 런타임 resolve 값이 곧 이 Page 다.)
 */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
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
  instance.get<SpringPage<Camp>>("/v1/camps/search", { params }) as unknown as Promise<SpringPage<Camp>>;

// campId(실제 PK)로 상세 조회. 자체 등록 캠핑장은 contentId가 null이라 PK 기준으로 통일한다.
export const getCampsiteDetail = (campId: number) =>
  instance.get<Camp>(`/v1/camps/${campId}`) as unknown as Promise<Camp>;

export const getHotCampsites = (sortBy: "rating" | "reservationCount" = "rating", numOfRows = 10, pageNo = 1) =>
  instance.get<SpringPage<Camp>>("/v1/camps/hot", {
    params: { sortBy, numOfRows, pageNo },
  }) as unknown as Promise<SpringPage<Camp>>;

/**
 * 예약 기간의 날씨 조회 (GET /v1/camps/{campId}/weather).
 *
 * 백엔드는 campId(PK)를 받는다. 예전에는 이 함수만 contentId 를 넘기고 있었는데, 자체 등록
 * 캠핑장은 contentId 가 null 이라 `/v1/camps/null/weather` 가 나갔다. getCampsiteDetail 이
 * 이미 campId 로 통일한 것과 같은 이유로 맞춘다.
 *
 * 예보 범위(5일) 밖의 날짜는 응답에 담기지 않으므로, weather 길이가 요청 일수보다 짧을 수 있다.
 * 응답 인터셉터가 공통 봉투의 data 를 벗기므로 런타임 반환값은 AxiosResponse 가 아니다(weather.ts 와 동일).
 */
export const getCampsiteWeather = (campId: number, checkInDate: string, checkOutDate: string) =>
  instance.get<CampWeather>(`/v1/camps/${campId}/weather`, {
    params: { checkInDate, checkOutDate },
  }) as unknown as Promise<CampWeather>;

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

/**
 * 백엔드가 'request' 파트를 @RequestPart 로 받으므로 Content-Type 이 application/json 이어야 한다.
 * 문자열로 그냥 append 하면 text/plain 으로 나가 415 가 되므로 Blob 으로 감싸 타입을 명시한다.
 * 파일이 하나도 없으면 images 파트를 아예 넣지 않는다(백엔드에서 required=false).
 */
const buildCampForm = (request: object, images?: File[]) => {
  const form = new FormData();
  form.append("request", new Blob([JSON.stringify(request)], { type: "application/json" }));
  images?.forEach((file) => form.append("images", file));
  return form;
};

// 캠핑장 수정 요청 본문. keepImageUrls 로 남길 기존 이미지를, images(파일)로 새 이미지를 보낸다.
// - keepImageUrls 생략(undefined): 기존 이미지 전부 유지 / 빈 배열([]): 전부 삭제
// 대표 이미지(firstImageUrl)는 최종 이미지 목록의 첫 장으로 백엔드가 자동 지정한다.
export type CampUpdateRequest = Partial<CampRegistrationRequest> & { keepImageUrls?: string[] };

// 캠핑장 등록 (POST /v1/camps/register, multipart). 이미지 파일을 함께 올린다.
// 등록 직후 응답의 contentId는 항상 null (고캠핑 공공API 연동 캠핑장이 아니므로 자체 발급된 camp_id만 존재)
export const createCampsite = (request: CampRegistrationRequest, images?: File[]) =>
  instance.post<Camp>("/v1/camps/register", buildCampForm(request, images)) as unknown as Promise<Camp>;

export const getMyCampsites = () =>
  instance.get<Camp[]>("/v1/camps/my") as unknown as Promise<Camp[]>;

// 캠핑장 정보 수정 (POST /v1/camps/{campId}/update, multipart)
export const updateCampsite = (campId: number, request: CampUpdateRequest, images?: File[]) =>
  instance.post<Camp>(`/v1/camps/${campId}/update`, buildCampForm(request, images)) as unknown as Promise<Camp>;

// 캠핑장 삭제 (POST /v1/camps/{campId}/delete, 소프트 삭제). 첨부 이미지는 저장소에서 완전히 지워진다.
export const deleteCampsite = (campId: number) =>
  instance.post(`/v1/camps/${campId}/delete`);

// 관리자 전용
// 고캠핑 공공API 전체를 백엔드가 직접 호출해 DB에 동기화 (POST /v1/camps/fetch, ADMIN 전용).
// 페이지 전체를 순회하며 저장하므로 시간이 오래 걸릴 수 있어 axios 기본 타임아웃(10s)을 끈다.
// 성공/실패 모두 JSON이 아닌 순수 텍스트 메시지를 그대로 응답 본문으로 돌려준다.
export const fetchGocampingCamps = () =>
  instance.post<string>("/v1/camps/fetch", undefined, { timeout: 0 }) as unknown as Promise<string>;
