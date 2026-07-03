import type { WeatherDay } from "../types";

/**
 * 실제 날씨 API 없이, 캠핑장 ID + 날짜를 시드값으로 사용해
 * 항상 같은 입력에 같은 결과가 나오는 결정적(deterministic) mock 날씨를 생성하는 유틸.
 * 캠핑장 상세 화면(예약 전 날씨 미리보기)에서 사용되며, getCampsiteWeather API 대신 쓰이고 있음.
 */
const CONDITIONS = [
  { condition: "맑음", icon: "☀️" },
  { condition: "구름조금", icon: "🌤️" },
  { condition: "흐림", icon: "☁️" },
  { condition: "비", icon: "🌧️" },
];

function mockWeatherForDate(contentId: number, dateStr: string): WeatherDay {
  const seed = contentId + dateStr.split("-").reduce((sum, part) => sum + Number(part), 0);
  const pick = CONDITIONS[seed % CONDITIONS.length];
  return {
    date: dateStr,
    temp: 18 + (seed % 12),
    condition: pick.condition,
    humidity: 40 + ((seed * 7) % 40),
    icon: pick.icon,
  };
}

const MAX_PREVIEW_DAYS = 5;

export function getWeatherPreview(contentId: number, checkInDate: string, checkOutDate: string): WeatherDay[] {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (!checkInDate || !checkOutDate || isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  const days: WeatherDay[] = [];
  const cursor = new Date(start);
  while (cursor <= end && days.length < MAX_PREVIEW_DAYS) {
    days.push(mockWeatherForDate(contentId, cursor.toISOString().slice(0, 10)));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}
