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

export function RecentActivity({ activity }: { activity: RecentActivityMetric[] }) {
  return (
    <MetricsPanel title="Última actividad" actionLabel="Ver toda la actividad">
      <ol className="mt-3 divide-y divide-[#E8EDF1]">
        {activity.map((item) => {
          const Icon = iconByType[item.icon];
          return (
            <li key={`${item.time}-${item.text}`} className="grid grid-cols-[34px_minmax(0,1fr)_38px] items-center gap-2 py-2.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses[item.tone]}`}><Icon size={17} /></span>
              <span className="text-[10px] font-semibold leading-[1.35] text-[#153244]">{item.text}</span>
              <time className="text-right text-[10px] font-bold text-[#536779]">{item.time}</time>
            </li>
          );
        })}
        {activity.length === 0 ? <li className="py-10 text-center text-[11px] font-semibold text-[#718296]">No hay actividad registrada en este período.</li> : null}
      </ol>
    </MetricsPanel>
  );
}
