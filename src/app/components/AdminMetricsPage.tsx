import { useEffect, useMemo, useState } from "react";
import { IconCalendar, IconInfoCircle, IconRefresh } from "@tabler/icons-react";
import { getAdminActivityMetrics, getMetricsSectionOptions } from "../services/metricsService";
import { getErrorMessage } from "../services/serviceError";
import type { AdminMetricsSnapshot, MetricsPeriodPreset, MetricsSectionOption } from "../types/metrics";
import { ActivityChart } from "./metrics/ActivityChart";
import { AreaParticipation } from "./metrics/AreaParticipation";
import { DirectoryStatus } from "./metrics/DirectoryStatus";
import { MetricCard } from "./metrics/MetricCard";
import { RecentActivity } from "./metrics/RecentActivity";
import { TopResources } from "./metrics/TopResources";
import { TopSections } from "./metrics/TopSections";
import { UserStatusPanel } from "./metrics/UserStatusPanel";

const periodOptions: Array<{ value: MetricsPeriodPreset; label: string }> = [
  { value: "7d", label: "Últimos 7 días" },
  { value: "30d", label: "30 días" },
  { value: "90d", label: "90 días" },
  { value: "year", label: "Este año" },
  { value: "custom", label: "Personalizado" },
];

export function AdminMetricsPage() {
  const [period, setPeriod] = useState<MetricsPeriodPreset>("7d");
  const [sectionId, setSectionId] = useState("");
  const [customStart, setCustomStart] = useState(toDateInput(addDays(new Date(), -6)));
  const [customEnd, setCustomEnd] = useState(toDateInput(new Date()));
  const [data, setData] = useState<AdminMetricsSnapshot | null>(null);
  const [sectionOptions, setSectionOptions] = useState<MetricsSectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const range = useMemo(() => getRange(period, customStart, customEnd), [customEnd, customStart, period]);

  useEffect(() => {
    let cancelled = false;
    void getMetricsSectionOptions().then((options) => { if (!cancelled) setSectionOptions(options); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!range) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    void getAdminActivityMetrics(range, sectionId)
      .then((snapshot) => {
        if (cancelled) return;
        setData(snapshot);
        setSectionOptions(snapshot.sectionOptions);
      })
      .catch((loadError: unknown) => { if (!cancelled) setError(getErrorMessage(loadError, "No se pudieron cargar las métricas.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, refreshVersion, sectionId]);

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-5 sm:px-6 lg:px-8">
      <header className="grid gap-5 xl:grid-cols-[minmax(300px,1fr)_auto] xl:items-start">
        <div><p className="text-[11px] font-extrabold uppercase text-[#007D95]">Métricas</p><h1 className="mt-1 text-[clamp(28px,3vw,36px)] font-extrabold leading-tight text-[#061947]">Resumen de actividad</h1><p className="mt-1 text-[13px] font-semibold text-[#536779]">Analizá el uso del HUB y el comportamiento de los usuarios.</p></div>
        <div className="min-w-0 xl:max-w-[940px]">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:justify-end">
            <div className="max-w-full overflow-x-auto pb-1"><div className="inline-flex min-w-max overflow-hidden rounded-[7px] border border-[#CCD7DF] bg-white">{periodOptions.map((option) => <button key={option.value} type="button" onClick={() => setPeriod(option.value)} className={`inline-flex min-h-10 items-center gap-2 border-r border-[#DDE5EA] px-4 text-[11px] font-extrabold last:border-r-0 ${period === option.value ? "bg-[#153244] text-white" : "bg-white text-[#153244] hover:bg-[#F4F7F9]"}`}>{option.value === "7d" || option.value === "custom" ? <IconCalendar size={15} /> : null}{option.label}</button>)}</div></div>
            <label className="sr-only" htmlFor="metrics-section">Filtrar por sección</label>
            <select id="metrics-section" value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="min-h-10 shrink-0 rounded-[7px] border border-[#CCD7DF] bg-white px-4 text-[11px] font-extrabold text-[#153244] outline-none focus:border-[#0072BC]"><option value="">Todas las secciones</option>{sectionOptions.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}</select>
          </div>
          {period === "custom" ? <div className="mt-2 flex flex-wrap items-center justify-end gap-2"><DateField label="Desde" value={customStart} onChange={setCustomStart} /><DateField label="Hasta" value={customEnd} onChange={setCustomEnd} />{!range ? <span role="alert" className="text-[11px] font-bold text-[#C93B3B]">Elegí un rango válido.</span> : null}</div> : null}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-[#718296] xl:justify-end xl:gap-6"><span>Período: {data?.periodLabel ?? formatRange(range)}</span><button type="button" onClick={() => setRefreshVersion((version) => version + 1)} disabled={loading || !range} className="inline-flex min-h-10 items-center gap-2 font-extrabold text-[#0072BC] disabled:opacity-60"><IconRefresh size={16} className={loading ? "animate-spin" : ""} />Actualizar</button></div>
        </div>
      </header>

      {error ? <div role="alert" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#B52F2F]"><span>{error}</span><button type="button" onClick={() => setRefreshVersion((version) => version + 1)} className="min-h-11 rounded-[6px] border border-[#B52F2F] px-4">Reintentar</button></div> : null}
      {loading && !data ? <MetricsSkeleton /> : data ? <MetricsContent data={data} /> : !error ? <div className="mt-6 rounded-[8px] border border-dashed border-[#C7D1DA] bg-white px-5 py-14 text-center text-[13px] font-semibold text-[#5F6B76]">Elegí un período válido para consultar la actividad.</div> : null}
      <div className="mt-4 flex min-h-12 items-center gap-3 rounded-[7px] border border-[#BFE4F4] bg-[#E7F6FC] px-4 py-3 text-[11px] font-semibold text-[#31566B]"><IconInfoCircle size={19} className="shrink-0 text-[#0072BC]" /><p>Las métricas se calculan con la actividad registrada en el HUB y se actualizan al presionar Actualizar.</p></div>
    </main>
  );
}

function MetricsContent({ data }: { data: AdminMetricsSnapshot }) {
  return <div className="relative" aria-busy="false">
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">{data.kpis.map((metric) => <MetricCard key={metric.id} metric={metric} />)}</section>
    <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.95fr)]"><ActivityChart data={data.activity} /><TopSections sections={data.topSections} /></div>
    <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,.95fr)]"><TopResources resources={data.topResources} /><UserStatusPanel stats={data.userStatus} lowActivityUsers={data.lowActivityUsers} /></div>
    <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-3"><AreaParticipation areas={data.areaParticipation} /><DirectoryStatus status={data.directoryStatus} completion={data.directoryCompletion} /><RecentActivity activity={data.recentActivity} /></div>
  </div>;
}

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[#CCD7DF] bg-white px-3 text-[11px] font-bold text-[#536779]">{label}<input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent font-extrabold text-[#153244] outline-none" /></label>; }
function MetricsSkeleton() { return <div className="mt-6 space-y-4" aria-label="Cargando métricas"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[142px] animate-pulse rounded-[8px] bg-[#E8EEF2]" />)}</div><div className="grid gap-4 xl:grid-cols-2"><div className="h-[370px] animate-pulse rounded-[8px] bg-[#E8EEF2]" /><div className="h-[370px] animate-pulse rounded-[8px] bg-[#E8EEF2]" /></div></div>; }

function getRange(period: MetricsPeriodPreset, customStart: string, customEnd: string) {
  const now = new Date(); const end = endOfDay(now); let start: Date;
  if (period === "custom") { const parsedStart = parseDateInput(customStart); const parsedEnd = parseDateInput(customEnd); if (!parsedStart || !parsedEnd || parsedStart > parsedEnd) return null; return { start: startOfDay(parsedStart), end: endOfDay(parsedEnd) }; }
  if (period === "year") start = new Date(now.getFullYear(), 0, 1);
  else start = startOfDay(addDays(now, -(Number(period.replace("d", "")) - 1)));
  return { start, end };
}
function parseDateInput(value: string) { const [year, month, day] = value.split("-").map(Number); if (!year || !month || !day) return null; const date = new Date(year, month - 1, day); return Number.isNaN(date.getTime()) ? null : date; }
function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; }
function endOfDay(date: Date) { const copy = new Date(date); copy.setHours(23, 59, 59, 999); return copy; }
function addDays(date: Date, days: number) { const copy = new Date(date); copy.setDate(copy.getDate() + days); return copy; }
function toDateInput(date: Date) { const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function formatRange(range: { start: Date; end: Date } | null) { return range ? `${new Intl.DateTimeFormat("es-AR").format(range.start)} - ${new Intl.DateTimeFormat("es-AR").format(range.end)}` : "Rango inválido"; }
