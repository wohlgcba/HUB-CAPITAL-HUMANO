import type { AreaParticipationMetric } from "../../types/metrics";
import { MetricsPanel } from "./MetricsPanel";

export function AreaParticipation({ areas }: { areas: AreaParticipationMetric[] }) {
  return (
    <MetricsPanel title="Participación por área" actionLabel="Ver todas las áreas">
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[410px] border-collapse text-left">
          <thead><tr className="border-b border-[#DDE5EA] text-[9px] font-extrabold text-[#456075]"><th className="py-2 pr-2">Área</th><th className="px-2 py-2 text-center">Usuarios</th><th className="px-2 py-2 text-center">Activos</th><th className="py-2 pl-2">% actividad</th></tr></thead>
          <tbody>
            {areas.map((area) => (
              <tr key={area.area} className="border-b border-[#E8EDF1] text-[10px] font-semibold text-[#153244] last:border-b-0">
                <td className="py-2.5 pr-2 font-bold">{area.area}</td>
                <td className="px-2 py-2.5 text-center">{area.users}</td>
                <td className="px-2 py-2.5 text-center">{area.active}</td>
                <td className="py-2.5 pl-2"><span className="block font-bold">{area.percentage}%</span><span className="mt-1 block h-1.5 min-w-20 overflow-hidden rounded-full bg-[#E7ECEF]"><span className="block h-full rounded-full bg-[#0878D1]" style={{ width: `${area.percentage}%` }} /></span></td>
              </tr>
            ))}
            {areas.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-[11px] font-semibold text-[#718296]">No hay datos de participación.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </MetricsPanel>
  );
}
