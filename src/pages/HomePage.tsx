import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Users, ChevronRight, TrendingUp, MapPin } from "lucide-react";
import CampCard from "../components/common/CampCard";
import { CAMPS } from "../data/camps";
import type { Camp } from "../types";
import "./HomePage.css";

const QUICK_TAGS = ["강원 숲속", "제주 힐링", "가평 계곡", "글램핑", "오션뷰", "반려동물"];

type HotSort = "rating" | "reservationCount";

/**
 * 메인 홈페이지 (/)
 * - 히어로 검색창, 인기(HOT) 캠핑장, 유형별 카테고리, 최근 등록 캠핑장을 한 화면에 소개
 * - 캠핑장 데이터는 data/camps.ts의 mock 데이터(CAMPS)를 그대로 사용 (백엔드 연동 전 임시 데이터)
 * - 검색/카테고리/태그 클릭 시 실제 필터링은 하지 않고 /campsites?q=... 로 이동만 시키며, 필터링은 CampsiteListPage에서 처리
 */
export default function HomePage() {
  const [query, setQuery] = useState(""); // 검색창 입력값
  const [hotSort, setHotSort] = useState<HotSort>("rating"); // 인기 캠핑장 정렬 기준 (평점순 / 예약건수순)
  const navigate = useNavigate();

  const hotCamps = [...CAMPS]
    .sort((a, b) =>
      hotSort === "rating"
        ? b.rating - a.rating
        : (b.reservationCount ?? 0) - (a.reservationCount ?? 0)
    )
    .slice(0, 4);

  const onSearch = (q: string) => navigate(`/campsites?q=${encodeURIComponent(q)}`);
  const onCampClick = (camp: Camp) => navigate(`/campsites/${camp.contentId}`);
  const onLoginClick = () => navigate("/login");

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-section relative h-[72vh] min-h-[520px] flex items-center">
        <div
          className="hero-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=1600&h=900&fit=crop&auto=format')" }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%)" }} />

        <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-xl">
            <h1 className="hero-title text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Find your perfect<br />campground.
            </h1>
            <p className="hero-sub text-white/80 text-lg mb-8">
              한국에서 캠핑하기 좋은 스팟을 찾아보고 비교해보세요.
            </p>

            {/* Search bar — mirrors the Basecamp mockup */}
            <div className="hero-search bg-white rounded-2xl shadow-2xl p-2 flex gap-2">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search size={18} className="text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  placeholder="캠핑장 이름 또는 지역을 검색하세요"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
                  className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent py-2"
                />
              </div>
              <button
                onClick={() => onSearch(query)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                검색
              </button>
            </div>

            {/* Quick tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onSearch(tag)}
                  className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-white text-xs font-medium hover:bg-white/30 transition-all border border-white/20"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="bg-primary text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 gap-4 text-center">
          {[
            { value: "1,284", label: "등록 캠핑장" },
            { value: "48,200+", label: "누적 후기" },
            { value: "210,000", label: "월 방문자" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-0.5">
              <span className="text-xl font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</span>
              <span className="text-xs text-white/70">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hot 캠핑장 (평점순/예약건수순) ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} className="text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">HOT</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              인기 캠핑장
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              {hotSort === "rating" ? "평점 높은 순으로 선별했습니다" : "예약 많은 순으로 선별했습니다"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {([
                { key: "rating", label: "평점순" },
                { key: "reservationCount", label: "예약건수순" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setHotSort(opt.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    hotSort === opt.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => onSearch("")} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
              전체보기 <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {hotCamps.map((camp) => (
            <CampCard key={camp.contentId} camp={camp} onClick={() => onCampClick(camp)} />
          ))}
        </div>
      </section>

      {/* ── Camp type categories ── */}
      <section className="bg-secondary border-y border-border py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            유형별 캠핑장
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: "🌲", label: "일반야영장", count: 432, query: "일반야영장" },
              { icon: "🚗", label: "오토캠핑장", count: 387, query: "오토캠핑장" },
              { icon: "⛺", label: "글램핑", count: 218, query: "글램핑" },
              { icon: "🚐", label: "카라반", count: 97, query: "카라반" },
            ].map((cat) => (
              <button
                key={cat.label}
                onClick={() => onSearch(cat.query)}
                className="bg-card border border-border rounded-2xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <span className="text-3xl mb-3 block">{cat.icon}</span>
                <p className="font-semibold text-sm group-hover:text-primary transition-colors">{cat.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cat.count.toLocaleString()}개</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recently added ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Star size={16} className="text-accent fill-accent" />
              <span className="text-xs font-semibold text-accent uppercase tracking-wider">NEW</span>
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              최근 등록 캠핑장
            </h2>
          </div>
          <button onClick={() => onSearch("")} className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
            전체보기 <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMPS.slice(4, 7).map((camp) => (
            <CampCard key={camp.contentId} camp={camp} onClick={() => onCampClick(camp)} />
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div
          className="relative rounded-3xl overflow-hidden p-12 text-white text-center"
          style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #1A4033 100%)" }}
        >
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1200&h=400&fit=crop&auto=format')", backgroundSize: "cover", backgroundPosition: "center" }}
          />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              나만의 캠핑 후기를 공유하세요
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-sm">
              직접 다녀온 캠핑장 후기를 남기고 다른 캠퍼들과 정보를 공유하세요
            </p>
            <button
              onClick={onLoginClick}
              className="px-8 py-3 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all"
            >
              무료로 시작하기
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
