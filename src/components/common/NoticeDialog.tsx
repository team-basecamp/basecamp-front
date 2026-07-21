import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

/**
 * 단순 안내(성공/실패/정보)를 알려주는 모달 공지. window.alert 를 대체한다.
 * - ConfirmDialog 와 같은 스타일을 써서 프로젝트 전반의 알림 UI 를 통일한다.
 * - 확인 버튼(또는 바깥 클릭/ESC) 하나로만 닫히는 읽기 전용 공지다.
 */
export type NoticeVariant = "error" | "success" | "info";

const VARIANT_STYLE: Record<NoticeVariant, { Icon: typeof Info; ring: string }> = {
  error: { Icon: AlertCircle, ring: "bg-destructive/10 text-destructive" },
  success: { Icon: CheckCircle2, ring: "bg-emerald-500/10 text-emerald-600" },
  info: { Icon: Info, ring: "bg-primary/10 text-primary" },
};

export default function NoticeDialog({
  open,
  onOpenChange,
  title,
  description,
  variant = "info",
  confirmLabel = "확인",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  variant?: NoticeVariant;
  confirmLabel?: string;
}) {
  const { Icon, ring } = VARIANT_STYLE[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        {/* DialogHeader 기본값의 sm:text-left 를 덮어야 데스크톱에서도 가운데 정렬이 유지된다. */}
        <DialogHeader className="items-center text-center sm:text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${ring}`}>
            <Icon size={22} />
          </div>
          <DialogTitle style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</DialogTitle>
          {description && (
            // whitespace-pre-line: 백엔드 검증 오류처럼 줄바꿈이 담긴 메시지를 그대로 보여준다.
            <DialogDescription className="leading-relaxed whitespace-pre-line">{description}</DialogDescription>
          )}
        </DialogHeader>

        <button
          onClick={() => onOpenChange(false)}
          className="mt-2 w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
        >
          {confirmLabel}
        </button>
      </DialogContent>
    </Dialog>
  );
}
