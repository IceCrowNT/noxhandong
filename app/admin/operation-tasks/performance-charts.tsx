"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type StatRecord = {
  department: string;
  onTime: number;
  late: number;
  incomplete: number;
  total: number;
};

export type PerformanceChartsProps = {
  stats: {
    veSinh: StatRecord;
    kyThuat: StatRecord;
    hanhChinh: StatRecord;
    tongHop: StatRecord;
  };
  statMonth: string;
};

const COLORS = {
  onTime: "#0d6254", // dark green (project theme)
  late: "#ef4444", // red
  incomplete: "#e2e8f0", // light gray
};

function CustomPieChart({ data }: { data: StatRecord }) {
  const chartData = [
    { name: "Đúng hạn", value: data.onTime, color: COLORS.onTime },
    { name: "Trễ hạn", value: data.late, color: COLORS.late },
    { name: "Chưa xong", value: data.incomplete, color: COLORS.incomplete },
  ].filter((d) => d.value > 0);

  if (data.total === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-[var(--muted)]">Không có công việc</div>;
  }

  const completePct = data.total > 0 ? ((data.onTime / data.total) * 100).toFixed(0) : "0";

  return (
    <div className="flex flex-col items-center xl:flex-row xl:justify-center gap-6 py-4">
      <div className="relative h-[140px] w-[140px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`${value} việc (${((value / data.total) * 100).toFixed(0)}%)`, ""]} 
              contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid var(--line)', color: 'var(--text)' }}
              itemStyle={{ color: 'var(--text)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#0d6254] leading-none">{completePct}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase text-slate-600">đúng hạn</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 text-sm min-w-[120px]">
        <div className="flex items-baseline justify-between border-b border-[var(--line)] pb-1">
          <span className="text-xs font-bold uppercase text-slate-600">Tổng số</span>
          <span className="text-lg font-bold">{data.total}</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-medium text-[var(--text)]">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.onTime }}></span>
              Đúng hạn
            </span>
            <span className="font-semibold text-[#0d6254]">{data.onTime}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-medium text-[var(--text)]">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.late }}></span>
              Trễ hạn
            </span>
            <span className="font-semibold text-red-500">{data.late}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-xs font-semibold text-[var(--text)]">
              <span className="block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS.incomplete }}></span>
              Chưa xong
            </span>
            <span className="font-semibold text-slate-700">{data.incomplete}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PerformanceCharts({ stats, statMonth }: PerformanceChartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val) {
      params.set("statMonth", val);
    } else {
      params.delete("statMonth");
    }
    router.push(`/admin/operation-tasks?${params.toString()}`);
  };

  const barData = [stats.tongHop];

  return (
    <Card className="mb-5 bg-white/90">
      <CardHeader>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Thống kê hiệu suất theo tháng</CardTitle>
            <CardDescription>KPI tính theo mốc Deadline của công việc</CardDescription>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
            Tháng:
            <Input type="month" value={statMonth} onChange={handleMonthChange} className="w-auto" />
          </label>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-[var(--line)] p-4">
            <h3 className="mb-2 text-center text-sm font-bold">Kỹ thuật</h3>
            <CustomPieChart data={stats.kyThuat} />
          </div>
          <div className="rounded-lg border border-[var(--line)] p-4">
            <h3 className="mb-2 text-center text-sm font-bold">Vệ sinh</h3>
            <CustomPieChart data={stats.veSinh} />
          </div>
          <div className="rounded-lg border border-[var(--line)] p-4">
            <h3 className="mb-2 text-center text-sm font-bold">Hành chính</h3>
            <CustomPieChart data={stats.hanhChinh} />
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[var(--line)] p-4">
          <h3 className="mb-4 text-center text-sm font-bold">Công việc Tổng hợp (Toàn BQT)</h3>
          {stats.tongHop.total === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--muted)]">Không có công việc tổng hợp</div>
          ) : (
            <div className="h-[100px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="department" type="category" hide />
                  <Tooltip 
                    formatter={(value: number) => [`${value} việc`, ""]} 
                    cursor={{fill: 'transparent'}} 
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', border: '1px solid var(--line)', color: 'var(--text)' }}
                    itemStyle={{ color: 'var(--text)' }}
                  />
                  <Bar dataKey="onTime" name="Đúng hạn" stackId="a" fill={COLORS.onTime} />
                  <Bar dataKey="late" name="Trễ hạn" stackId="a" fill={COLORS.late} />
                  <Bar dataKey="incomplete" name="Chưa xong" stackId="a" fill={COLORS.incomplete} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
        
        {/* Custom Legend for Bar Chart */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.onTime }}></span> Đúng hạn
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.late }}></span> Trễ hạn
          </div>
          <div className="flex items-center gap-2 font-medium">
            <span className="block h-3 w-3 rounded-sm" style={{ backgroundColor: COLORS.incomplete }}></span> Chưa hoàn thành
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
