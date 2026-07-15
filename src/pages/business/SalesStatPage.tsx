import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import BusinessHeader, { MONTHLY_REVENUE, formatKRW } from "./BusinessHeader";
import { getMonthlyRevenue, type MonthlyRevenue } from "../../api/reservation"; 

/**
 * 매출 통계 화면 (/business/sales)
 * - BusinessHeader에 정의된 mock 월별 매출/예약건수 데이터(MONTHLY_REVENUE)를 recharts로 시각화
 * - 실제 백엔드 연동 전 하드코딩된 데이터를 사용
 */
export default function SalesStatPage() {
  //const totalRevenue = MONTHLY_REVENUE.reduce((s, m) => s + m.revenue, 0);
  const [monthly, setMonthly] = useState<MonthlyRevenue[] | null>(null);

  useEffect(() => {
    getMonthlyRevenue()
        .then(setMonthly)
        .catch(err => console.error('월별 통계 조회 실패', err));
  }, []);

  if (!monthly) return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <BusinessHeader active="sales" />
      <div className="space-y-5">
        <div className="bg-card border border-border rounded-2xl p-6 h-60 animate-pulse" />
        <div className="bg-card border border-border rounded-2xl p-6 h-40 animate-pulse" />
      </div>
    </div>
  );

  // 연간 합계는 원본(0 포함)으로 계산
  const totalRevenue = monthly.reduce((s, m) => s + m.revenue, 0);

  // 차트용 변환: 예약 없는 달(count=0)은 null → 막대 미표시
  const chartData = monthly.map(m => ({
    month: `${m.month}월`,
    revenue: m.count > 0 ? m.revenue : null,
    count: m.count > 0 ? m.count : null,
  }));

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
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => `${(v / 10000)}만`} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                formatter={(val: number | null) => val != null ? [`₩${val.toLocaleString()}`, "매출"] : ['예약 없음', '']}
              />
              <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold mb-4">월별 예약 건수</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }}
                formatter={(val: number | null) => val != null ? [`${val}건`, "예약"] : ['예약 없음', '']}
              />
              <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
