import { useState } from "react";
import { ShieldOff, CheckCircle, Plus } from "lucide-react";
import { BLACKLIST_ENTRIES, ADMIN_MEMBERS, type BlacklistEntry } from "../../data/admin";
import AdminHeader from "./AdminHeader";

/**
 * 블랙리스트 관리 화면 (/admin/blacklist)
 * - 블랙리스트에 등록된 회원 목록과 사유, 등록일/해제 예정일을 보여주고 신규 등록/수동 해제 처리
 * - ERD의 token_blacklist 테이블(blacklist_id, user_id, reason, blacklisted_at, expires_at)에 대응
 * - mock 데이터(data/admin.ts의 BLACKLIST_ENTRIES)를 컴포넌트 로컬 state로 관리 (새로고침하면 초기화됨, 실제 백엔드 연동 전 단계)
 */
const BLACKLIST_DURATION_DAYS = 30;

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>(BLACKLIST_ENTRIES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [reasonInput, setReasonInput] = useState("");

  const blacklistedIds = new Set(entries.map((e) => e.memberId));
  const availableMembers = ADMIN_MEMBERS.filter((m) => !blacklistedIds.has(m.memberId) && m.status !== "WITHDRAWN");

  // 블랙리스트 신규 등록: 선택한 회원 + 사유로 항목 추가 (등록일=지금, 해제 예정일=30일 뒤)
  const addToBlacklist = () => {
    if (!selectedMemberId || !reasonInput.trim()) return;
    const member = ADMIN_MEMBERS.find((m) => m.memberId === selectedMemberId);
    if (!member) return;

    const blacklistedAt = new Date();
    const expiresAt = new Date(blacklistedAt.getTime() + BLACKLIST_DURATION_DAYS * 24 * 60 * 60 * 1000);

    setEntries((prev) => [
      { memberId: member.memberId, nickname: member.nickname, reason: reasonInput.trim(), blacklistedAt: blacklistedAt.toISOString(), expiresAt: expiresAt.toISOString() },
      ...prev,
    ]);
    setShowAddForm(false);
    setSelectedMemberId("");
    setReasonInput("");
  };

  // 블랙리스트 해제: 목록(state)에서 해당 회원 항목을 제거 (실제로는 서버에 해제 요청을 보내야 함)
  const removeFromBlacklist = (memberId: number) => {
    setEntries((prev) => prev.filter((e) => e.memberId !== memberId));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <AdminHeader active="blacklist" />

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowAddForm((v) => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
        >
          <Plus size={14} /> 블랙리스트 등록
        </button>
      </div>

      {showAddForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-3">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">대상 회원</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm outline-none"
            >
              <option value="">회원을 선택하세요</option>
              {availableMembers.map((m) => (
                <option key={m.memberId} value={m.memberId}>{m.nickname} ({m.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">등록 사유</label>
            <textarea
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              placeholder="블랙리스트 등록 사유를 입력해주세요"
              rows={2}
              className="w-full bg-muted rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-destructive/30 placeholder:text-muted-foreground resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAddForm(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">
              취소
            </button>
            <button
              onClick={addToBlacklist}
              disabled={!selectedMemberId || !reasonInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-destructive text-white text-xs font-medium hover:bg-destructive/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              등록
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.memberId} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium text-destructive bg-destructive/10">
                    <ShieldOff size={11} /> 블랙리스트
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.nickname}</span>
                </div>
                <p className="text-sm">{entry.reason}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  등록일 {new Date(entry.blacklistedAt).toLocaleDateString("ko-KR")} · 해제 예정일 {new Date(entry.expiresAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <button
                onClick={() => removeFromBlacklist(entry.memberId)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all flex-shrink-0"
              >
                <CheckCircle size={12} /> 해제
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <ShieldOff size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">블랙리스트에 등록된 회원이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
