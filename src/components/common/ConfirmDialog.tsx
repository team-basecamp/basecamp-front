import { AlertTriangle, HelpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

/**
 * 되돌릴 수 없는 삭제나, 시간이 오래 걸리는 무거운 작업을 실행하기 전에 확인받는 다이얼로그.
 * window.confirm 을 대체한다.
 * - 확인을 눌러도 바로 닫지 않는다. 요청이 끝난 뒤 호출부(mutation 의 onSuccess/onError)가 닫는다.
 *   그래야 처리 중에 버튼을 잠가 중복 요청을 막고, 실패 시 오류 메시지를 보여줄 수 있다.
 * - tone: "destructive"(기본, 삭제) 는 빨간색 경고, "primary" 는 삭제가 아닌 일반 확인용이다.
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "확인",
  pendingLabel,
  onConfirm,
  isPending = false,
  tone = "destructive",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  /** 처리 중에 확인 버튼에 표시할 문구. 없으면 confirmLabel 을 그대로 쓴다. */
  pendingLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  /** 삭제 같은 위험 동작은 "destructive"(기본), 그 외 일반 확인은 "primary". */
  tone?: "destructive" | "primary";
}) {
  const isDestructive = tone === "destructive";
  const Icon = isDestructive ? AlertTriangle : HelpCircle;
  const iconWrapClass = isDestructive
    ? "bg-destructive/10 text-destructive"
    : "bg-primary/10 text-primary";
  const confirmBtnClass = isDestructive
    ? "bg-destructive hover:bg-destructive/90"
    : "bg-primary hover:bg-primary/90";

  return (
    // 처리 중에는 바깥 클릭·ESC 로 닫히지 않게 막는다.
    <Dialog open={open} onOpenChange={(o) => { if (!isPending) onOpenChange(o); }}>
      <DialogContent className="max-w-sm rounded-2xl">
        {/* DialogHeader 기본값의 sm:text-left 를 덮어야 데스크톱에서도 가운데 정렬이 유지된다. */}
        <DialogHeader className="items-center text-center sm:text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${iconWrapClass}`}>
            <Icon size={22} />
          </div>
          <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</DialogTitle>
          {description && (
            <DialogDescription className="leading-relaxed">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-40"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {isPending ? pendingLabel ?? confirmLabel : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
