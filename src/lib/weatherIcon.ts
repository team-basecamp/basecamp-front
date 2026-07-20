/**
 * OpenWeatherMap 아이콘 코드 → 이모지.
 *
 * 백엔드는 날씨 아이콘을 `"04d"` 같은 제공자 코드로 내려준다(RegionWeatherResponseDto.icon,
 * CampWeatherResponseDto.WeatherDay.icon). 화면에 그대로 찍으면 "04d" 가 보이므로 반드시 변환해야 한다.
 *
 * 제공자의 아이콘 이미지 URL(openweathermap.org/img/...)을 쓰지 않는 이유는 화면이 매 렌더마다
 * 외부 호스트에 의존하게 되기 때문이다. 이모지는 오프라인에서도 깨지지 않는다.
 *
 * 홈 위젯과 캠핑장 상세가 같은 표기를 써야 하므로 여기 한 곳에 둔다.
 * 낮/밤(d/n)이 갈리는 것은 맑음 계열뿐이라 나머지는 같은 이모지를 쓴다.
 */
const ICON_EMOJI: Record<string, string> = {
  "01d": "☀️", "01n": "🌙",
  "02d": "🌤️", "02n": "☁️",
  "03d": "⛅", "03n": "⛅",
  "04d": "☁️", "04n": "☁️",
  "09d": "🌧️", "09n": "🌧️",
  "10d": "🌦️", "10n": "🌧️",
  "11d": "⛈️", "11n": "⛈️",
  "13d": "🌨️", "13n": "🌨️",
  "50d": "🌫️", "50n": "🌫️",
};

/** 코드가 없거나(외부 API 실패) 모르는 코드면 중립적인 온도계로 떨어뜨린다. */
export const weatherEmoji = (icon?: string | null) => (icon && ICON_EMOJI[icon]) ?? "🌡️";
