import instance from "./instance";
import type { RegionWeather } from "../types";

/**
 * 홈페이지 시/도별 날씨 위젯용 조회 (GET /v1/weather/regions).
 *
 * 백엔드가 전국 16개 시/도의 현재 날씨를 배열로 내려준다. 비로그인도 호출할 수 있다
 * (SecurityConfig 에서 /api/v1/weather/** GET 은 permitAll).
 *
 * 응답 인터셉터가 공통 봉투의 data 만 벗겨주므로 런타임 반환값은 AxiosResponse 가 아니라 배열 그 자체다.
 * 다만 instance 는 기본 AxiosInstance 타입으로 export 되어 있어(instance.ts 의 UnwrappedAxios 는 주석 처리됨)
 * 타입상으로는 AxiosResponse 로 보인다. 호출부마다 `(res: any)` 로 뭉개는 대신 여기서 한 번만 실제 동작에
 * 맞춰 좁힌다. instance.ts 가 UnwrappedAxios 로 export 되도록 정리되면 이 단언은 지워도 된다.
 */
export const getRegionWeathers = () =>
  instance.get<RegionWeather[]>("/v1/weather/regions") as unknown as Promise<RegionWeather[]>;
