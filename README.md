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
| 스타일 | Tailwind CSS v4 + shadcn/ui |
| 폼 | React Hook Form |
| 유틸 | clsx + tailwind-merge, dayjs |

## 로컬 실행

### 요구사항
- Node.js 20+

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/team-basecamp/basecamp-front.git
cd basecamp-front

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 실제 키 값 입력

# 개발 서버 실행 (http://localhost:3000)
npm run dev
```

## 환경변수

| 변수명 | 설명 |
|--------|------|
| `VITE_API_BASE_URL` | 백엔드 API 주소 (기본: `/api/v1`, 프록시 경유) |
| `VITE_KAKAO_MAP_KEY` | 카카오맵 TypeScript API 키 |
| `VITE_KAKAO_LOGIN_KEY` | 카카오 소셜 로그인 REST API 키 |
| `VITE_GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID |
| `VITE_NAVER_CLIENT_ID` | 네이버 OAuth 클라이언트 ID |

## 프로젝트 구조

```
src/
├── api/                 # Axios 호출 함수 (도메인별 파일 분리)
│   ├── instance.ts       # Axios 인스턴스 (baseURL, 인터셉터)
│   ├── auth.ts
│   ├── member.ts
│   ├── campsite.ts
│   ├── reservation.ts
│   ├── payment.ts
│   ├── post.ts
│   ├── review.ts
│   └── admin.ts
├── components/
│   ├── layout/           # Header, Footer, Layout
│   └── common/            # CampCard, StarRow, ReservationCard, shadcn/ui 등 공용 컴포넌트
├── data/                  # 목업 데이터 (camps, posts, reviews, user, admin)
├── hooks/                 # 커스텀 훅
├── imports/                # Figma 등 외부 임포트 리소스
├── lib/
│   └── cn.ts               # clsx + tailwind-merge 유틸
├── pages/                  # 화면별 페이지 컴포넌트
│   ├── HomePage             # 랜딩 페이지
│   ├── auth/                # 로그인
│   ├── map/                 # 지도
│   ├── campsite/            # 캠핑장 목록·상세·리뷰
│   ├── reservation/         # 예약 신청·내역
│   ├── payment/             # 결제
│   ├── post/                # 게시글
│   ├── mypage/               # 마이페이지·찜 목록
│   ├── notification/         # 알림
│   ├── business/              # 캠핑업체 전용
│   └── admin/                 # 관리자 전용
├── router/
│   └── index.tsx              # 라우트 정의
├── store/                      # Zustand 스토어
│   ├── authStore.ts
│   └── notificationStore.ts
├── styles/                      # 전역 스타일 (globals, tailwind, theme, fonts)
├── types/                        # 공통 타입 정의
├── App.tsx                        # RouterProvider
├── main.tsx                        # 엔트리 포인트 (QueryClientProvider)
└── vite-env.d.ts
```

> 현재 화면은 `data/`의 목업 데이터로 동작
> `api/`의 Axios 함수는 백엔드 명세(`src/imports/pasted_text/api-endpoints.md`)에 맞춰 준비되어 있으므로,
> 백엔드 연동 시 각 페이지에서 목업 배열 대신 TanStack Query로 교체하면 됩니다.

## API 프록시

개발 중 CORS 우회를 위해 Vite 프록시 설정이 되어 있습니다.
`/api/*` 요청은 자동으로 `http://localhost:8080`으로 전달됩니다.

## 역할별 라우트

| 역할 | 경로 |
|------|------|
| 고객 | `/`, `/map`, `/campsites`, `/campsites/:contentId`, `/campsites/:campsiteId/reservation`, `/reservations`, `/payment`, `/reviews`, `/reviews/:reviewId`, `/posts`, `/posts/new`, `/posts/:postId`, `/posts/:postId/edit`, `/mypage`, `/mypage/wishlist`, `/mypage/posts`, `/mypage/withdraw`, `/notifications`, `/login` |
| 캠핑업체 | `/business/campsites`, `/business/reservations`, `/business/reviews`, `/business/sales` |
| 관리자 | `/admin/members`, `/admin/blacklist`, `/admin/reports` |

