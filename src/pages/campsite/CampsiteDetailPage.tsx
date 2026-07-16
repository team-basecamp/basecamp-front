import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";                    // ✅ 추가
import {
  ArrowLeft, MapPin, Heart, Phone, Globe, Users,
  CheckCircle, Droplets, Wind, TreePine, Calendar, Plus, Minus,
  Edit3, Trash2, Camera, X,
} from "lucide-react";
import StarRow from "../../components/common/StarRow";
import { CAMPS } from "../../data/camps";
import { INITIAL_REVIEWS } from "../../data/reviews";
import { getCampsiteDetail } from "../../api/campsite";
import { getCampWeather } from "../../api/weather";                  // ✅ 추가
import { getWeatherEmoji } from "../../lib/weatherIcon";             // ✅ 추가
import useAuthStore from "../../store/authStore";
import useWishlistStore from "../../store/wishlistStore";
import type { Camp, Review } from "../../types";

/** Date → yyyy-MM-dd (로컬 시간 기준) */
const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** yyyy-MM-dd 문자열에 하루를 더한다 */
const addDay = (dateStr: string) => {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return toDateStr(d);
};

/**
 * 캠핑장 상세 페이지 (/campsites/:contentId)
 * - 캠핑장 소개/편의시설/날씨 미리보기/찜하기/리뷰(작성·수정·삭제)를 한 화면에서 처리
 * - 리뷰는 mock 데이터(data/reviews.ts)를 기반으로 컴포넌트 로컬 state로 관리 (새로고침 시 초기화됨)
 * - 찜 상태는 store/wishlistStore로 전역 관리되어 캠핑장 목록/찜 목록 화면과 동기화됨
 */
export default function CampsiteDetailPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isWished = useWishlistStore((s) => s.isWished);
  const toggleWish = useWishlistStore((s) => s.toggleWish);

  const [camp, setCamp] = useState<Camp | undefined>(
    CAMPS.find((c) => (c.campId ?? c.contentId) === Number(contentId))
  );
  const [campLoading, setCampLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCampLoading(true);
    getCampsiteDetail(Number(contentId))
      .then((res: any) => {
        if (cancelled) return;
        const fetched: Camp = res.data;
        setCamp(fetched);
        // ReservationPage가 아직 mock 데이터(CAMPS)에서 contentId 기준으로만 캠핑장을 조회하므로,
        // 공공 API로 불러온 캠핑장과 자체 등록 캠핑장(contentId가 null이라 campId로 식별)도
        // 라우팅에 쓰인 id를 contentId 자리에 맞춰 등록해두어 예약 페이지에서 찾을 수 있게 한다.
        const key = fetched?.campId ?? fetched?.contentId;
        if (fetched && key != null && !CAMPS.some((c) => (c.campId ?? c.contentId) === key)) {
          CAMPS.push({ ...fetched, contentId: key });
        }
      })
      .catch(() => { if (!cancelled) setCamp(CAMPS.find((c) => (c.campId ?? c.contentId) === Number(contentId))); })
      .finally(() => { if (!cancelled) setCampLoading(false); });
    return () => { cancelled = true; };
  }, [contentId]);

  const [campReviews, setCampReviews] = useState<Review[]>(
    INITIAL_REVIEWS.filter((r) => r.campId === Number(contentId))
  );
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState<{ rating: number; content: string; images: string[] }>({
    rating: 5, content: "", images: [],
  });
  const [editId, setEditId] = useState<number | null>(null); // 현재 수정 중인 리뷰 id (null이면 신규 작성)
  const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set()); // "도움돼요" 누른 리뷰 id 집합 (로컬 UI 상태, 서버 저장 안 됨)
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_REVIEW_IMAGES = 5;

  // 다른 화면(예: 예약 완료 후)에서 navigate로 넘어올 때 state로 리뷰 작성폼 자동 오픈 요청이 온 경우 처리
  useEffect(() => {
    if ((location.state as { openReviewForm?: boolean } | null)?.openReviewForm && user) {
      setShowForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 훅은 렌더마다 같은 순서·같은 개수로 호출돼야 하므로 early return 위에 둔다.
  // camp 가 아직 없을 수 있어 옵셔널 체이닝으로 접근하고, 실제 호출 시점은 enabled 로 제어한다.
  // 자체 등록 캠핑장은 contentId 가 null 이므로 PK(campId) 를 우선 사용한다.
  const campId = camp?.campId ?? camp?.contentId;
  const { data: campWeather } = useQuery({
    queryKey: ["campWeather", campId, checkIn, checkOut],
    queryFn: () => getCampWeather(campId!, checkIn, checkOut),
    enabled: !!campId && !!checkIn && !!checkOut,   // 날짜를 골라야 호출한다
    staleTime: 1000 * 60 * 10,                      // 백엔드 캐시(10분)와 맞춘다
  });

  if (!camp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">
          {campLoading ? "캠핑장 정보를 불러오는 중..." : "캠핑장을 찾을 수 없습니다"}
        </p>
        {!campLoading && (
          <button onClick={() => navigate("/campsites")} className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all">
            목록으로
          </button>
        )}
      </div>
    );
  }

  const weatherDays = campWeather?.weather ?? [];

  // 백엔드 @Future 검증 때문에 오늘은 선택 불가
  const tomorrow = addDay(toDateStr(new Date()));
  const minCheckOut = checkIn ? addDay(checkIn) : addDay(tomorrow);

  const avgRating = campReviews.length
    ? (campReviews.reduce((s, r) => s + r.rating, 0) / campReviews.length).toFixed(1)
    : "—";

  const onLoginRequest = () => navigate("/login");
  const onReserve = () =>
    navigate(`/campsites/${camp.campId ?? camp.contentId}/reservation`, { state: { checkIn, checkOut, guestCount } });
  const onReviewClick = (review: Review) => navigate(`/reviews/${review.id}`);

  // 신규 작성/수정을 하나의 폼으로 처리: editId가 있으면 해당 리뷰를 갱신, 없으면 새 리뷰를 목록 맨 앞에 추가
  const submitReview = () => {
    if (!newReview.content.trim()) return;
    if (editId !== null) {
      setCampReviews((prev) =>
        prev.map((r) => r.id === editId ? { ...r, ...newReview } : r)
      );
      setEditId(null);
    } else {
      setCampReviews((prev) => [
        {
          id: Date.now(), campId: campId!,
          author: user!.nickname, avatar: user!.nickname[0],
          rating: newReview.rating, date: new Date().toISOString().slice(0, 10),
          content: newReview.content, images: newReview.images, likes: 0, comments: [],
        },
        ...prev,
      ]);
    }
    setNewReview({ rating: 5, content: "", images: [] });
    setShowForm(false);
  };

  const deleteReview = (id: number) => setCampReviews((prev) => prev.filter((r) => r.id !== id));

  const startEdit = (r: Review) => {
    setNewReview({ rating: r.rating, content: r.content, images: r.images });
    setEditId(r.id);
    setShowForm(true);
  };

  const addReviewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_REVIEW_IMAGES - newReview.images.length;
    const urls = files.slice(0, remaining).map((f) => URL.createObjectURL(f));
    setNewReview((f) => ({ ...f, images: [...f.images, ...urls] }));
    e.target.value = "";
  };

  const removeReviewImage = (url: string) => {
    setNewReview((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));
    URL.revokeObjectURL(url);
  };

  // 로그인 여부에 따라 예약 진행 or 로그인 유도 분기
  const handleReserveClick = () => {
    if (!user) onLoginRequest();
    else onReserve();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate("/campsites")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* Hero image */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden mb-8 bg-muted">
        {(camp.image || camp.firstImageUrl) ? (
          <img src={camp.image || camp.firstImageUrl} alt={camp.facltNm} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-6xl">🏕️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {(camp.tags ?? []).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white text-xs">{t}</span>
            ))}
          </div>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            {camp.facltNm}
          </h1>
          <div className="flex items-center gap-1 text-white/80 text-sm mt-1">
            <MapPin size={12} /> {camp.addr1}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main content ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>캠핑장 소개</h2>
            {/* 백엔드는 lineIntro 하나만 내려주며 그 값이 상세 소개 전문이다(고캠핑 API의 intro를 그대로 저장).
                mock 데이터만 lineIntro(한줄 소개)와 intro(상세 소개)를 별도로 갖고 있어 둘 다 있을 때만 강조 줄을 보여준다. */}
            {camp.intro && camp.lineIntro && (
              <p className="text-foreground text-sm font-medium mb-2">{camp.lineIntro}</p>
            )}
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              {camp.intro ?? camp.lineIntro ?? "등록된 소개가 없습니다."}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { icon: <Phone size={14} />, label: "전화번호", value: camp.tel },
                { icon: <Globe size={14} />, label: "캠핑장 웹사이트", value: camp.homepage },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-foreground">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>편의시설</h2>
            <div className="flex flex-wrap gap-2">
              {(camp.facilities ?? []).map((f) => (
                <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm">
                  <CheckCircle size={12} /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Weather preview */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>날씨 미리보기</h2>
            <p className="text-muted-foreground text-sm mb-4">체크인·체크아웃 날짜를 선택하면 예상 날씨를 볼 수 있어요</p>
            {weatherDays.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weatherDays.map((w) => (
                  <div key={w.date} className="bg-muted rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{w.date.slice(5)}</p>
                    {/* 백엔드는 이모지가 아니라 OpenWeatherMap 아이콘 코드("04d")를 준다. */}
                    <p className="text-2xl mb-1">{getWeatherEmoji(w.icon)}</p>
                    <p className="font-bold text-sm" style={{ fontFamily: "'DM Mono', monospace" }}>
                      {w.temp !== null ? `${Math.round(w.temp)}°C` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{w.condition ?? "-"}</p>
                    {w.humidity !== null && (
                      <p className="text-xs text-muted-foreground">습도 {w.humidity}%</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // 빈 배열은 두 가지 의미다: 날짜 미선택 / 예보 범위(5일) 밖.
              // 날짜를 골랐는데 "날짜를 선택해주세요"가 뜨면 사용자가 혼란스럽다.
              <p className="text-sm text-muted-foreground py-4 text-center bg-muted rounded-xl">
                {!checkIn || !checkOut
                  ? "오른쪽에서 체크인·체크아웃 날짜를 선택해주세요"
                  : "날씨 예보는 5일 이내 일정부터 제공됩니다"}
              </p>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>이용 후기</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={Number(avgRating)} />
                  <span className="text-accent font-bold" style={{ fontFamily: "'DM Mono', monospace" }}>{avgRating}</span>
                  <span className="text-muted-foreground text-xs">({campReviews.length}개)</span>
                </div>
              </div>
              <button
                onClick={() => { if (!user) { onLoginRequest(); return; } setShowForm((v) => !v); setEditId(null); setNewReview({ rating: 5, content: "", images: [] }); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-all"
              >
                <Plus size={14} /> 후기 작성
              </button>
            </div>

            {/* Review form */}
            {showForm && user && (
              <div className="bg-muted rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium">평점</span>
                  <StarRow rating={newReview.rating} size={20} interactive onChange={(r) => setNewReview((f) => ({ ...f, rating: r }))} />
                </div>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview((f) => ({ ...f, content: e.target.value }))}
                  placeholder="솔직한 후기를 남겨주세요..."
                  rows={4}
                  className="w-full bg-card rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
                />

                {/* Photo upload */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {newReview.images.map((url) => (
                    <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={url} alt="첨부 사진" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeReviewImage(url)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {newReview.images.length < MAX_REVIEW_IMAGES && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all flex-shrink-0"
                    >
                      <Camera size={16} />
                      <span className="text-[10px] mt-0.5">{newReview.images.length}/{MAX_REVIEW_IMAGES}</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={addReviewImages}
                  />
                </div>

                <div className="flex justify-end gap-2 mt-3">
                  <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground">취소</button>
                  <button onClick={submitReview} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                    {editId !== null ? "수정 완료" : "후기 등록"}
                  </button>
                </div>
              </div>
            )}

            {/* Review list */}
            <div className="space-y-4">
              {campReviews.map((review) => (
                <div key={review.id} className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-xs font-bold text-primary-foreground">
                      {review.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{review.author}</span>
                        <StarRow rating={review.rating} size={11} />
                      </div>
                      <div className="text-xs text-muted-foreground">{review.date}</div>
                    </div>
                    {user && review.author === user.nickname && (
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(review)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-all">
                          <Edit3 size={12} className="text-muted-foreground" />
                        </button>
                        <button onClick={() => deleteReview(review.id)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-all">
                          <Trash2 size={12} className="text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-3">{review.content}</p>

                  {review.images.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {review.images.map((src, i) => (
                        <img key={i} src={src} alt="후기 사진" className="h-24 w-24 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    <button
                      onClick={() => setLikedReviews((prev) => { const n = new Set(prev); n.has(review.id) ? n.delete(review.id) : n.add(review.id); return n; })}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Heart size={12} className={likedReviews.has(review.id) ? "fill-primary text-primary" : ""} />
                      도움돼요 {review.likes + (likedReviews.has(review.id) ? 1 : 0)}
                    </button>
                    <button
                      onClick={() => onReviewClick(review)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      댓글 {review.comments.length}개 보기 →
                    </button>
                  </div>
                </div>
              ))}
              {campReviews.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">아직 후기가 없습니다. 첫 후기를 남겨보세요!</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-20">
            <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'DM Mono', monospace" }}>
              ₩{(camp.price ?? 0).toLocaleString()}
            </div>
            <div className="text-muted-foreground text-sm mb-5">/ 1박 기준</div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                <Calendar size={14} className="text-primary" />
                <input
                  type="date"
                  min={tomorrow}
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                <Calendar size={14} className="text-primary" />
                <input
                  type="date"
                  min={minCheckOut}
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                <Users size={14} className="text-primary" />
                <span className="flex-1 text-sm">예약 명수</span>
                <button
                  type="button"
                  onClick={() => setGuestCount((n) => Math.max(1, n - 1))}
                  disabled={guestCount <= 1}
                  className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={12} />
                </button>
                <span className="w-6 text-center text-sm font-medium" style={{ fontFamily: "'DM Mono', monospace" }}>{guestCount}</span>
                <button
                  type="button"
                  onClick={() => setGuestCount((n) => n + 1)}
                  className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <button onClick={handleReserveClick} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all mb-2">
              예약하기
            </button>
            <button
              onClick={() => { if (!user) { onLoginRequest(); return; } toggleWish(campId!); }}
              className={`w-full py-2 rounded-xl border text-sm flex items-center justify-center gap-1 transition-all ${isWished(campId!) ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
            >
              <Heart size={14} className={isWished(campId!) ? "fill-primary" : ""} />
              {isWished(campId!) ? "찜 완료" : "찜하기"}
            </button>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Droplets size={12} className="text-chart-3" /> 샤워장 이용 무료</div>
              <div className="flex items-center gap-2"><Wind size={12} className="text-chart-3" /> 반려동물 동반 가능</div>
              <div className="flex items-center gap-2"><TreePine size={12} className="text-chart-3" /> 자연 속 힐링 보장</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
