/**
 * 찜(위시리스트) 상태 전역 관리 (zustand)
 * - 캠핑장 카드(CampCard), 캠핑장 상세 페이지, 찜 목록 페이지가 모두 같은 찜 여부를
 *   동시에 보여줘야 해서 만든 스토어 (한 곳에서 찜을 누르면 나머지 화면도 즉시 동기화됨)
 * - wishedIds는 Set으로 관리해서 특정 캠핑장이 찜 상태인지(isWished) 빠르게 조회 가능
 * - persist 미들웨어로 localStorage("wishlist-storage")에 저장되어 새로고침에도 유지됨.
 *   서버(백엔드) 저장은 하지 않음 — 실제 회원 인증이 아직 없어 로컬 전용으로 동작
 *   (Set은 JSON으로 직렬화가 안 되므로 partialize/merge로 배열 <-> Set을 변환)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WISHLIST_CAMPS } from "../data/camps";

interface WishlistState {
  wishedIds: Set<number>;
  isWished: (contentId: number) => boolean;
  toggleWish: (contentId: number) => void;
}

const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      wishedIds: new Set(WISHLIST_CAMPS.map((c) => c.contentId)),
      isWished: (contentId) => get().wishedIds.has(contentId),
      toggleWish: (contentId) =>
        set((state) => {
          const next = new Set(state.wishedIds);
          if (next.has(contentId)) next.delete(contentId);
          else next.add(contentId);
          return { wishedIds: next };
        }),
    }),
    {
      name: "wishlist-storage",
      partialize: (state) => ({ wishedIds: Array.from(state.wishedIds) }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        wishedIds: new Set((persistedState as { wishedIds?: number[] } | undefined)?.wishedIds ?? []),
      }),
    }
  )
);

export default useWishlistStore;
