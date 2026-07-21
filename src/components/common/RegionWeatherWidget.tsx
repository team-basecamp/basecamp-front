import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Droplets } from "lucide-react";
import { getRegionWeathers } from "../../api/weather";
import { weatherEmoji } from "../../lib/weatherIcon";
import type { RegionWeather } from "../../types";

/**
 * 홈페이지 시/도별 현재 날씨 위젯.
 *
 * 전국 16개 시/도의 현재 날씨를 하나의 박스 안에서 가로 스크롤로 보여준다
 * (GET /v1/weather/regions, 비로그인 가능).
 * 캠핑은 야외 활동이라 "어디로 갈까"를 정할 때 날씨가 첫 판단 기준이 되므로 메인에 둔다.
 *
 * 조회에 실패해도 에러 배너나 모달은 띄우지 않는다. 날씨는 부가 정보이고 메인은 모든 방문자가
 * 처음 보는 화면이라, 여기서 에러를 크게 띄우면 서비스 전체가 고장난 것처럼 보인다.
 * (백엔드도 같은 이유로 fail-soft 다 — 외부 API 가 죽으면 HTTP 200 에 status=FETCH_FAILED 를 담아 내려준다.)
 *
 * 대신 감추지도 않는다. 실패 범위에 따라 위젯이 사라졌다 나타났다 하면 사용자는 "날씨 기능이
 * 없어졌나"로 읽고, 개발자도 화면만 봐서는 고장을 눈치채지 못한다. 위젯은 자리를 지킨 채
 * "불러오지 못했어요"라고 말한다.
 *
 * 실패는 두 층이고 표현 수단이 다르다.
 * - 지역별 status=FETCH_FAILED (200 응답 안) : 지역명이 있으므로 그 타일만 회색으로 바꾼다.
 * - 요청 자체가 깨짐(네트워크/서버 오류)      : 그릴 지역명조차 없어 타일 자리에 안내 문구를 넣는다.
 *
 * 값이 비었다는 것만으로는 "0도"와 "못 받음"을 구분할 수 없어 status 를 근거로 쓴다.
 */

/**
 * 날씨별 타일 색.
 *
 * 전에 연한 색이 안 먹혔던 건 페이지 배경이 크림색이라 옅은 타일이 배경에 묻혔기 때문이다.
 * 이제 타일이 흰 박스 안에 들어가므로 같은 농도로도 색이 제대로 읽힌다.
 *
 * 흐림(04)과 구름 많음(02)이 헷갈렸던 문제 때문에 이 둘은 색상(slate/sky)과 명도를
 * 모두 다르게 잡았다.
 */
interface ConditionStyle {
  /** 타일 배경. 옆 타일과의 날씨 구분을 맡는다. */
  tile: string;
  /** 이모지 뒤 원형 배경. 타일보다 한 단계 진해 카드 안에서 초점을 만든다. */
  halo: string;
}

const CONDITION_STYLE: Record<string, ConditionStyle> = {
  "01d": { tile: "bg-amber-50", halo: "bg-amber-200" },
  "01n": { tile: "bg-indigo-50", halo: "bg-indigo-200" },
  "02": { tile: "bg-sky-50", halo: "bg-sky-200" },
  "03": { tile: "bg-slate-50", halo: "bg-slate-200" },
  "04": { tile: "bg-slate-100", halo: "bg-slate-300" },
  "09": { tile: "bg-blue-50", halo: "bg-blue-200" },
  "10": { tile: "bg-blue-50", halo: "bg-blue-200" },
  "11": { tile: "bg-violet-50", halo: "bg-violet-200" },
  "13": { tile: "bg-cyan-50", halo: "bg-cyan-200" },
  "50": { tile: "bg-stone-100", halo: "bg-stone-300" },
};

const FALLBACK_STYLE: ConditionStyle = { tile: "bg-muted/60", halo: "bg-muted" };

/** 코드가 없거나(조회 실패) 모르는 코드면 무채색으로 떨어뜨린다. 맑음(01)만 낮/밤이 갈려 전체 코드로 찾는다. */
const styleFor = (icon?: string | null) =>
  (icon && (CONDITION_STYLE[icon] ?? CONDITION_STYLE[icon.slice(0, 2)])) ?? FALLBACK_STYLE;

/**
 * 조회에 실패한 지역인지. 값(temp/condition)이 아니라 status 로 판단한다.
 * 기온 0도나 습도 0% 는 정상값이라 값의 유무로는 실패를 판별할 수 없다.
 */
const isFetchFailed = (region: RegionWeather) => region.status === "FETCH_FAILED";

/**
 * 타일이 좁아 행정구역 접미사까지 넣으면 이름이 줄바꿈된다. 표시용으로만 줄인다.
 * 규칙으로 안 떨어지는 것(충청북도→충북 등)만 예외 표에 둔다.
 */
const SHORT_NAME: Record<string, string> = {
  충청북도: "충북",
  충청남도: "충남",
  경상북도: "경북",
  경상남도: "경남",
  전북특별자치도: "전북",
  전남광주통합특별시: "전남·광주",
};

const shortenRegion = (name: string) =>
  SHORT_NAME[name] ?? name.replace(/(특별자치시|특별자치도|특별시|광역시|도)$/, "");

/**
 * 한 화면에 보일 타일 수를 폭으로 고정한다(넓은 화면 기준 6개).
 * 계산식은 (100% - 타일사이_간격합) / 타일수 이고, 간격은 트랙의 gap-3(0.75rem)과 맞춰야 한다.
 * 6개를 유지하면 좁은 화면에서 타일이 뭉개지므로 sm 3개 / 모바일 2개로 낮춘다.
 * shrink-0 이 없으면 flex 가 타일을 줄여 6개 너머가 스크롤되지 않고 다 밀려 들어온다.
 */
const TILE_WIDTH =
  "shrink-0 basis-[calc((100%_-_0.75rem)/2)] sm:basis-[calc((100%_-_1.5rem)/3)] lg:basis-[calc((100%_-_3.75rem)/6)]";

const TILE_HEIGHT = "h-[196px]";

/** 기본 스크롤바는 두껍고 투박해 박스 안에서 눈에 띈다. 얇게 다듬되 없애지는 않는다(스크롤 가능 신호). */
const SCROLLBAR =
  "[&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border";

export default function RegionWeatherWidget() {
  const [regions, setRegions] = useState<RegionWeather[] | null>(null);
  const [failed, setFailed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getRegionWeathers()
      .then(setRegions)
      .catch(() => setFailed(true));
  }, []);

  /** 화살표는 한 번에 거의 한 화면씩 넘긴다. 90%만 미는 것은 경계 타일을 한 장 남겨 맥락을 잇기 위해서다. */
  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  };

  /*
    실패해도 위젯을 감추지 않는다. 실패 범위에 따라 위젯이 사라졌다 나타났다 하면
    사용자는 "날씨 기능이 없어졌나"로 읽고, 개발자도 화면만 봐서는 고장을 눈치채지 못한다.
    한 곳이 실패하든 전부 실패하든 화면은 같은 방식으로 "불러오지 못했어요"라고 말한다.

    다만 표현 수단이 다르다. 지역별 FETCH_FAILED 는 지역명이 있으니 그 타일만 회색으로 두면 되지만,
    요청 자체가 깨지면(네트워크/서버 오류) 그릴 지역명조차 없어 타일을 만들 수 없다.
    그래서 그때는 타일 자리에 안내 문구 한 줄을 대신 넣는다.
  */
  return (
    <section className="bg-secondary border-y border-border py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/*
          제목·화살표·타일을 하나의 박스 안에 넣는다. 위젯이 페이지에 흩어져 있지 않고
          "날씨 패널" 하나로 읽히고, 가로 스크롤도 이 박스 안에서만 일어난다.
        */}
        <div className="bg-card border border-border rounded-3xl p-6 sm:p-8">
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                시·도별 오늘 날씨
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                떠나기 전, 전국 날씨를 한 눈에 확인하세요
              </p>
            </div>

            {/* 데스크톱은 휠로 가로 스크롤하기 불편해 화살표를 준다. 모바일은 스와이프가 자연스러워 감춘다.
                넘길 타일이 없는 실패 상태에서는 눌러도 아무 일이 없으므로 화살표 자체를 감춘다. */}
            <div className={`${failed ? "hidden" : "hidden sm:flex"} gap-2`}>
              {([-1, 1] as const).map((direction) => (
                <button
                  key={direction}
                  onClick={() => scrollByPage(direction)}
                  aria-label={direction === -1 ? "이전 지역 보기" : "다음 지역 보기"}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all"
                >
                  {direction === -1 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                </button>
              ))}
            </div>
          </div>

          {/* 16개를 한 번에 펼치지 않고 6개만 보여준 뒤 가로 스크롤로 나머지를 넘긴다.
              스냅을 걸어 타일이 잘린 채 멈추지 않게 한다. */}
          <div
            ref={trackRef}
            className={`flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 ${SCROLLBAR}`}
          >
            {/*
              요청 자체가 깨진 경우엔 그릴 지역명조차 없어 타일을 만들 수 없다. 문구 한 줄로 대신한다.
              응답 전에는 실제 타일과 같은 크기의 자리표시자를 깔아 레이아웃이 밀리지 않게 한다.
            */}
            {failed ? (
              <p className="w-full py-12 text-center text-sm text-muted-foreground">
                날씨 정보를 불러오지 못했어요. 잠시 후 다시 확인해주세요
              </p>
            ) : regions === null ? (
              Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`${TILE_WIDTH} ${TILE_HEIGHT} rounded-2xl animate-pulse bg-muted`}
                />
              ))
            ) : (
              regions.map((region) => {
                const fetchFailed = isFetchFailed(region);
                // 실패 타일은 날씨 색을 쓰지 않는다. 색이 남아 있으면 "값이 있는 타일"로 읽힌다.
                const style = fetchFailed ? FALLBACK_STYLE : styleFor(region.icon);
                return (
                  <div
                    key={region.regionName}
                    title={
                      fetchFailed
                        ? `${region.regionName} — 날씨 정보를 불러오지 못했어요`
                        : region.regionName
                    }
                    className={`${TILE_WIDTH} ${TILE_HEIGHT} snap-start rounded-2xl px-2 ${style.tile}
                      flex flex-col items-center justify-center
                      transition-all duration-200 hover:-translate-y-1 hover:shadow-md`}
                  >
                    <div className="text-sm font-bold text-foreground/70 truncate max-w-full">
                      {shortenRegion(region.regionName)}
                    </div>

                    <div
                      className={`w-14 h-14 my-2 rounded-full flex items-center justify-center text-3xl ${style.halo}`}
                    >
                      {weatherEmoji(region.icon)}
                    </div>

                    <div className="text-3xl font-extrabold leading-none tracking-tight">
                      {region.temp != null ? `${Math.round(region.temp)}°` : "–"}
                    </div>

                    {/*
                      전에는 값이 비면 무조건 "정보 없음"이라 사용자 입장에서 "이 지역은 원래 없는 것"처럼
                      읽혔다. status 가 생겼으니 일시적 장애임을 알 수 있게 문구를 나눈다.
                    */}
                    <div className="text-sm text-foreground/60 truncate max-w-full mt-1.5">
                      {fetchFailed ? "불러오지 못했어요" : region.condition ?? "정보 없음"}
                    </div>

                    {/* 값이 없어도 자리는 남긴다. 지역마다 타일 높이가 달라지면 줄이 울퉁불퉁해진다. */}
                    <div className="flex items-center gap-1 text-xs font-medium text-foreground/50 mt-1.5">
                      <Droplets size={12} />
                      습도 : {region.humidity != null ? `${region.humidity}%` : "–"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
