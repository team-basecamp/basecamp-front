import type { Camp } from "../types";

/**
 * 캠핑장을 식별하는 값(camps.camp_id)을 꺼낸다.
 * 찜 API(/v1/camps/{campId}/wishlist)와 상세 조회(/v1/camps/{campId})는 모두 campId로 동작하는데,
 * 자체 등록 캠핑장은 contentId가 null이고 mock 데이터(data/camps.ts)는 반대로 campId가 없어
 * 둘 중 있는 값을 쓴다.
 */
export const campKey = (camp: Pick<Camp, "campId" | "contentId">): number =>
  camp.campId ?? camp.contentId;
