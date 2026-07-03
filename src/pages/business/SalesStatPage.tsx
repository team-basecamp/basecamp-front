import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BusinessHeader, { MONTHLY_REVENUE, formatKRW } from "./BusinessHeader";

/**
 * 매출 통계 화면 (/business/sales)
 * - BusinessHeader에 정의된 mock 월별 매출/예약건수 데이터(MONTHLY_REVENUE)를 recharts로 시각화
 * - 실제 백엔드 연동 전 하드코딩된 데이터를 사용
 */
export default function SalesStatPage() {
  const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="sales" />

      <div className="space-y-5">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold">월별 매출</h3>
            <span className="text-sm font-bold text-primary" style={{ fontFamily: "'DM Mono', monospace" }}>
              연간 ₩{formatKRW(totalRevenue)}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 10000)}만`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                formatter={(val: number) => [`₩${val.toLocaleString()}`, "매출"]}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">월별 예약 건수</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={MONTHLY_REVENUE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                formatter={(val: number) => [`${val}건`, "예약"]}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
