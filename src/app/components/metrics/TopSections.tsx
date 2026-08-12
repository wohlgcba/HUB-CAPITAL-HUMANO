import { topSections } from "../../data/adminMetricsDemo";
import { MetricsPanel } from "./MetricsPanel";

export function TopSections() {
  return (
    <MetricsPanel title="Secciones más visitadas" actionLabel="Ver todas las secciones">
      <div className="mt-4">
        <div className="grid grid-cols-[minmax(0,1fr)_52px_42px] gap-3 border-b border-[#E2E8ED] pb-2 text-[10px] font-extrabold text-[#456075]">
          <span>Sección</span><span className="text-right">Visitas</span><span className="text-right">%</span>
        </div>
        {topSections.map((section) => (
          <div key={section.name} className="grid grid-cols-[minmax(0,1fr)_52px_42px] gap-x-3 border-b border-[#E8EDF1] py-3 text-[12px] font-bold text-[#153244]">
            <div className="min-w-0">
              <span className="block truncate">{section.name}</span>
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EDF1F4]">
                <span className="block h-full rounded-full" style={{ width: `${Math.min(100, section.percentage * 3.3)}%`, backgroundColor: section.color }} />
              </span>
            </div>
            <span className="text-right">{section.visits}</span>
            <span className="text-right">{section.percentage}%</span>
          </div>
        ))}
      </div>
    </MetricsPanel>
  );
}
