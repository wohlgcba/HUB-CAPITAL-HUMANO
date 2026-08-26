import { IconClock, IconTrendingUp, IconUserOff, IconUsersGroup } from "@tabler/icons-react";
import type { LowActivityUser, UserStatusMetric } from "../../types/metrics";
import { MetricsPanel } from "./MetricsPanel";

const toneClasses = {
  blue: "bg-[#E6F2FF] text-[#0878D1]",
  green: "bg-[#E4F7EF] text-[#16865A]",
  yellow: "bg-[#FFF4C7] text-[#E39B00]",
  violet: "bg-[#F1E8FC] text-[#7D42CC]",
};

const iconByType = {
  registered: IconUsersGroup,
  active: IconTrendingUp,
  pending: IconClock,
  inactive: IconUserOff,
};

export function UserStatusPanel({ stats, lowActivityUsers }: { stats: UserStatusMetric[]; lowActivityUsers: LowActivityUser[] }) {
  return (
    <MetricsPanel title="Estado de usuarios" actionLabel="Ver todos los usuarios">
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = iconByType[stat.icon];
          return (
            <article key={stat.label} className="flex min-h-[66px] items-center gap-3 rounded-[7px] border border-[#E1E8ED] px-3 py-2.5">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${toneClasses[stat.tone]}`}><Icon size={19} /></span>
              <div><strong className="block text-[19px] font-extrabold leading-none text-[#061947]">{stat.value}</strong><span className="mt-1 block text-[10px] font-semibold leading-tight text-[#536779]">{stat.label}</span></div>
            </article>
          );
        })}
      </div>
      <h3 className="mt-4 text-[11px] font-extrabold text-[#153244]">Usuarios con menor actividad</h3>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[430px] border-collapse text-left">
          <thead><tr className="border-b border-[#DDE5EA] text-[9px] font-extrabold text-[#456075]"><th className="py-2">Usuario</th><th className="px-2 py-2">Área</th><th className="py-2 text-right">Último acceso</th></tr></thead>
          <tbody>
            {lowActivityUsers.map((user) => (
              <tr key={user.name} className="border-b border-[#E8EDF1] text-[10px] font-semibold text-[#153244] last:border-b-0"><td className="py-2 font-bold">{user.name}</td><td className="px-2 py-2">{user.area}</td><td className="py-2 text-right">{user.lastAccess}</td></tr>
            ))}
            {lowActivityUsers.length === 0 ? <tr><td colSpan={3} className="py-8 text-center text-[11px] font-semibold text-[#718296]">No hay usuarios con baja actividad.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </MetricsPanel>
  );
}
