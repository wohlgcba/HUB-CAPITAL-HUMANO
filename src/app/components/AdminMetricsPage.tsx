import { useEffect, useState } from "react";
import { getAdminMetrics } from "../services/adminService";
import { getErrorMessage } from "../services/serviceError";
import type { AdminMetricGroup, AdminMetrics } from "../types/admin";
import { AppIcon, type AppIconName } from "./AppIcon";

export function AdminMetricsPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getAdminMetrics()
      .then((nextMetrics) => {
        if (!cancelled) setMetrics(nextMetrics);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, "No se pudieron cargar las métricas."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-[12px] font-extrabold uppercase text-[#007D95]">Administración</p>
        <h1 className="mt-1 text-[clamp(28px,3vw,38px)] font-extrabold leading-tight text-[#061947]">Métricas</h1>
        <p className="mt-2 text-[14px] font-semibold text-[#5F6B76]">Indicadores calculados con los datos actuales del HUB.</p>
      </div>

      {error ? <div role="alert" className="mt-5 rounded-[10px] border border-[#F0B8B8] bg-[#FFF4F4] px-5 py-4 text-[14px] font-bold text-[#C93B3B]">{error}</div> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Indicadores principales">
        <MetricCard title="Usuarios totales" value={metrics?.totalUsers} icon="usersGroup" loading={isLoading} />
        <MetricCard title="Usuarios activos" value={metrics?.activeUsers} icon="check" loading={isLoading} />
        <MetricCard title="Secciones" value={metrics?.sections} icon="grid" loading={isLoading} />
        <MetricCard title="Recursos" value={metrics?.resources} icon="fileText" loading={isLoading} />
        <MetricCard title="Agregados en 30 días" value={metrics?.recentResources} icon="calendar" loading={isLoading} />
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <MetricPanel title="Recursos por sección" groups={metrics?.resourcesBySection ?? []} loading={isLoading} />
        <MetricPanel title="Usuarios por área" groups={metrics?.usersByArea ?? []} loading={isLoading} />
      </div>
    </main>
  );
}

function MetricCard({ title, value, icon, loading }: { title: string; value: number | undefined; icon: AppIconName; loading: boolean }) {
  return (
    <article className="flex min-h-[110px] items-center gap-4 rounded-[11px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.05)]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[9px] bg-[#DDF8F5] text-[#007D95]"><AppIcon name={icon} size={25} /></span>
      <div className="min-w-0">
        {loading ? <span className="block h-8 w-16 animate-pulse rounded bg-[#E5EAEE]" /> : <p className="text-[27px] font-extrabold leading-none text-[#061947]">{value ?? 0}</p>}
        <h2 className="mt-2 text-[12px] font-extrabold leading-tight text-[#153244]">{title}</h2>
      </div>
    </article>
  );
}

function MetricPanel({ title, groups, loading }: { title: string; groups: AdminMetricGroup[]; loading: boolean }) {
  const max = Math.max(1, ...groups.map((group) => group.value));
  return (
    <section className="rounded-[12px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.05)]">
      <h2 className="text-[18px] font-extrabold text-[#061947]">{title}</h2>
      {loading ? (
        <div className="mt-5 space-y-4" aria-label={`Cargando ${title}`}>{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded bg-[#EEF1F3]" />)}</div>
      ) : groups.length > 0 ? (
        <div className="mt-5 space-y-4">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-1.5 flex items-end justify-between gap-4 text-[12px] font-bold"><span className="min-w-0 text-[#153244]">{group.label}</span><span className="shrink-0 text-[#5F6B76]">{group.value}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E8EEF2]"><span className="block h-full rounded-full bg-[#21AFC0]" style={{ width: `${(group.value / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[9px] border border-dashed border-[#C9D5DE] px-4 py-10 text-center text-[13px] font-bold text-[#5F6B76]">No hay datos disponibles para calcular este indicador.</div>
      )}
    </section>
  );
}
