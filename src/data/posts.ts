import type { Post, PostComment } from "../types";

/**
 * 커뮤니티 게시글 mock 데이터.
 * - POSTS: pages/post/PostListPage, PostDetailPage, PostFormPage, pages/mypage/MyPostsPage,
 *   MyPageHeader 등에서 사용.
 * - 주의: 이 배열은 컴포넌트에서 직접 mutate됨 (PostFormPage.tsx의 POSTS.unshift로 글 등록,
 *   PostDetailPage.tsx/MyPostsPage.tsx의 POSTS.splice로 글 삭제). 실제 서버 상태가 아니라
 *   메모리상 배열을 그대로 바꾸는 방식이라 새로고침하면 초기화됨.
 * - POST_COMMENTS: 게시글 상세 화면의 댓글 mock 데이터.
 */
export const POSTS: Post[] = [
  {
    postId: 1,
    category: "GENERAL",
    title: "대관령 별빛 캠핑장 다녀왔습니다 — 총정리",
    content: "지난 주말에 별빛 숲속 캠핑장을 다녀왔어요. 은하수가 정말 장관이었고 피톤치드 가득한 숲에서 힐링했습니다. 시설도 깔끔하고 사장님도 친절하셨어요. 자세한 후기는 본문에 적어뒀으니 참고해주세요!",
    writer: "캠핑왕_철수",
    avatar: "철",
    createdAt: "2026-06-25T14:30:00",
    viewCount: 312,
    commentCount: 15,
  },
  {
    postId: 2,
    category: "CAMP_MATE",
    title: "7월 첫째주 가평 계곡 캠핑 같이 가실 분 모집합니다!",
    content: "7월 4일(금) ~ 6일(일) 2박3일로 가평 계곡 캠핑 계획 중입니다. 현재 2명이고 2~3명 더 모집해요. 텐트는 각자 가져오시고 장비는 공유 가능합니다. 20~30대 환영! 캠핑 경험 있으신 분 우선입니다.",
    writer: "자연인_수진",
    avatar: "수",
    createdAt: "2026-06-26T09:15:00",
    viewCount: 189,
    commentCount: 8,
  },
  {
    postId: 3,
    category: "RESERVATION_TRANSFER",
    title: "7월 15~16일 별빛 숲속 캠핑장 예약 양도합니다",
    content: "갑작스러운 일정 변경으로 7월 15일(화) ~ 16일(수) 1박 예약을 양도합니다. 일반 사이트 1자리, 전기 포함. 원래 결제 금액 45,000원에 양도합니다. 빠른 연락 부탁드려요!",
    writer: "주말캠퍼_민호",
    avatar: "민",
    createdAt: "2026-06-27T11:00:00",
    viewCount: 95,
    commentCount: 3,
  },
  {
    postId: 4,
    category: "GENERAL",
    title: "캠핑 초보자를 위한 필수 장비 리스트 공유",
    content: "캠핑을 처음 시작하시는 분들을 위해 제가 직접 써보고 추천하는 장비 리스트를 공유합니다. 텐트, 침낭, 매트, 코펠 등 기본 장비부터 있으면 편한 것들까지 정리했어요.",
    writer: "캠핑마스터",
    avatar: "마",
    createdAt: "2026-06-24T16:45:00",
    viewCount: 1240,
    commentCount: 42,
  },
  {
    postId: 5,
    category: "CAMP_MATE",
    title: "8월 제주 캠핑 동행 구합니다 (2인 여성)",
    content: "8월 10일~13일 3박4일 제주 캠핑 동행을 구해요. 저희는 20대 여성 2인이고 한라산 에코캠프 예약 완료된 상태입니다. 같이 제주 여행도 하실 분 환영합니다!",
    writer: "제주러버",
    avatar: "제",
    createdAt: "2026-06-26T20:00:00",
    viewCount: 234,
    commentCount: 12,
  },
  {
    postId: 6,
    category: "RESERVATION_TRANSFER",
    title: "설악산 베이스캠프 8월 예약 양도 (2인)",
    content: "8월 5일(화) 1박 예약 양도합니다. 일반사이트 1자리. 40,000원에 양도해드려요. 직거래 또는 계좌이체 가능합니다.",
    writer: "등산러버",
    avatar: "등",
    createdAt: "2026-06-27T08:30:00",
    viewCount: 67,
    commentCount: 1,
  },
  {
    postId: 7,
    category: "GENERAL",
    title: "비가 올 때 캠핑하는 꿀팁 모음",
    content: "우중 캠핑이 처음이신 분들 걱정하지 마세요! 제가 10번 이상 우중 캠핑 경험을 바탕으로 알아두면 도움이 되는 팁들을 정리했습니다.",
    writer: "우중캠퍼",
    avatar: "우",
    createdAt: "2026-06-23T13:20:00",
    viewCount: 876,
    commentCount: 28,
  },
  {
    postId: 8,
    category: "CAMP_MATE",
    title: "가족 캠핑 동행 구해요 (유아 있음)",
    content: "7살, 5살 아이들과 함께 가평 계곡 캠핑 예정입니다. 비슷한 연령대 아이가 있는 가족분들과 함께하고 싶어요. 7월 중순 주말 예정입니다.",
    writer: "두아빠_준혁",
    avatar: "준",
    createdAt: "2026-06-25T10:00:00",
    viewCount: 145,
    commentCount: 6,
  },
];

export const POST_COMMENTS: PostComment[] = [
  { commentId: 1, postId: 1, writer: "숲속요정", avatar: "숲", content: "저도 지난달에 다녀왔는데 은하수 진짜 장관이죠! 완전 공감해요 ✨", createdAt: "2026-06-25T15:00:00" },
  { commentId: 2, postId: 1, writer: "별보러가자", avatar: "별", content: "몇 호 사이트 이용하셨나요? 전망 좋은 곳 추천해주실 수 있나요?", createdAt: "2026-06-25T16:30:00" },
  { commentId: 3, postId: 1, writer: "캠핑왕_철수", avatar: "철", content: "A구역 5번 사이트가 시야가 탁 트여서 별 보기 최고였어요!", createdAt: "2026-06-25T17:00:00" },
  { commentId: 4, postId: 2, writer: "가평사랑", avatar: "가", content: "저도 참여하고 싶어요! 어디로 연락드리면 될까요?", createdAt: "2026-06-26T10:00:00" },
  { commentId: 5, postId: 2, writer: "캠핑초보", avatar: "초", content: "캠핑 경험이 많지는 않은데 참여 가능할까요?", createdAt: "2026-06-26T11:30:00" },
  { commentId: 6, postId: 3, writer: "여행자_김씨", avatar: "김", content: "아직 양도 가능한가요? 연락 부탁드립니다!", createdAt: "2026-06-27T12:00:00" },
];
