import instance from "./instance";

/**
 * 날씨 관련 API 함수 모음 - 시/도별 현재 날씨(홈), 캠핑장 예약일 날씨(상세).
 * - 백엔드가 OpenWeatherMap 응답을 우리 계약으로 변환해 내려주므로, 프론트는 외부 API 구조를 몰라도 된다.
 * - instance 의 응답 인터셉터가 { success, message, data } 봉투를 벗기므로 실제 resolve 값은 제네릭 타입 그대로다.
 */

/** 시/도별 현재 날씨(RegionWeatherResponseDto). 조회 실패한 지역은 지역명만 오고 나머지는 null 이다. */
export interface RegionWeather {
    regionName: string;
    temp: number | null;
    condition: string | null;
    humidity: number | null;
    icon: string | null;
}

/** 전국 시/도의 현재 날씨. 비로그인도 호출 가능. */
export const getRegionWeathers = () =>
    instance.get<RegionWeather[]>("/v1/weather/regions") as unknown as Promise<RegionWeather[]>;

/** 하루치 날씨(CampWeatherResponseDto.WeatherDay) */
export interface WeatherDay {
    date: string;
    temp: number | null;
    condition: string | null;
    humidity: number | null;
    icon: string | null;
}

export interface CampWeather {
    campId: number;
    weather: WeatherDay[];
}

/**
 * 캠핑장 예약 기간의 날씨.
 * 예보 범위(오늘부터 5일)를 벗어난 날짜는 응답에 담기지 않는다 — 오류가 아니라 빈 배열이므로 호출부가 안내 문구로 처리한다.
 */
export const getCampWeather = (campId: number, checkInDate: string, checkOutDate: string) =>
    instance.get<CampWeather>(`/v1/camps/${campId}/weather`, {
        params: { checkInDate, checkOutDate },
    }) as unknown as Promise<CampWeather>;