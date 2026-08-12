import { topResources } from "../../data/adminMetricsDemo";
import type { AppIconName } from "../AppIcon";
import { AppIcon } from "../AppIcon";
import { MetricsPanel } from "./MetricsPanel";

const resourceIcons: Record<(typeof topResources)[number]["kind"], { name: AppIconName; className: string }> = {
  pdf: { name: "fileText", className: "bg-[#FDECEC] text-[#C7352D]" },
  presentation: { name: "presentation", className: "bg-[#FFF0E1] text-[#D76F18]" },
  spreadsheet: { name: "files", className: "bg-[#E7F7EF] text-[#15824B]" },
  word: { name: "fileDescription", className: "bg-[#EAF4FB] text-[#0072BC]" },
};

const sectionTone = {
  blue: "bg-[#E3F1FF] text-[#075F9F]",
  yellow: "bg-[#FFF3C2] text-[#6E5700]",
  cyan: "bg-[#DDF8F5] text-[#006F73]",
};

export function TopResources() {
  return (
    <MetricsPanel title="Recursos más utilizados" actionLabel="Ver todos los recursos">
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold text-[#456075]">
              <th className="py-2 pr-3">Recurso</th>
              <th className="px-3 py-2">Sección</th>
              <th className="px-3 py-2 text-center">Aperturas</th>
              <th className="px-3 py-2 text-center">Descargas</th>
              <th className="py-2 pl-3">Tasa de descarga</th>
            </tr>
          </thead>
          <tbody>
            {topResources.map((resource) => {
              const icon = resourceIcons[resource.kind];
              return (
                <tr key={resource.name} className="border-b border-[#E8EDF1] text-[11px] font-semibold text-[#153244] last:border-b-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] ${icon.className}`}><AppIcon name={icon.name} size={18} /></span>
                      <span className="font-bold">{resource.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><span className={`inline-flex rounded-[5px] px-2.5 py-1 text-[10px] font-extrabold ${sectionTone[resource.tone]}`}>{resource.section}</span></td>
                  <td className="px-3 py-2.5 text-center font-bold">{resource.opens}</td>
                  <td className="px-3 py-2.5 text-center font-bold">{resource.downloads}</td>
                  <td className="py-2.5 pl-3">
                    <span className="block font-bold">{resource.rate}%</span>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-[#E7ECEF]"><span className="block h-full rounded-full bg-[#18A56B]" style={{ width: `${resource.rate}%` }} /></span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </MetricsPanel>
  );
}
