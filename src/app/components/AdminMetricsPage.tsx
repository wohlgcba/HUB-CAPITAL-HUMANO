import { useState } from "react";
import { IconCalendar, IconChevronDown, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { metricKpis, metricsSummary } from "../data/adminMetricsDemo";
import { ActivityChart } from "./metrics/ActivityChart";
import { AreaParticipation } from "./metrics/AreaParticipation";
import { DirectoryStatus } from "./metrics/DirectoryStatus";
import { MetricCard } from "./metrics/MetricCard";
import { RecentActivity } from "./metrics/RecentActivity";
import { TopResources } from "./metrics/TopResources";
import { TopSections } from "./metrics/TopSections";
import { UserStatusPanel } from "./metrics/UserStatusPanel";

const periodOptions = ["Últimos 7 días", "30 días", "90 días", "Este año", "Personalizado"];

export function AdminMetricsPage() {
  const [activePeriod, setActivePeriod] = useState("Últimos 7 días");
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleRefresh() {
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 650);
  }

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="grid gap-5 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-start">
        <div>
          <p className="text-[11px] font-extrabold uppercase text-[#007D95]">Métricas</p>
          <h1 className="mt-1 text-[clamp(28px,3vw,36px)] font-extrabold leading-tight text-[#061947]">Resumen de actividad</h1>
          <p className="mt-1 text-[13px] font-semibold text-[#536779]">Analizá el uso del HUB y el comportamiento de los usuarios.</p>
        </div>

        <div className="min-w-0 xl:max-w-[820px]">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
            <div className="max-w-full overflow-x-auto pb-1">
              <div className="inline-flex min-w-max overflow-hidden rounded-[7px] border border-[#CCD7DF] bg-white">
                {periodOptions.map((period, index) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setActivePeriod(period)}
                    className={`inline-flex min-h-10 items-center gap-2 border-r border-[#DDE5EA] px-4 text-[11px] font-extrabold last:border-r-0 ${activePeriod === period ? "bg-[#153244] text-white" : "bg-white text-[#153244] hover:bg-[#F4F7F9]"}`}
                  >
                    {index === 0 || period === "Personalizado" ? <IconCalendar size={15} /> : null}
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="inline-flex min-h-10 shrink-0 items-center justify-between gap-5 rounded-[7px] border border-[#CCD7DF] bg-white px-4 text-[11px] font-extrabold text-[#153244]">
              Todas las secciones
              <IconChevronDown size={15} />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-[#718296] xl:justify-end xl:gap-6">
            <span>Período: {metricsSummary.period}</span>
            <button type="button" onClick={handleRefresh} disabled={isRefreshing} className="inline-flex min-h-10 items-center gap-2 font-extrabold text-[#0072BC] disabled:opacity-60">
              <IconRefresh size={16} className={isRefreshing ? "animate-spin" : ""} />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
        {metricKpis.map((metric) => <MetricCard key={metric.id} metric={metric} />)}
      </section>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.95fr)]">
        <ActivityChart />
        <TopSections />
      </div>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.95fr)]">
        <TopResources />
        <UserStatusPanel />
      </div>

      <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-3">
        <AreaParticipation />
        <DirectoryStatus />
        <RecentActivity />
      </div>

      <div className="mt-4 flex min-h-12 items-center gap-3 rounded-[7px] border border-[#BFE4F4] bg-[#E7F6FC] px-4 py-3 text-[11px] font-semibold text-[#31566B]">
        <IconInfoCircle size={19} className="shrink-0 text-[#0072BC]" />
        <p>Las métricas se actualizan cada 30 minutos. Los datos pueden tener un pequeño retraso.</p>
      </div>
    </main>
  );
}
