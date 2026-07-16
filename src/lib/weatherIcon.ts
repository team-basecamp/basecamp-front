/**
 * OpenWeatherMap 아이콘 코드 → 이모지.
 * 코드 체계: 앞 두 자리가 날씨(01=맑음 ... 50=안개), 끝 글자가 d(주간)/n(야간).
 * 실제 아이콘 이미지가 필요하면 https://openweathermap.org/img/wn/{icon}@2x.png 로 대체할 수 있다.
 */
const ICON_EMOJI: Record<string, string> = {
    "01d": "☀️", "01n": "🌙",
    "02d": "🌤️", "02n": "☁️",
    "03d": "☁️", "03n": "☁️",
    "04d": "☁️", "04n": "☁️",
    "09d": "🌧️", "09n": "🌧️",
    "10d": "🌦️", "10n": "🌧️",
    "11d": "⛈️", "11n": "⛈️",
    "13d": "❄️", "13n": "❄️",
    "50d": "🌫️", "50n": "🌫️",
};

/** 아이콘 코드가 없거나(조회 실패) 모르는 코드면 기본 아이콘을 돌려준다. */
export const getWeatherEmoji = (icon: string | null) => (icon ? ICON_EMOJI[icon] ?? "🌡️" : "🌡️");