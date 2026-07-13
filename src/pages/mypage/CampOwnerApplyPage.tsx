import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ArrowLeft, Clock, CheckCircle, XCircle, Tent } from "lucide-react";
import {
  applyCampOwner,
  getMyCampOwnerApplication,
  type CampOwnerApplication,
} from "../../api/campOwner";
import RequireLogin from "../../components/common/RequireLogin";
import { getApiErrorMessage } from "../../lib/apiError";
import useAuthStore from "../../store/authStore";
import useRole from "../../hooks/useRole";

/**
 * 캠핑업체 권한 승격 신청 (/mypage/camp-owner)
 * - CUSTOMER 회원이 사업자 정보를 제출해 CAMP_OWNER 승격을 신청한다.
 * - 이미 신청 이력이 있으면 최신 1건의 심사 상태를 보여준다.
 *   PENDING(심사 중) / APPROVED(승인) / REJECTED(반려 — 사유 + 재신청).
 * - 이미 CAMP_OWNER 로 승격된 회원은 신청 폼 대신 결과(승인 내역)만 확인할 수 있다.
 *   승격되면 토큰 권한이 바뀌어 헤더 메뉴가 전환되므로, 결과 확인용 진입 경로를 별도로 열어 둔다(Header 참고).
 */
export default function CampOwnerApplyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const role = useRole();
  const isCampOwner = role === "CAMP_OWNER";
  const queryClient = useQueryClient();

  // 반려 후 "다시 신청"을 누르면 폼을 다시 연다.
  const [reapplying, setReapplying] = useState(false);

  // 신청 이력 조회. 이력이 없으면 백엔드가 404(CO001) 를 주므로 null 로 정규화한다.
  const { data: application, isLoading } = useQuery<CampOwnerApplication | null>({
    queryKey: ["campOwnerApplication", "me"],
    queryFn: async () => {
      try {
        return await getMyCampOwnerApplication();
      } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!user,
  });

  if (!user) return <RequireLogin />;

  // 승격된 회원에게는 절대 신청 폼을 보이지 않는다(재신청도 불가 — 백엔드가 409 ALREADY_CAMP_OWNER 로 막는다).
  const showForm = !isCampOwner && (!application || (application.status === "REJECTED" && reapplying));

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-10">
      <button onClick={() => navigate("/mypage")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft size={16} /> 마이페이지
      </button>

      <div className="flex items-center gap-2 mb-2">
        <Tent size={22} className="text-primary" />
        <h1 className="text-2xl font-bold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>캠핑업체 전환 신청</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-8">
        사업자 정보를 제출하면 관리자 심사 후 캠핑업체 권한이 부여됩니다. 승인되면 캠핑장을 직접 등록·관리할 수 있습니다.
      </p>

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중…</div>
      ) : showForm ? (
        <ApplyForm
          reapply={!!application}
          onApplied={() => {
            setReapplying(false);
            void queryClient.invalidateQueries({ queryKey: ["campOwnerApplication", "me"] });
          }}
        />
      ) : application ? (
        <StatusCard application={application} isCampOwner={isCampOwner} onReapply={() => setReapplying(true)} />
      ) : (
        // 신청 이력 없이 CAMP_OWNER 인 회원(직접 부여 등)도 결과 화면에서 튕기지 않도록 안내 카드를 보인다.
        <AlreadyCampOwnerCard />
      )}
    </div>
  );
}

/** 심사 상태 표시 카드 (PENDING / APPROVED / REJECTED). */
function StatusCard({
  application,
  isCampOwner,
  onReapply,
}: {
  application: CampOwnerApplication;
  isCampOwner: boolean;
  onReapply: () => void;
}) {
  const navigate = useNavigate();

  if (application.status === "PENDING") {
    return (
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4 text-amber-600">
          <Clock size={20} />
          <span className="font-bold">심사 중입니다</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          제출하신 사업자 정보를 관리자가 확인하고 있습니다. 승인되면 알려드리며, 이후 다시 로그인하면 캠핑업체 기능을 이용할 수 있습니다.
        </p>
        <ApplicationSummary application={application} />
      </div>
    );
  }

  if (application.status === "APPROVED") {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4 text-primary">
          <CheckCircle size={20} />
          <span className="font-bold">승인되었습니다</span>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {isCampOwner ? (
            <>캠핑업체 권한이 부여되었습니다. 이제 캠핑장을 직접 등록·관리할 수 있습니다.</>
          ) : (
            <>캠핑업체 권한이 부여되었습니다. <span className="text-foreground font-medium">다시 로그인</span>하면 캠핑업체 대시보드를 이용할 수 있습니다.</>
          )}
        </p>
        <ApplicationSummary application={application} />
        <button
          onClick={() => navigate("/business/campsites")}
          className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
        >
          캠핑업체 대시보드로 이동
        </button>
      </div>
    );
  }

  // REJECTED
  return (
    <div className="bg-card border border-destructive/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-destructive">
        <XCircle size={20} />
        <span className="font-bold">반려되었습니다</span>
      </div>
      {application.rejectReason && (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs text-muted-foreground mb-1">반려 사유</p>
          <p className="text-sm text-foreground">{application.rejectReason}</p>
        </div>
      )}
      <ApplicationSummary application={application} />
      <button
        onClick={onReapply}
        className="w-full mt-5 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
      >
        다시 신청하기
      </button>
    </div>
  );
}

/** 신청 이력이 없는 CAMP_OWNER(직접 권한 부여 등) 안내. 결과 화면 진입 시 폼으로 튕기지 않게 한다. */
function AlreadyCampOwnerCard() {
  const navigate = useNavigate();
  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-primary">
        <CheckCircle size={20} />
        <span className="font-bold">이미 캠핑업체 회원입니다</span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        캠핑업체 권한이 부여되어 있어 추가 전환 신청이 필요하지 않습니다. 캠핑장을 직접 등록·관리할 수 있습니다.
      </p>
      <button
        onClick={() => navigate("/business/campsites")}
        className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all"
      >
        캠핑업체 대시보드로 이동
      </button>
    </div>
  );
}

function ApplicationSummary({ application }: { application: CampOwnerApplication }) {
  return (
    <dl className="space-y-2 text-sm border-t border-border pt-4">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">상호명</dt>
        <dd className="font-medium text-right">{application.businessName}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">대표자명</dt>
        <dd className="font-medium text-right">{application.representativeName}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">사업자등록번호</dt>
        <dd className="font-medium text-right" style={{ fontFamily: "'DM Mono', monospace" }}>{application.businessNumber}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">신청일</dt>
        <dd className="text-muted-foreground text-right text-xs" style={{ fontFamily: "'DM Mono', monospace" }}>
          {new Date(application.createdAt).toLocaleString("ko-KR")}
        </dd>
      </div>
    </dl>
  );
}

/** 신청 폼. 사업자등록번호는 백엔드와 동일하게 숫자 10자리만 검증한다. */
function ApplyForm({ reapply, onApplied }: { reapply: boolean; onApplied: () => void }) {
  const [businessNumber, setBusinessNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [representativeName, setRepresentativeName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      applyCampOwner({ businessNumber, businessName: businessName.trim(), representativeName: representativeName.trim() }),
    onSuccess: onApplied,
    onError: (err) => setError(getApiErrorMessage(err, "신청에 실패했습니다. 잠시 후 다시 시도해 주세요.")),
  });

  const bizNumValid = /^\d{10}$/.test(businessNumber);
  const canSubmit = bizNumValid && businessName.trim().length > 0 && representativeName.trim().length > 0;

  const submit = () => {
    setError(null);
    if (!canSubmit || mutation.isPending) return;
    mutation.mutate();
  };

  return (
    <div className="space-y-5">
      {reapply && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
          이전 신청이 반려되었습니다. 정보를 다시 확인하고 제출해 주세요.
        </p>
      )}

      <div>
        <label className="text-sm font-semibold mb-2 block">상호명</label>
        <input
          type="text"
          value={businessName}
          maxLength={100}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="베이스캠프 오토캠핑장"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">대표자명</label>
        <input
          type="text"
          value={representativeName}
          maxLength={50}
          onChange={(e) => setRepresentativeName(e.target.value)}
          placeholder="홍길동"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-semibold mb-2 block">사업자등록번호</label>
        <input
          type="text"
          inputMode="numeric"
          value={businessNumber}
          // 하이픈 없이 숫자만, 최대 10자리. 붙여넣기로 하이픈이 섞여도 숫자만 남긴다.
          onChange={(e) => setBusinessNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="1234567890"
          className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
          style={{ fontFamily: "'DM Mono', monospace" }}
        />
        {businessNumber.length > 0 && !bizNumValid && (
          <p className="text-xs text-destructive mt-1.5">하이픈 없이 숫자 10자리로 입력해 주세요.</p>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        onClick={submit}
        disabled={!canSubmit || mutation.isPending}
        className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? "제출 중…" : "신청하기"}
      </button>
    </div>
  );
}
