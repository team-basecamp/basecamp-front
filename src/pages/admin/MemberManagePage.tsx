import { useState } from "react";
import { Search, ShieldOff } from "lucide-react";
import { ADMIN_MEMBERS } from "../../data/admin";
import AdminHeader from "./AdminHeader";

/**
 * 회원 관리 화면 (/admin/members)
 * - 전체 회원 목록을 조회하고 닉네임/이메일로 검색
 * - mock 데이터(data/admin.ts의 ADMIN_MEMBERS)를 그대로 표시 (실제 백엔드 연동 전 단계, 정지 버튼은 아직 동작 없음)
 */

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "정상", SUSPENDED: "정지", WITHDRAWN: "탈퇴",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-primary bg-primary/10",
  SUSPENDED: "text-destructive bg-destructive/10",
  WITHDRAWN: "text-muted-foreground bg-muted",
};

export default function MemberManagePage() {
  const [keyword, setKeyword] = useState(""); // 닉네임/이메일 검색어

  const filtered = ADMIN_MEMBERS.filter(
    (m) => !keyword || m.nickname.includes(keyword) || m.email.includes(keyword)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="members" />

      {/* Search */}
      <div className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 mb-5 max-w-sm">
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="닉네임 또는 이메일 검색..."
          className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Member list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_1fr_1.2fr_auto] gap-3 px-5 py-3 text-xs font-medium text-muted-foreground border-b border-border">
          <span>닉네임</span>
          <span>이메일</span>
          <span>상태</span>
          <span>가입일</span>
          <span></span>
        </div>
        {filtered.map((m) => (
          <div key={m.memberId} className="grid grid-cols-[2fr_2fr_1fr_1.2fr_auto] gap-3 px-5 py-4 items-center border-b border-border last:border-0 text-sm">
            <span className="font-medium">{m.nickname}</span>
            <span className="text-muted-foreground truncate">{m.email}</span>
            <span className={`w-fit text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[m.status]}`}>
              {STATUS_LABELS[m.status]}
            </span>
            <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
              {new Date(m.createdAt).toLocaleDateString("ko-KR")}
            </span>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/5 transition-all justify-self-end">
              <ShieldOff size={12} /> 정지
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">검색 결과가 없습니다</div>
        )}
      </div>
    </div>
  );
}
