import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Heart,
  Phone,
  Globe,
  Users,
  CheckCircle,
  Droplets,
  Wind,
  TreePine,
  Calendar,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Camera,
  X,
  Check,
} from "lucide-react";
import StarRow from "../../components/common/StarRow";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
} from "../../components/common/alert-dialog";
import { CAMPS } from "../../data/camps";
import { weatherEmoji } from "../../lib/weatherIcon";
import { getCampsiteDetail, getCampsiteWeather } from "../../api/campsite";
import * as reviewApi from "../../api/review";
import useAuthStore from "../../store/authStore";
import { useWishlist } from "../../hooks/useWishlist";
import { campKey } from "../../lib/camp";
import type { Camp, Review, WeatherDay } from "../../types";
import type { ReviewResponse } from "../../api/review";
import * as reservationApi from "../../api/reservation";

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
 * 백엔드 ReviewResponse → 화면용 Review 어댑터.
 * - images 에는 서버가 준 **상대경로**(/images/abc.jpg)를 그대로 담는다. 절대 URL로 바꾸지 않는 이유는
 *   수정 시 keepImageUrls 로 이 값을 그대로 돌려보내야 하기 때문이다(가공하면 서버가 400으로 막는다).
 *   화면에 그릴 때만 reviewApi.toImageSrc() 로 감싼다.
 * - userId 는 소유권 판별용으로 실어둔다. (Review 타입에 userId?: number 추가 필요)
 */
const toReview = (r: ReviewResponse): Review => ({
  id: r.reviewId,
  campId: r.campId,
  userId: r.userId,
  author: r.nickname,
  avatar: r.nickname?.[0] ?? "?",
  rating: r.rating,
  date: (r.createdAt ?? "").slice(0, 10),
  content: r.content,
  images: r.imageUrls ?? [],
});

/**
 * 리뷰 폼이 들고 있는 이미지 한 장.
 * 서버에 이미 있는 것과 이번에 새로 고른 파일은 전송 방식이 달라 반드시 구분해야 한다.
 * - existing : 서버 상대경로. 수정 요청의 keepImageUrls 로 나간다.
 * - new      : 실제 File. multipart 의 images 파트로 나간다. previewUrl 은 미리보기 전용 blob URL.
 */
type ReviewImageItem =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; previewUrl: string };

/** 미리보기에 쓸 src. 기존 이미지는 절대 URL로, 새 파일은 blob URL 그대로. */
const previewSrcOf = (item: ReviewImageItem): string =>
  item.kind === "existing" ? reviewApi.toImageSrc(item.url) : item.previewUrl;

/**
 * 캠핑장 상세 페이지 (/campsites/:contentId)
 * - 캠핑장 소개/편의시설/날씨 미리보기/찜하기/리뷰(작성·수정·삭제)를 한 화면에서 처리
 * - 리뷰는 백엔드 API(api/review.ts)와 연동 (목록 조회 / 작성 / 수정 / 삭제)
 * - 이미지 첨부는 UI만 유지하며 서버 저장은 미구현 (차후 구현 예정)
 * - 찜 상태는 hooks/useWishlist(서버 상태)로 관리되어 캠핑장 목록/찜 목록 화면과 동기화됨
 */
export default function CampsiteDetailPage() {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { isWished, toggleWish, isPending: wishPending } = useWishlist();

  const [camp, setCamp] = useState<Camp | undefined>(
    CAMPS.find((c) => (c.campId ?? c.contentId) === Number(contentId)),
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
        if (
          fetched &&
          key != null &&
          !CAMPS.some((c) => (c.campId ?? c.contentId) === key)
        ) {
          CAMPS.push({ ...fetched, contentId: key });
        }
      })
      .catch(() => {
        if (!cancelled)
          setCamp(
            CAMPS.find((c) => (c.campId ?? c.contentId) === Number(contentId)),
          );
      })
      .finally(() => {
        if (!cancelled) setCampLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  const [campReviews, setCampReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState<{
    rating: number;
    content: string;
    images: ReviewImageItem[];
  }>({
    rating: 5,
    content: "",
    images: [],
  });
  const [editId, setEditId] = useState<number | null>(null); // 현재 수정 중인 리뷰 id (null이면 신규 작성)
  const [alertMessage, setAlertMessage] = useState<string | null>(null); // window.alert 대체용 안내 메시지

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [weatherDays, setWeatherDays] = useState<WeatherDay[]>([]);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_REVIEW_IMAGES = 5;

  // 리뷰 목록 조회 키: 백엔드 내부 campId 우선, 없으면 라우팅 contentId
  const campId = camp?.campId ?? (contentId ? Number(contentId) : undefined);

  // 작성용 예약 id: 리뷰는 "체크아웃한 예약"에만 달 수 있어, 예약 완료/내역 화면에서 navigate state로 전달된다.
  const [reviewReservationId, setReviewReservationId] = useState<number | null>(
    (location.state as { reservationId?: number } | null)?.reservationId ??
      null,
  );

  // 캠핑장 리뷰 목록 로드 (백엔드가 최신순 정렬해 반환)
  const loadReviews = useCallback(async () => {
    if (campId == null) return;
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getReviews(campId);
      setCampReviews(data.map(toReview));
    } catch {
      setCampReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [campId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // 다른 화면(예약 목록 등)에서 특정 예약의 "리뷰 작성하기"를 눌러 navigate state로 reservationId가
  // 온 경우, 추측하지 않고 그 예약을 그대로 작성 대상으로 쓴다. location.key가 매 navigate마다
  // 새로 생기므로, 같은 캠핑장으로 다시 이동해 리마운트가 안 일어나도 이 effect는 다시 돈다.
  // (예전엔 deps가 []라 최초 1회만 실행돼, 두 번째 리뷰부터는 이 state가 무시되고 있었다)
  useEffect(() => {
    const state = location.state as
      | { openReviewForm?: boolean; reservationId?: number }
      | null;
    if (!state) return;

    if (state.openReviewForm && user) {
      setShowForm(true);
    }
    if (state.reservationId != null) {
      setReviewReservationId(state.reservationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, user]);

  // 리뷰 작성 대상이 명시적으로 지정되지 않은 경우에만, 이 캠핑장에 대해 아직 리뷰를 안 쓴
  // 체크아웃 완료 예약을 목록에서 추측한다. hasReview를 그대로 신뢰하므로 /v1/reviews/me를
  // 별도로 불러 교차비교할 필요가 없다.
  useEffect(() => {
    if (!user || campId == null) return;
    const state = location.state as { reservationId?: number } | null;
    if (state?.reservationId != null) return;
    if (reviewReservationId != null) return;

    let cancelled = false;
    (async () => {
      try {
        const today = toDateStr(new Date());
        const page = await reservationApi.getMyReservations({ size: 100 });
        const writable = page.content
          .filter(
            (r) =>
              r.campId === campId &&
              r.status === "RESERVED" &&
              r.checkOutDate < today &&
              !r.hasReview,
          )
          .sort((a, b) => b.checkOutDate.localeCompare(a.checkOutDate));

        if (!cancelled) setReviewReservationId(writable[0]?.id ?? null);
      } catch {
        if (!cancelled) setReviewReservationId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, campId, reviewReservationId, location.key]);

  /**
   * 예약 기간의 실제 날씨를 백엔드에서 받아온다(OpenWeatherMap 5일 예보 기반).
   *
   * 훅이라 `if (!camp)` 조기 반환보다 위에 있어야 한다. 그래서 camp 유무는 훅 안에서 가린다.
   * 날짜를 아직 안 골랐으면 호출할 것이 없으므로 결과를 비우고 끝낸다.
   *
   * 실패해도 에러를 띄우지 않는다. 날씨는 예약 판단을 돕는 부가 정보일 뿐이라, 외부 API 장애가
   * 상세페이지에 에러 배너를 띄우면 안 된다(백엔드 WeatherClient 의 fail-soft 정책과 같은 결).
   */
  useEffect(() => {
    if (!camp || !checkIn || !checkOut) {
      setWeatherDays([]);
      return;
    }

    let active = true;
    setWeatherLoading(true);

    getCampsiteWeather(camp.campId, checkIn, checkOut)
      .then((res) => {
        if (active) setWeatherDays(res.weather ?? []);
      })
      .catch(() => {
        if (active) setWeatherDays([]);
      })
      .finally(() => {
        if (active) setWeatherLoading(false);
      });

    // 날짜를 빠르게 바꾸면 이전 요청이 나중에 도착해 최신 결과를 덮어쓸 수 있다. 정리된 요청은 무시한다.
    return () => {
      active = false;
    };
  }, [camp, checkIn, checkOut]);

  if (!camp) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-6">
          {campLoading
            ? "캠핑장 정보를 불러오는 중..."
            : "캠핑장을 찾을 수 없습니다"}
        </p>
        {!campLoading && (
          <button
            onClick={() => navigate("/campsites")}
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-all"
          >
            목록으로
          </button>
        )}
      </div>
    );
  }

  // 백엔드 @Future 검증 때문에 오늘은 선택 불가
  const tomorrow = addDay(toDateStr(new Date()));
  const minCheckOut = checkIn ? addDay(checkIn) : addDay(tomorrow);

  const avgRating = campReviews.length
    ? (
        campReviews.reduce((s, r) => s + r.rating, 0) / campReviews.length
      ).toFixed(1)
    : "—";

  const onLoginRequest = () => navigate("/login");
  const onReserve = () =>
    navigate(`/campsites/${camp.campId ?? camp.contentId}/reservation`, {
      state: { checkIn, checkOut, guestCount },
    });

  // 신규 작성/수정을 하나의 폼으로 처리: editId가 있으면 update, 없으면 create.
  // 저장 후에는 서버 목록을 다시 불러와 id·작성자·시간 등 확정값으로 재동기화한다.
  // 폼을 비우면서 새 파일 미리보기로 만든 blob URL을 해제한다.
  // (revoke 하지 않으면 페이지를 벗어날 때까지 브라우저가 파일을 메모리에 붙들고 있는다)
  const resetReviewForm = () => {
    setNewReview((f) => {
      f.images.forEach((item) => {
        if (item.kind === "new") URL.revokeObjectURL(item.previewUrl);
      });
      return { rating: 5, content: "", images: [] };
    });
  };

  const submitReview = async () => {
    if (!newReview.content.trim() || submitting) return;
    setSubmitting(true);
    try {
      // 새로 고른 파일만 multipart 파트로 올린다.
      const files = newReview.images
        .filter((i): i is Extract<ReviewImageItem, { kind: "new" }> => i.kind === "new")
        .map((i) => i.file);

      if (editId !== null) {
        const keepImageUrls = newReview.images
          .filter((i): i is Extract<ReviewImageItem, { kind: "existing" }> => i.kind === "existing")
          .map((i) => i.url);

        await reviewApi.updateReview(
          editId,
          { rating: newReview.rating, content: newReview.content, keepImageUrls },
          files,
        );
      } else {
        if (reviewReservationId == null) {
          setAlertMessage("후기는 이용을 마친 예약 내역에서 작성할 수 있어요.");
          return;
        }
        await reviewApi.createReview(
          reviewReservationId,
          { rating: newReview.rating, content: newReview.content },
          files,
        );
        // 방금 쓴 예약은 이제 hasReview=true가 됐으니, 추측 effect가 다음 미작성 예약을
        // 새로 찾도록 리셋한다. 이걸 안 하면 같은 reservationId에 계속 고정돼 재제출 시 409가 난다.
        setReviewReservationId(null);
      }
      await loadReviews();
      setEditId(null);
      resetReviewForm();
      setShowForm(false);
    } catch {
      setAlertMessage("후기 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm("이 후기를 삭제할까요?")) return;
    try {
      await reviewApi.deleteReview(id);
      setCampReviews((prev) => prev.filter((r) => r.id !== id)); // 204 응답이라 낙관적으로 목록에서 제거
    } catch {
      setAlertMessage("삭제에 실패했어요.");
    }
  };

  const startEdit = (r: Review) => {
    // r.images 는 서버 상대경로다. 전부 "기존 이미지"로 폼에 올려두고,
    // 사용자가 지운 것만 keepImageUrls 에서 빠지게 한다.
    setNewReview({
      rating: r.rating,
      content: r.content,
      images: r.images.map((url) => ({ kind: "existing" as const, url })),
    });
    setEditId(r.id);
    setShowForm(true);
  };

  const addReviewImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = MAX_REVIEW_IMAGES - newReview.images.length;
    // 업로드는 File 객체가 있어야 하므로 미리보기 URL만 만들고 파일을 버리면 안 된다. 둘 다 들고 간다.
    const added: ReviewImageItem[] = files.slice(0, remaining).map((file) => ({
      kind: "new" as const,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setNewReview((f) => ({ ...f, images: [...f.images, ...added] }));
    e.target.value = "";
  };

  // 목록에서 같은 파일을 두 번 고를 수 있어 URL이 아닌 인덱스로 지운다.
  const removeReviewImage = (index: number) => {
    setNewReview((f) => {
      const target = f.images[index];
      if (target?.kind === "new") URL.revokeObjectURL(target.previewUrl);
      return { ...f, images: f.images.filter((_, i) => i !== index) };
    });
  };

  // 로그인 여부에 따라 예약 진행 or 로그인 유도 분기
  const handleReserveClick = () => {
    if (!user) onLoginRequest();
    else onReserve();
  };

  // 리뷰 소유권(수정/삭제 버튼 노출)은 userId 우선 비교, 없으면 닉네임 폴백
  const isMyReview = (review: Review) =>
    !!user &&
    (review.userId != null
      ? review.userId === user.memberId
      : review.author === user.nickname);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => navigate("/campsites")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> 목록으로
      </button>

      {/* Hero image */}
      <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden mb-8 bg-muted">
        {camp.image || camp.firstImageUrl ? (
          <img
            src={camp.image || camp.firstImageUrl}
            alt={camp.facltNm}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center text-6xl">
            🏕️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-6 left-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {(camp.tags ?? []).map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white text-xs"
              >
                {t}
              </span>
            ))}
          </div>
          <h1
            className="text-3xl font-bold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
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
            <h2
              className="font-bold text-lg mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              캠핑장 소개
            </h2>
            {camp.lineIntro && (
              <p className="text-foreground text-sm font-medium mb-2">
                {camp.lineIntro}
              </p>
            )}
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              {camp.intro}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                {
                  icon: <Phone size={14} />,
                  label: "전화번호",
                  value: camp.tel,
                },
                {
                  icon: <Globe size={14} />,
                  label: "캠핑장 웹사이트",
                  value: camp.homepage,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 flex-shrink-0">
                    {item.icon}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="text-foreground">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2
              className="font-bold text-lg mb-4"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              편의시설
            </h2>
            <div className="flex flex-wrap gap-2">
              {(camp.facilities ?? []).map((f) => (
                <span
                  key={f}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                >
                  <CheckCircle size={12} /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Weather preview */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2
              className="font-bold text-lg mb-1"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              날씨 미리보기
            </h2>
            <p className="text-muted-foreground text-sm mb-4">
              체크인·체크아웃 날짜를 선택하면 예상 날씨를 볼 수 있어요
            </p>
            {weatherLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="bg-muted rounded-xl h-[116px] animate-pulse" />
                ))}
              </div>
            ) : weatherDays.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {weatherDays.map((w) => (
                  <div
                    key={w.date}
                    className="bg-muted rounded-xl p-3 text-center"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {w.date.slice(5)}
                    </p>
                    {/* icon 은 "04d" 같은 제공자 코드다. 그대로 찍으면 코드가 그대로 보인다. */}
                    <p className="text-2xl mb-1">{weatherEmoji(w.icon)}</p>
                    <p
                      className="font-bold text-sm"
                      style={{ fontFamily: "'DM Mono', monospace" }}
                    >
                      {w.temp != null ? `${Math.round(w.temp)}°C` : "–"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.condition ?? "정보 없음"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      습도 : {w.humidity != null ? `${w.humidity}%` : "–"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              /*
                결과가 비는 경우가 두 가지다. mock 을 쓸 때는 날짜만 고르면 항상 값이 나왔지만,
                실제 예보는 5일 범위 밖이면 그 날짜가 아예 담기지 않는다(WeatherService.getCampWeather).
                날짜를 이미 고른 사용자에게 "날짜를 선택해주세요"라고 하면 고장으로 읽히므로 문구를 나눈다.
              */
              <p className="text-sm text-muted-foreground py-4 text-center bg-muted rounded-xl">
                {checkIn && checkOut
                  ? "예보는 5일 이내만 제공돼요. 날짜가 가까워지면 다시 확인해주세요"
                  : "오른쪽에서 체크인·체크아웃 날짜를 선택해주세요"}
              </p>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="font-bold text-lg"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  이용 후기
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <StarRow rating={Number(avgRating)} />
                  <span
                    className="text-accent font-bold"
                    style={{ fontFamily: "'DM Mono', monospace" }}
                  >
                    {avgRating}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({campReviews.length}개)
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    onLoginRequest();
                    return;
                  }
                  setShowForm((v) => !v);
                  setEditId(null);
                  resetReviewForm();
                }}
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
                  <StarRow
                    rating={newReview.rating}
                    size={20}
                    interactive
                    onChange={(r) => setNewReview((f) => ({ ...f, rating: r }))}
                  />
                </div>
                <textarea
                  value={newReview.content}
                  onChange={(e) =>
                    setNewReview((f) => ({ ...f, content: e.target.value }))
                  }
                  placeholder="솔직한 후기를 남겨주세요..."
                  rows={4}
                  className="w-full bg-card rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground resize-none"
                />

                {/* Photo upload — 기존 이미지(서버 경로)와 새로 고른 파일(blob 미리보기)이 함께 놓인다 */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {newReview.images.map((item, index) => (
                    <div
                      key={item.kind === "existing" ? item.url : item.previewUrl}
                      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={previewSrcOf(item)}
                        alt="첨부 사진"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeReviewImage(index)}
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
                      <span className="text-[10px] mt-0.5">
                        {newReview.images.length}/{MAX_REVIEW_IMAGES}
                      </span>
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
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground"
                  >
                    취소
                  </button>
                  <button
                    onClick={submitReview}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? "저장 중..."
                      : editId !== null
                        ? "수정 완료"
                        : "후기 등록"}
                  </button>
                </div>
              </div>
            )}

            {/* Review list */}
            <div className="space-y-4">
              {reviewsLoading ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  후기를 불러오는 중...
                </p>
              ) : (
                <>
                  {campReviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-t border-border pt-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-chart-3 flex items-center justify-center text-xs font-bold text-primary-foreground">
                          {review.avatar}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {review.author}
                            </span>
                            <StarRow rating={review.rating} size={11} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {review.date}
                          </div>
                        </div>
                        {isMyReview(review) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEdit(review)}
                              className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-all"
                            >
                              <Edit3
                                size={12}
                                className="text-muted-foreground"
                              />
                            </button>
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center hover:bg-destructive/20 transition-all"
                            >
                              <Trash2 size={12} className="text-destructive" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-3">
                        {review.content}
                      </p>

                      {review.images.length > 0 && (
                        <div className="flex gap-2 mb-2 flex-wrap">
                          {review.images.map((src, i) => (
                            <img
                              key={i}
                              // review.images 는 서버 상대경로라 그대로 쓰면 프론트 오리진(3000)으로 요청이 가 404다.
                              src={reviewApi.toImageSrc(src)}
                              alt="후기 사진"
                              className="h-24 w-24 rounded-lg object-cover"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {campReviews.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      아직 후기가 없습니다. 첫 후기를 남겨보세요!
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-20">
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
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
                <span
                  className="w-6 text-center text-sm font-medium"
                  style={{ fontFamily: "'DM Mono', monospace" }}
                >
                  {guestCount}
                </span>
                <button
                  type="button"
                  onClick={() => setGuestCount((n) => n + 1)}
                  className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <button
              onClick={handleReserveClick}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/80 transition-all mb-2"
            >
              예약하기
            </button>
            <button
              onClick={() => {
                if (!user) {
                  onLoginRequest();
                  return;
                }
                toggleWish(campKey(camp));
              }}
              disabled={wishPending}
              aria-pressed={isWished(campKey(camp))}
              className={`w-full py-2 rounded-xl border text-sm flex items-center justify-center gap-1 transition-all disabled:opacity-60 ${isWished(campKey(camp)) ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`}
            >
              <Heart
                size={14}
                className={isWished(campKey(camp)) ? "fill-primary" : ""}
              />
              {isWished(campKey(camp)) ? "찜 완료" : "찜하기"}
            </button>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Droplets size={12} className="text-chart-3" /> 샤워장 이용 무료
              </div>
              <div className="flex items-center gap-2">
                <Wind size={12} className="text-chart-3" /> 반려동물 동반 가능
              </div>
              <div className="flex items-center gap-2">
                <TreePine size={12} className="text-chart-3" /> 자연 속 힐링
                보장
              </div>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={alertMessage !== null} onOpenChange={(o) => !o && setAlertMessage(null)}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>알림</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="py-8 text-center space-y-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Check size={24} />
            </div>
            <AlertDialogDescription className="text-sm text-foreground">
              {alertMessage}
            </AlertDialogDescription>
            <AlertDialogAction>확인</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
