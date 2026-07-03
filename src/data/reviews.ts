import type { Review } from "../types";

/**
 * 캠핑장 리뷰 mock 데이터.
 * pages/campsite/ReviewsPage.tsx, ReviewDetailPage.tsx, pages/business/ReviewStatPage.tsx 등
 * 캠핑장 리뷰가 노출되는 화면에서 사용. 이름이 INITIAL_REVIEWS인 이유는 컴포넌트에서
 * 이 배열을 초기값으로 삼아 로컬 상태(useState 등)에 복사해 쓰는 경우가 많기 때문.
 */
export const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    campId: 1,
    author: "캠핑왕_철수",
    avatar: "철",
    rating: 5,
    date: "2025-06-10",
    content:
      "별빛이 정말 장관이었어요! 대관령 고원이라 여름에도 선선하고, 피톤치드 가득한 숲속에서 최고의 힐링을 했습니다. 시설도 깔끔하고 사장님도 친절하세요. 꼭 재방문 예정입니다 🏕️ 특히 밤에 텐트 밖에서 바라본 은하수가 너무 아름다워서 사진을 수백 장 찍었어요. 다음엔 친구들이랑 다시 오려고요!",
    images: [
      "https://images.unsplash.com/photo-1496545672447-f699b503d270?w=400&h=300&fit=crop&auto=format",
    ],
    likes: 47,
    comments: [
      {
        id: 101, reviewId: 1, author: "숲속요정", avatar: "숲",
        content: "저도 지난 달에 다녀왔는데 정말 별이 쏟아지는 느낌이었어요! 완전 공감합니다 ✨",
        date: "2025-06-11", likes: 5,
      },
      {
        id: 102, reviewId: 1, author: "등산매니아", avatar: "등",
        content: "반려동물 동반 가능한가요? 강아지 데려가려는데 혹시 아시나요?",
        date: "2025-06-12", likes: 2,
      },
      {
        id: 103, reviewId: 1, author: "캠핑왕_철수", avatar: "철",
        content: "네! 반려동물 동반 가능합니다. 입구에 리드줄 착용 필수라고 안내가 있었어요 🐾",
        date: "2025-06-12", likes: 8,
      },
    ],
  },
  {
    id: 2,
    campId: 1,
    author: "자연인_수진",
    avatar: "수",
    rating: 5,
    date: "2025-05-28",
    content:
      "반려견과 함께 왔는데 정말 만족스러웠어요. 넓은 사이트에 전기도 잘 되고, 샤워장도 항상 깨끗하게 유지됩니다. 주변에 산책로도 있어서 강아지가 너무 좋아했어요! 사장님이 강아지 간식도 따로 챙겨주셔서 감동받았습니다.",
    images: [],
    likes: 31,
    comments: [
      {
        id: 201, reviewId: 2, author: "펫러버_지현", avatar: "펫",
        content: "어떤 견종 데려가셨어요? 저도 골든 데려가고 싶은데 캠핑장 분위기가 어떤지 궁금해서요!",
        date: "2025-05-29", likes: 3,
      },
    ],
  },
  {
    id: 3,
    campId: 1,
    author: "주말캠퍼_민호",
    avatar: "민",
    rating: 4,
    date: "2025-05-15",
    content:
      "경치는 최고! 다만 주말 성수기엔 좀 붐비는 편이에요. 평일에 오시면 훨씬 조용하고 여유롭게 즐길 수 있을 것 같습니다. 그래도 별 보기엔 정말 최고의 장소입니다. 화장실은 항상 깨끗하게 관리되고 있어서 좋았어요.",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop&auto=format",
    ],
    likes: 19,
    comments: [],
  },
  {
    id: 4,
    campId: 2,
    author: "오션러버_지은",
    avatar: "지",
    rating: 5,
    date: "2025-06-05",
    content:
      "남해 바다가 눈앞에 펼쳐지는 뷰는 정말 압도적이에요. 일출 볼 때는 말 그대로 눈물 날 뻔했습니다. 글램핑 시설도 생각보다 훨씬 좋고 침구도 청결했어요. 커플 여행으로 강추합니다!",
    images: [
      "https://images.unsplash.com/photo-1571863533956-01c88e79957e?w=400&h=300&fit=crop&auto=format",
    ],
    likes: 62,
    comments: [
      {
        id: 401, reviewId: 4, author: "여행사진가", avatar: "여",
        content: "일출 사진 너무 아름답겠다... 카메라 장비 들고 가면 좋겠네요!",
        date: "2025-06-06", likes: 7,
      },
    ],
  },
  {
    id: 5,
    campId: 3,
    author: "가족캠퍼_영수",
    avatar: "영",
    rating: 4,
    date: "2025-06-01",
    content:
      "아이 둘이랑 갔는데 계곡에서 온종일 놀았어요. 물이 정말 맑고 깨끗해서 아이들이 너무 좋아했습니다. 어린이 안전 요원도 있어서 안심하고 즐길 수 있었어요. 다음 여름에도 또 올 것 같아요!",
    images: [],
    likes: 38,
    comments: [
      {
        id: 501, reviewId: 5, author: "맘스터치", avatar: "맘",
        content: "몇 살 아이들이랑 가셨어요? 저도 유아 데리고 가려는데 안전한지 걱정되서요",
        date: "2025-06-02", likes: 4,
      },
      {
        id: 502, reviewId: 5, author: "가족캠퍼_영수", avatar: "영",
        content: "6살, 8살이요! 계곡 얕은 구간이 따로 있어서 안전해요. 구명조끼도 대여 가능합니다 😊",
        date: "2025-06-02", likes: 11,
      },
    ],
  },
  {
    id: 6,
    campId: 4,
    author: "제주도민_현아",
    avatar: "현",
    rating: 5,
    date: "2025-05-20",
    content:
      "한라산 자락의 공기는 정말 달라요. 제주에 살면서도 여기 캠핑 오면 힐링이 제대로 됩니다. 별도 잘 보이고 새벽에 한라산 실루엣 바라보는 게 최고예요. 시설 관리도 정말 철저하게 잘 되어 있어요.",
    images: [],
    likes: 44,
    comments: [],
  },
  {
    id: 7,
    campId: 5,
    author: "트레킹마니아",
    avatar: "트",
    rating: 4,
    date: "2025-05-10",
    content:
      "설악산 트레킹 베이스로 최적! 공룡능선 코스 다녀오고 캠핑장에서 쉬는데 피로가 싹 풀렸어요. 단풍철에 다시 오고 싶네요. 매점에서 파는 컵라면이 왜 그렇게 맛있는지 ㅎㅎ",
    images: [],
    likes: 25,
    comments: [
      {
        id: 701, reviewId: 7, author: "산악회장", avatar: "산",
        content: "공룡능선 코스 얼마나 걸렸나요? 다음 주에 도전해보려고요!",
        date: "2025-05-11", likes: 3,
      },
    ],
  },
  {
    id: 8,
    campId: 6,
    author: "노을사진가",
    avatar: "노",
    rating: 5,
    date: "2025-05-25",
    content:
      "서해 노을은 진짜 다릅니다. 붉게 물든 하늘과 갯벌이 만들어내는 황금빛 풍경은 평생 못 잊을 것 같아요. 조개구이도 직접 캐서 먹으니 더 맛있고, 사장님이 조리법도 친절하게 알려주세요.",
    images: [
      "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=400&h=300&fit=crop&auto=format",
    ],
    likes: 55,
    comments: [],
  },
];
