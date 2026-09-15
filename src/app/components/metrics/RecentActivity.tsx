import { IconDownload, IconFileText, IconLogin2, IconTrendingUp } from "@tabler/icons-react";
import type { RecentActivityMetric } from "../../types/metrics";
import { MetricsPanel } from "./MetricsPanel";

const iconByType = { open: IconTrendingUp, login: IconLogin2, download: IconDownload, publish: IconFileText };
const toneClasses = {
  blue: "bg-[#E6F2FF] text-[#0878D1]",
  cyan: "bg-[#DDF8F5] text-[#007D95]",
  yellow: "bg-[#FFF4C7] text-[#E39B00]",
  violet: "bg-[#F1E8FC] text-[#7D42CC]",
};

export function RecentActivity({ activity, onOpenAll }: { activity: RecentActivityMetric[]; onOpenAll: () => void }) {
  return (
    <MetricsPanel title="Última actividad" actionLabel="Ver toda la actividad" onAction={onOpenAll}>
      <ActivityList activity={activity.slice(0, 8)} />
    </MetricsPanel>
  );
}

export function ActivityList({ activity, showDate = false }: { activity: RecentActivityMetric[]; showDate?: boolean }) {
  return (
      <ol className="mt-3 divide-y divide-[#E8EDF1]">
        {activity.map((item) => {
          const Icon = iconByType[item.icon];
          return (
            <li key={item.id} className={`grid items-center gap-2 py-2.5 ${showDate ? "grid-cols-[34px_minmax(0,1fr)_minmax(78px,auto)]" : "grid-cols-[34px_minmax(0,1fr)_38px]"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses[item.tone]}`}><Icon size={17} /></span>
              <span className="min-w-0 text-[10px] font-semibold leading-[1.35] text-[#153244]"><strong className="font-extrabold">{item.actor}</strong> {item.action}</span>
              <time className="text-right text-[10px] font-bold text-[#536779]">{showDate ? `${item.date} · ${item.time}` : item.time}</time>
            </li>
          );
        })}
        {activity.length === 0 ? <li className="py-10 text-center text-[11px] font-semibold text-[#718296]">No hay actividad registrada en este período.</li> : null}
      </ol>
  );
}
