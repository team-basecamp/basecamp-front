# BaseCamp Frontend

캠핑장 예약 플랫폼 프론트엔드

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite |
| 라우팅 | React Router DOM v7 |
| 서버 상태 | TanStack Query v5 |
| 클라이언트 상태 | Zustand |
| HTTP | Axios |
| 스타일 | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| 폼 | React Hook Form |
| 지도 | react-kakao-maps-sdk (카카오맵) |
| 결제 | PortOne Browser SDK |
| 차트 | Recharts (매출·리뷰 통계) |
| 아이콘·토스트·애니메이션 | lucide-react, sonner, motion |
| 유틸 | clsx + tailwind-merge, dayjs |

## 주요 기능

- **인증** — 이메일 로그인 + 소셜 로그인 3종(카카오·네이버·구글) OAuth. Access 토큰은 메모리(Zustand), Refresh 토큰은 HttpOnly 쿠키로 관리하며, 401/403(A007) 발생 시 토큰을 자동 재발급해 원요청을 재시도한다.
- **역할 기반 화면** — 고객 / 캠핑업체(CAMP_OWNER) / 관리자(ADMIN) 3개 그룹. JWT에서 role을 읽어 `RequireRole`이 하위 페이지 마운트를 제어한다.
- **캠핑장 탐색** — 목록·상세·지도(카카오맵)·리뷰, 지역/유형 필터, 날씨 조회, 찜(위시리스트).
- **예약·결제** — 예약 신청/내역, PortOne 연동 결제 및 결제 완료 확인(모바일 리다이렉트 대응).
- **커뮤니티** — 게시글 작성/수정/조회, 리뷰 작성.
- **마이페이지** — 프로필 수정, 내 게시글·리뷰·찜, 캠핑업체 신청, 회원 탈퇴.
- **캠핑업체 전용** — 캠핑장 등록/수정, 예약 관리, 리뷰·매출 통계.
- **관리자 전용** — 회원 관리, 캠핑업체 신청 승인, 블랙리스트, 신고 관리.
- **알림** — 헤더 벨의 안 읽은 개수와 알림 페이지가 전역 스토어로 동기화된다.
- **이미지** — 백엔드(MinIO) 업로드/조회 연동.

## 로컬 실행

### 요구사항
- Node.js 20+
- 백엔드 서버(Spring Boot, `http://localhost:8080`) 실행 중

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/team-basecamp/basecamp-front.git
cd basecamp-front

# 의존성 설치
npm install

# 환경변수 설정 (아래 "환경변수" 표 참고)
# 프로젝트 루트에 .env.local 파일을 만들고 실제 키 값을 입력

# 개발 서버 실행 (http://localhost:3000)
npm run dev
```

### 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 실행 (http://localhost:3000) |
| `npm run build` | 프로덕션 빌드 |
| `npm run typecheck` | 타입 검사 (`tsc --noEmit`) |

## 환경변수

`.env.local` 파일에 아래 변수를 정의한다.

| 변수명 | 설명 |
|--------|------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 (기본: `/api`, 프록시 경유). 이미지 URL도 이 값을 기준으로 조합한다. |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript API 키 |
| `VITE_KAKAO_LOGIN_KEY` | 카카오 소셜 로그인 REST API 키 |
| `VITE_KAKAO_REDIRECT_URI` | 카카오 로그인 리다이렉트 URI |
| `VITE_GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID |
| `VITE_GOOGLE_REDIRECT_URI` | 구글 로그인 리다이렉트 URI |
| `VITE_NAVER_CLIENT_ID` | 네이버 OAuth 클라이언트 ID |
| `VITE_NAVER_REDIRECT_URI` | 네이버 로그인 리다이렉트 URI |

## 프로젝트 구조

```
src/
├── api/                  # Axios 호출 함수 (도메인별 파일 분리)
│   ├── instance.ts        # Axios 인스턴스 (baseURL, 응답 봉투 언래핑, 토큰 재발급 인터셉터)
│   ├── auth.ts            # 로그인·소셜 로그인·토큰
│   ├── member.ts          # 회원/프로필
│   ├── campsite.ts        # 캠핑장
│   ├── reservation.ts     # 예약
│   ├── payment.ts         # 결제 (PortOne)
│   ├── post.ts            # 게시글
│   ├── review.ts          # 리뷰
│   ├── notification.ts    # 알림
│   ├── weather.ts         # 날씨
│   ├── campOwner.ts       # 캠핑업체 신청/캠핑장 관리
│   ├── page.ts            # 공통 페이지네이션 타입/유틸
│   ├── admin.ts           # 관리자 (회원·블랙리스트·신고·업체승인)
│   └── adminPost.ts       # 관리자 게시글 처리
├── components/
│   ├── layout/            # Header, Footer, Layout
│   └── common/            # CampCard, StarRow, RequireRole, RequireLogin,
│                          #   ImageWithFallback, shadcn/ui 등 공용 컴포넌트
├── data/                  # 목업 데이터 (camps 등, 일부 화면에서 사용)
├── hooks/                 # 커스텀 훅 (useRole, useLogout, useWishlist, useIsMobile)
├── imports/               # Figma 등 외부 임포트 리소스 + API 명세 문서
├── lib/
│   ├── cn.ts               # clsx + tailwind-merge 유틸
│   ├── jwt.ts              # JWT 디코드 (role 추출)
│   ├── apiError.ts         # API 에러 메시지 매핑
│   ├── camp.ts             # 캠핑장 데이터 가공
│   ├── imageUrl.ts         # 이미지 URL 조합 (MinIO/백엔드)
│   ├── portone.ts          # PortOne 결제 헬퍼
│   └── weatherIcon.ts      # 날씨 코드 → 아이콘 매핑
├── pages/                 # 화면별 페이지 컴포넌트
│   ├── HomePage            # 랜딩 페이지
│   ├── auth/               # 로그인 + 소셜 OAuth 콜백
│   ├── map/                # 지도
│   ├── campsite/           # 캠핑장 목록·상세·리뷰
│   ├── reservation/        # 예약 신청·내역
│   ├── payment/            # 결제·결제 완료
│   ├── post/               # 게시글
│   ├── mypage/             # 마이페이지·프로필·찜·리뷰·업체신청·탈퇴
│   ├── notification/       # 알림
│   ├── business/           # 캠핑업체 전용 (캠핑장·예약·리뷰·매출)
│   └── admin/              # 관리자 전용 (회원·업체승인·블랙리스트·신고)
├── router/
│   └── index.tsx           # 라우트 정의
├── store/                 # Zustand 스토어
│   ├── authStore.ts
│   ├── notificationStore.ts
│   └── reservationStore.ts
├── styles/                # 전역 스타일 (globals, tailwind, theme, fonts)
├── types/                 # 공통 타입 정의
├── App.tsx                # RouterProvider
├── main.tsx               # 엔트리 포인트 (QueryClientProvider)
└── vite-env.d.ts
```

> 대부분의 화면은 백엔드 API와 TanStack Query로 연동되어 동작한다.
> 캠핑장 목록·상세·지도·리뷰 화면은 일부 `data/camps` 목업 데이터를 사용하며, 백엔드 캠핑장 API 연동 시 교체 예정이다.

## API 프록시

개발 중 CORS 우회를 위해 Vite 프록시 설정이 되어 있습니다.
`/api/*` 요청은 자동으로 `http://localhost:8080`으로 전달됩니다.
Refresh 토큰이 HttpOnly 쿠키로 오가므로, Axios 인스턴스는 `withCredentials: true`로 요청합니다.

## 역할별 라우트

| 역할 | 경로 |
|------|------|
| 인증 | `/login`, `/oauth/kakao/callback`, `/oauth/naver/callback`, `/oauth/google/callback` |
| 고객 | `/`, `/map`, `/campsites`, `/campsites/:contentId`, `/campsites/:campsiteId/reservation`, `/reservations`, `/payment`, `/payment/complete`, `/reviews`, `/posts`, `/posts/new`, `/posts/:postId`, `/posts/:postId/edit`, `/mypage`, `/mypage/profile`, `/mypage/wishlist`, `/mypage/posts`, `/mypage/reviews`, `/mypage/withdraw`, `/mypage/camp-owner`, `/notifications` |
| 캠핑업체 (CAMP_OWNER) | `/business/campsites`, `/business/campsites/new`, `/business/campsites/:contentId/edit`, `/business/reservations`, `/business/reviews`, `/business/sales` |
| 관리자 (ADMIN) | `/admin/members`, `/admin/camp-owner`, `/admin/blacklist`, `/admin/reports` |
