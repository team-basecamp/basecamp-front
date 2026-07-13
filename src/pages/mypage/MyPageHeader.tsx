import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Calendar, Heart, FileText, LogOut, Pencil } from "lucide-react";
import { POSTS } from "../../data/posts";
import useLogout from "../../hooks/useLogout";
import useAuthStore from "../../store/authStore";
import useNotificationStore from "../../store/notificationStore";
import useReservationStore from "../../store/reservationStore";
import useWishlistStore from "../../store/wishlistStore";

/**
 * 마이페이지 공용 헤더 (프로필 카드 + 탭 네비게이션)
 * - MyPage, WishlistPage, MyPostsPage, NotificationPage 등 마이페이지 하위 화면들이 공통으로 사용
 * - active prop으로 현재 탭을 표시하고, 탭 클릭 시 TAB_ROUTES 매핑에 따라 각 페이지로 이동
 */
export type MyTab = "reservations" | "wishlist" | "posts" | "notifications";

const TAB_ROUTES: Record<MyTab, string> = {
  reservations: "/reservations",
  wishlist: "/mypage/wishlist",
  posts: "/mypage/posts",
  notifications: "/notifications",
};

export default function MyPageHeader({ active }: { active: MyTab }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  // reservationStore/wishlistStore(zustand)를 사용해 다른 페이지로 이동해도(예: 예약내역 -> 마이페이지) 예약/찜 개수가 그대로 유지되도록 함
  const reservations = useReservationStore((s) => s.reservations);
  const wishedIds = useWishlistStore((s) => s.wishedIds);

  const myPosts = POSTS.filter((p) => p.writer === user?.nickname);

  const TABS: { key: MyTab; label: string; icon: ReactNode; badge?: number }[] = [
    { key: "reservations", label: "예약 내역", icon: <Calendar size={15} />, badge: reservations.filter((r) => r.status === "PENDING").length },
    { key: "wishlist", label: "찜한 캠핑장", icon: <Heart size={15} /> },
    { key: "posts", label: "내 게시글", icon: <FileText size={15} /> },
    { key: "notifications", label: "알림", icon: <Bell size={15} />, badge: unreadCount },
  ];

  if (!user) return null;

  return (
    <>
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-white">
          {user.nickname[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{user.nickname}</div>
          <div className="text-sm text-muted-foreground mt-0.5">{user.email ?? `${user.nickname.toLowerCase().replace(/\s/g, "")}@email.com`}</div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>예약 {reservations.length}건</span>
            <span>찜 {wishedIds.size}개</span>
            <span>게시글 {myPosts.length}개</span>
          </div>
        </div>
      </div>

      {/* Account actions */}
      <div className="flex items-center justify-end gap-4 mb-4 -mt-2 px-1">
        <button
          onClick={() => navigate("/mypage/profile")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil size={12} /> 정보 수정
        </button>
        <button
          onClick={() => void logout()}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut size={12} /> 로그아웃
        </button>
        <button
          onClick={() => navigate("/mypage/withdraw")}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          회원 탈퇴
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon, badge }) => (
          <button
            key={key}
            onClick={() => navigate(TAB_ROUTES[key])}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all relative ${
              active === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
            {badge ? (
              <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center">{badge}</span>
            ) : null}
          </button>
        ))}
      </div>
    </>
  );
}
