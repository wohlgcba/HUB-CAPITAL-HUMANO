import type { ReactNode } from "react";
import { IconArrowRight } from "@tabler/icons-react";

type MetricsPanelProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  headerAction?: ReactNode;
  className?: string;
};

export function MetricsPanel({ title, children, actionLabel, headerAction, className = "" }: MetricsPanelProps) {
  return (
    <section className={`flex min-w-0 flex-col rounded-[8px] border border-[#DDE5EA] bg-white p-4 shadow-[0_2px_9px_rgba(21,50,68,0.045)] sm:p-5 ${className}`}>
      <div className="flex min-h-8 items-start justify-between gap-4">
        <h2 className="text-[16px] font-extrabold leading-tight text-[#153244]">{title}</h2>
        {headerAction}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
      {actionLabel ? (
        <button type="button" className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 text-[12px] font-extrabold text-[#0072BC] hover:text-[#004F83] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]">
          {actionLabel}
          <IconArrowRight size={16} stroke={2.2} />
        </button>
      ) : null}
    </section>
  );
}
