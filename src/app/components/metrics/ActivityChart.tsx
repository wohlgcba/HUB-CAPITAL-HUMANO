import { IconChevronDown } from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ActivityPoint } from "../../types/metrics";
import { MetricsPanel } from "./MetricsPanel";

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
  const selector = (
    <button type="button" className="inline-flex min-h-9 items-center gap-5 rounded-[6px] border border-[#CCD7DF] bg-white px-3 text-[11px] font-extrabold text-[#153244]">
      Diario
      <IconChevronDown size={14} />
    </button>
  );

  return (
    <MetricsPanel title="Actividad del HUB" headerAction={selector}>
      <div className="mt-2 flex flex-wrap items-center gap-5 text-[11px] font-bold text-[#415569]">
        <LegendItem label="Usuarios activos" />
        <LegendItem label="Visitas" dashed />
      </div>
      <div className="mt-2 h-[285px] w-full" aria-label="Gráfico de actividad diaria del HUB">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 8, bottom: 2, left: -22 }}>
            <CartesianGrid stroke="#E4EAF0" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: "#536779", fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: "#D8E1E7" }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fill: "#536779", fontSize: 10, fontWeight: 600 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ border: "1px solid #DDE5EA", borderRadius: 6, boxShadow: "0 4px 14px rgba(21,50,68,.08)", fontSize: 11 }} />
            <Line type="monotone" dataKey="activeUsers" name="Usuarios activos" stroke="#0878D1" strokeWidth={2.4} dot={{ r: 3, fill: "#0878D1", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="visits" name="Visitas" stroke="#2A8CE6" strokeWidth={2.2} strokeDasharray="3 5" dot={{ r: 2.5, fill: "#2A8CE6", strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </MetricsPanel>
  );
}

function LegendItem({ label, dashed = false }: { label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`block w-7 border-t-2 border-[#0878D1] ${dashed ? "border-dashed" : ""}`} />
      {label}
    </span>
  );
}
