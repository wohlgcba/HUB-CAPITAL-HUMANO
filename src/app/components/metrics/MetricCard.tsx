import { IconDownload, IconFileText, IconInfoCircle, IconTrendingUp, IconUsersGroup } from "@tabler/icons-react";
import type { MetricKpi } from "../../types/metrics";

const toneClasses = {
  blue: "bg-[#E6F2FF] text-[#0878D1]",
  green: "bg-[#E4F7EF] text-[#16865A]",
  yellow: "bg-[#FFF4C7] text-[#E39B00]",
  violet: "bg-[#F1E8FC] text-[#7D42CC]",
};

const iconByType = {
  users: IconUsersGroup,
  visits: IconTrendingUp,
  resources: IconFileText,
  downloads: IconDownload,
};

export function MetricCard({ metric }: { metric: MetricKpi }) {
  const Icon = iconByType[metric.icon];
  return (
    <article className="flex min-h-[142px] items-start gap-4 rounded-[8px] border border-[#DDE5EA] bg-white p-4 shadow-[0_2px_9px_rgba(21,50,68,0.045)] sm:p-5">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClasses[metric.tone]}`}>
        <Icon size={26} stroke={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[12px] font-extrabold text-[#415569]">{metric.title}</h2>
          <IconInfoCircle size={14} className="text-[#718296]" aria-hidden="true" />
        </div>
        <strong className="mt-1 block text-[30px] font-extrabold leading-none text-[#061947]">{metric.value}</strong>
        <p className="mt-2 text-[12px] font-semibold text-[#536779]">{metric.detail}</p>
        <p className={`mt-4 flex items-center gap-1 text-[11px] font-extrabold ${metric.changePercent !== null && metric.changePercent < 0 ? "text-[#B52F2F]" : "text-[#16865A]"}`}>
          <IconTrendingUp size={14} stroke={2.4} className={metric.changePercent !== null && metric.changePercent < 0 ? "rotate-180" : ""} />
          {metric.changePercent === null ? "Sin período anterior comparable" : `${metric.changePercent >= 0 ? "+" : ""}${metric.changePercent}% vs. período anterior`}
        </p>
      </div>
    </article>
  );
}
