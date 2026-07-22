import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Edit3, Tent, Trash2 } from "lucide-react";
import type { AxiosError } from "axios";
import { getMyCampsites, deleteCampsite } from "../../api/campsite";
import BusinessHeader from "./BusinessHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import NoticeDialog from "../../components/common/NoticeDialog";
import type { Camp } from "../../types";

/**
 * 내 캠핑장 관리 화면 (/business/campsites)
 * - 로그인한 회원이 등록한 캠핑장 전체를 GET /v1/camps/my로 조회해 카드 목록으로 보여줌
 * - "정보 수정"은 해당 캠핑장의 등록/수정 폼(CampsiteFormPage, /business/campsites/:contentId/edit)으로,
 *   "새 캠핑장 등록"은 같은 폼의 등록 모드(/business/campsites/new)로 이동
 *   (수정은 대응하는 백엔드 API가 아직 없어 실제로는 동작하지 않음)
 *  *  - "삭제"는 DELETE /v1/camps/{campId}로 연동됨 (softDelete, 소유자 본인만 가능)

 */
export default function CampsiteManagePage() {
  const navigate = useNavigate();
  const [myCamps, setMyCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  // 삭제 확인 모달의 대상 캠핑장 id. null 이면 모달이 닫힌 상태다.
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    getMyCampsites()
      .then((res: any) => setMyCamps(res ?? []))
      .catch((err) => {
        // 목록 조회 실패는 모달로 막지 않는다. 등록한 캠핑장이 없는 상태와 화면상 구분이 안 되는데,
        // 첫 진입부터 에러 모달이 뜨면 "아직 등록 안 한 상태"가 고장난 것처럼 보이기 때문이다.
        // 빈 목록으로 두면 아래 안내("등록된 캠핑장이 없습니다")가 그대로 나온다.
        // 진짜 통신 오류는 조용히 넘기지 말고 콘솔에 남겨 디버깅할 수 있게 한다.
        console.error("[CampsiteManagePage] 캠핑장 목록 조회 실패", err);
        setMyCamps([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const onDelete = async (campId: number) => {
    setErrorMsg(null);
    setDeletingId(campId);
    try {
      await deleteCampsite(campId);
      setMyCamps((prev) => prev.filter((camp) => (camp.campId ?? camp.contentId) !== campId));
      setConfirmDeleteId(null);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      // 실패 안내는 확인 모달을 닫고 공지 모달로 보여준다.
      setConfirmDeleteId(null);
      setErrorMsg(axiosErr.response?.data?.message || "캠핑장 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="campsites" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/business/campsites/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={14} /> 새 캠핑장 등록
        </button>
      </div>

      <div className="space-y-4">
        {myCamps.map((camp) => {
          // 자체 등록 캠핑장은 contentId가 항상 null이라 실제 PK인 campId로 식별해야 함
          const id = camp.campId ?? camp.contentId;
          return (
            <div key={id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="h-48 bg-muted relative overflow-hidden">
                <img src={camp.firstImageUrl || camp.image} alt={camp.facltNm} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <span className="absolute bottom-4 left-4 text-white font-bold text-lg">{camp.facltNm}</span>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: "일반사이트", value: `${camp.gnrlSiteCo}개` },
                    { label: "오토사이트", value: `${camp.autoSiteCo}개` },
                    { label: "글램핑", value: `${camp.glampSiteCo}개` },
                    { label: "평점", value: `⭐ ${camp.averageRating ?? camp.rating ?? 0}` },
                  ].map((item) => (
                    <div key={item.label} className="bg-muted rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                      <p className="font-bold text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/business/campsites/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all"
                  >
                    <Edit3 size={14} /> 정보 수정
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(id)}
                    disabled={deletingId === id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:border-destructive hover:text-destructive transition-all disabled:opacity-50"
                  >
                    <Trash2 size={14} /> {deletingId === id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {!loading && myCamps.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Tent size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">등록된 캠핑장이 없습니다. 새 캠핑장을 등록해보세요.</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
        title="이 캠핑장을 삭제할까요?"
        description="삭제하면 되돌릴 수 없습니다. 등록한 사이트 정보도 함께 사라집니다."
        confirmLabel="삭제하기"
        pendingLabel="삭제 중…"
        onConfirm={() => confirmDeleteId !== null && onDelete(confirmDeleteId)}
        isPending={deletingId !== null}
      />

      <NoticeDialog
        open={!!errorMsg}
        onOpenChange={(o) => !o && setErrorMsg(null)}
        variant="error"
        title="문제가 발생했어요"
        description={errorMsg ?? undefined}
      />
    </div>
  );
}
