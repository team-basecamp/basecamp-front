import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyWishlists, toggleWish } from "../api/campsite";
import useAuthStore from "../store/authStore";

/**
 * 찜(위시리스트) 서버 상태를 다루는 훅.
 * 기존 wishlistStore(Zustand)를 대체한다. 찜 목록의 진실은 서버(camp_wishlists)에 있으므로
 * 클라이언트 상태가 아니라 TanStack Query 캐시로 관리한다.
 */
export const useWishlist = () => {
    const queryClient = useQueryClient();
    const isLoggedIn = useAuthStore((s) => s.accessToken !== null);

    const { data: wishlists = [], isLoading } = useQuery({
        queryKey: ["wishlists"],
        queryFn: getMyWishlists,
        // 비로그인 상태로 호출하면 401 → instance 인터셉터가 강제 로그아웃시킨다.
        enabled: isLoggedIn,
    });

    const { mutate, isPending } = useMutation({
        mutationFn: toggleWish,
        // 토글 후 목록을 무효화하면 하트를 쓰는 모든 화면이 함께 갱신된다.
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlists"] });
        },
    });

    return {
        wishlists,
        isLoading,
        isPending,
        wishedIds: wishlists.map((w) => w.campId),
        isWished: (campId: number) => wishlists.some((w) => w.campId === campId),
        toggleWish: (campId: number) => mutate(campId),
    };
};