/**
 * 전체 라우트 정의 파일
 * - 화면을 고객(/), 캠핑업체(/business), 관리자(/admin) 3개 그룹으로 분리
 *   (같은 도메인 데이터라도 역할(Role)에 따라 보여줄 화면/메뉴가 완전히 달라서 그룹으로 나눔)
 * - 3개 그룹 모두 Layout(Header+Footer 공통 뼈대)으로 감싸서 children으로 렌더링됨 (Outlet 사용)
 * - /login 페이지만 로그인 화면 특성상 Header/Footer가 필요 없어서 Layout 없이 단독으로 둠
 */
import { createBrowserRouter } from "react-router-dom";
import Layout from "../components/layout/Layout";
import RequireRole from "../components/common/RequireRole";

import LoginPage from "../pages/auth/LoginPage";
import KakaoCallbackPage from "../pages/auth/KakaoCallbackPage";
import NaverCallbackPage from "../pages/auth/NaverCallbackPage";
import GoogleCallbackPage from "../pages/auth/GoogleCallbackPage";
import HomePage from "../pages/HomePage";
import MapPage from "../pages/map/MapPage";
import CampsiteListPage from "../pages/campsite/CampsiteListPage";
import CampsiteDetailPage from "../pages/campsite/CampsiteDetailPage";
import ReviewsPage from "../pages/campsite/ReviewsPage";
//import ReviewDetailPage from "../pages/campsite/ReviewDetailPage"; // 리뷰의 댓글 기능이 필요 없으므로 일단 주석 처리
import ReservationPage from "../pages/reservation/ReservationPage";
import ReservationHistoryPage from "../pages/reservation/ReservationHistoryPage";
import PaymentPage from "../pages/payment/PaymentPage";
import PostListPage from "../pages/post/PostListPage";
import PostDetailPage from "../pages/post/PostDetailPage";
import PostFormPage from "../pages/post/PostFormPage";
import MyPage from "../pages/mypage/MyPage";
import ProfileEditPage from "../pages/mypage/ProfileEditPage";
import WishlistPage from "../pages/mypage/WishlistPage";
import MyPostsPage from "../pages/mypage/MyPostsPage";
import MyReviewsPage from "../pages/mypage/MyReviewsPage";
import WithdrawPage from "../pages/mypage/WithdrawPage";
import CampOwnerApplyPage from "../pages/mypage/CampOwnerApplyPage";
import NotificationPage from "../pages/notification/NotificationPage";
import CampsiteManagePage from "../pages/business/CampsiteManagePage";
import CampsiteFormPage from "../pages/business/CampsiteFormPage";
import ReservationManagePage from "../pages/business/ReservationManagePage";
import ReviewStatPage from "../pages/business/ReviewStatPage";
import SalesStatPage from "../pages/business/SalesStatPage";
import MemberManagePage from "../pages/admin/MemberManagePage";
import CampOwnerApplicationsPage from "../pages/admin/CampOwnerApplicationsPage";
import BlacklistPage from "../pages/admin/BlacklistPage";
import ReportListPage from "../pages/admin/ReportListPage";

const router = createBrowserRouter([
  // 로그인 / 소셜 콜백 (레이아웃 없음)
  { path: "/login", element: <LoginPage /> },
  { path: "/oauth/kakao/callback", element: <KakaoCallbackPage /> },
  { path: "/oauth/naver/callback", element: <NaverCallbackPage /> },
  { path: "/oauth/google/callback", element: <GoogleCallbackPage /> },

  // 고객 화면
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "map", element: <MapPage /> },
      { path: "campsites", element: <CampsiteListPage /> },
      { path: "campsites/:contentId", element: <CampsiteDetailPage /> },
      {
        path: "campsites/:campsiteId/reservation",
        element: <ReservationPage />,
      },
      { path: "reservations", element: <ReservationHistoryPage /> },
      { path: "payment", element: <PaymentPage /> },
      { path: "reviews", element: <ReviewsPage /> },
      //{ path: "reviews/:reviewId", element: <ReviewDetailPage /> },
      { path: "posts", element: <PostListPage /> },
      { path: "posts/new", element: <PostFormPage /> },
      { path: "posts/:postId", element: <PostDetailPage /> },
      { path: "posts/:postId/edit", element: <PostFormPage /> },
      { path: "mypage", element: <MyPage /> },
      { path: "mypage/profile", element: <ProfileEditPage /> },
      { path: "mypage/wishlist", element: <WishlistPage /> },
      { path: "mypage/posts", element: <MyPostsPage /> },
      { path: "mypage/reviews", element: <MyReviewsPage /> },
      { path: "mypage/withdraw", element: <WithdrawPage /> },
      { path: "mypage/camp-owner", element: <CampOwnerApplyPage /> },
      { path: "notifications", element: <NotificationPage /> },
    ],
  },

  // 캠핑업체 화면 (CAMP_OWNER 전용 — RequireRole 이 하위 페이지 마운트를 막는다)
  {
    path: "/business",
    element: <Layout />,
    children: [
      {
        element: <RequireRole allow={["CAMP_OWNER"]} />,
        children: [
          { path: "campsites", element: <CampsiteManagePage /> },
          { path: "campsites/new", element: <CampsiteFormPage /> },
          { path: "campsites/:contentId/edit", element: <CampsiteFormPage /> },
          { path: "reservations", element: <ReservationManagePage /> },
          { path: "reviews", element: <ReviewStatPage /> },
          { path: "sales", element: <SalesStatPage /> },
        ],
      },
    ],
  },

  // 관리자 화면 (ADMIN 전용)
  {
    path: "/admin",
    element: <Layout />,
    children: [
      {
        element: <RequireRole allow={["ADMIN"]} />,
        children: [
          { path: "members", element: <MemberManagePage /> },
          { path: "camp-owner", element: <CampOwnerApplicationsPage /> },
          { path: "blacklist", element: <BlacklistPage /> },
          { path: "reports", element: <ReportListPage /> },
        ],
      },
    ],
  },
]);

export default router;
