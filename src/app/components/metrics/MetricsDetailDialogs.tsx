import { useMemo, useState, type ReactNode } from "react";
import { IconSearch } from "@tabler/icons-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type {
  ActivityCategory,
  AdminMetricsSnapshot,
  IncompleteDirectoryProfile,
  MetricsUserState,
  ResourceAnalysisMetric,
} from "../../types/metrics";
import { ActivityList } from "./RecentActivity";
import { MetricsDetailModal } from "./MetricsDetailModal";

type DetailDialogProps = {
  data: AdminMetricsSnapshot;
  loading: boolean;
  error: string;
  onClose: () => void;
};

export function SectionsAnalysisDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [order, setOrder] = useState("most");
  const sections = useMemo(() => [...data.sectionAnalysis].sort((first, second) => {
    if (order === "least") return first.visits - second.visits || first.name.localeCompare(second.name, "es-AR");
    if (order === "az") return first.name.localeCompare(second.name, "es-AR");
    return second.visits - first.visits || first.name.localeCompare(second.name, "es-AR");
  }), [data.sectionAnalysis, order]);
  const totalVisits = sections.reduce((total, section) => total + section.visits, 0);
  const topSection = [...sections].sort((first, second) => second.visits - first.visits)[0];
  const average = sections.length ? Math.round(totalVisits / sections.length) : 0;

  return <MetricsDetailModal title="Análisis de secciones" subtitle={`Período: ${data.periodLabel}`} loading={loading} error={error} onClose={onClose} filters={<FilterSelect label="Ordenar" value={order} onChange={setOrder} options={[{ value: "most", label: "Más visitadas" }, { value: "least", label: "Menos visitadas" }, { value: "az", label: "A-Z" }]} />}>
    <SummaryGrid><SummaryMetric label="Total de visitas" value={totalVisits} /><SummaryMetric label="Sección más visitada" value={topSection?.name ?? "Sin datos"} /><SummaryMetric label="Promedio por sección" value={average} /></SummaryGrid>
    <TableViewport>
      <table className="w-full min-w-[760px] border-collapse text-left">
        <thead><tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold uppercase text-[#456075]"><TableHead>Sección</TableHead><TableHead align="right">Visitas</TableHead><TableHead align="right">Usuarios únicos</TableHead><TableHead align="right">% del total</TableHead><TableHead align="right">Recursos abiertos</TableHead></tr></thead>
        <tbody>{sections.map((section) => <tr key={section.id} className="border-b border-[#E8EDF1] text-[12px] font-semibold text-[#153244]"><td className="py-3 pr-4"><strong className="block font-extrabold">{section.name}</strong><span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#EDF1F4]"><span className="block h-full rounded-full" style={{ width: `${section.percentage}%`, backgroundColor: section.color }} /></span></td><td className="px-3 py-3 text-right">{section.visits}</td><td className="px-3 py-3 text-right">{section.uniqueUsers}</td><td className="px-3 py-3 text-right">{section.percentage}%</td><td className="py-3 pl-3 text-right">{section.resourceOpens}</td></tr>)}</tbody>
      </table>
      {!sections.length ? <EmptyState text="No hay secciones para analizar en este período." /> : null}
    </TableViewport>
  </MetricsDetailModal>;
}

export function ResourcesAnalysisDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [sectionId, setSectionId] = useState("");
  const [kind, setKind] = useState("");
  const [order, setOrder] = useState("opens");
  const [selectedId, setSelectedId] = useState("");
  const resources = useMemo(() => data.resourceAnalysis.filter((resource) => (!sectionId || resource.sectionId === sectionId) && (!kind || resource.kind === kind)).sort((first, second) => {
    if (order === "downloads") return second.downloads - first.downloads || second.opens - first.opens;
    if (order === "least") return first.opens + first.downloads - (second.opens + second.downloads);
    return second.opens - first.opens || second.downloads - first.downloads;
  }), [data.resourceAnalysis, kind, order, sectionId]);
  const selected = resources.find((resource) => resource.id === selectedId) ?? null;
  const sections = [...new Map(data.resourceAnalysis.map((resource) => [resource.sectionId, resource.section])).entries()].map(([value, label]) => ({ value, label }));
  const kinds = [...new Set(data.resourceAnalysis.map((resource) => resource.kind))].map((value) => ({ value, label: fileKindLabels[value] }));

  return <MetricsDetailModal title="Análisis de recursos" subtitle={`Período: ${data.periodLabel}`} loading={loading} error={error} onClose={onClose} filters={<FilterRow><FilterSelect label="Sección" value={sectionId} onChange={setSectionId} allLabel="Todas" options={sections} /><FilterSelect label="Tipo de archivo" value={kind} onChange={setKind} allLabel="Todos" options={kinds} /><FilterSelect label="Ordenar" value={order} onChange={setOrder} options={[{ value: "opens", label: "Más abiertos" }, { value: "downloads", label: "Más descargados" }, { value: "least", label: "Menos utilizados" }]} /></FilterRow>}>
    <TableViewport><table className="w-full min-w-[860px] border-collapse text-left"><thead><tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold uppercase text-[#456075]"><TableHead>Recurso</TableHead><TableHead>Sección</TableHead><TableHead align="right">Aperturas</TableHead><TableHead align="right">Usuarios únicos</TableHead><TableHead align="right">Descargas</TableHead><TableHead align="right">Tasa</TableHead></tr></thead><tbody>{resources.map((resource) => <tr key={resource.id} className={`border-b border-[#E8EDF1] text-[12px] font-semibold text-[#153244] ${selectedId === resource.id ? "bg-[#EDF7FF]" : ""}`}><td className="py-3 pr-4"><button type="button" onClick={() => setSelectedId(selectedId === resource.id ? "" : resource.id)} className="text-left font-extrabold text-[#005CB9] hover:underline">{resource.name}</button></td><td className="px-3 py-3">{resource.section}</td><td className="px-3 py-3 text-right">{resource.opens}</td><td className="px-3 py-3 text-right">{resource.uniqueUsers}</td><td className="px-3 py-3 text-right">{resource.downloads}</td><td className="py-3 pl-3 text-right">{resource.rate}%</td></tr>)}</tbody></table>{!resources.length ? <EmptyState text="No hay recursos para los filtros seleccionados." /> : null}</TableViewport>
    {selected ? <ResourceTrend resource={selected} /> : null}
  </MetricsDetailModal>;
}

export function UsersAnalysisDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [tab, setTab] = useState<"all" | MetricsUserState>("all");
  const [search, setSearch] = useState("");
  const normalizedSearch = normalizeSearch(search);
  const users = useMemo(() => data.userAnalysis.filter((user) => {
    const matchesTab = tab === "all" || user.state === tab;
    const matchesSearch = !normalizedSearch || normalizeSearch(`${user.name} ${user.area}`).includes(normalizedSearch);
    return matchesTab && matchesSearch;
  }), [data.userAnalysis, normalizedSearch, tab]);
  return <MetricsDetailModal title="Análisis de usuarios" subtitle={`Período: ${data.periodLabel}`} loading={loading} error={error} onClose={onClose} filters={<div className="space-y-3"><SegmentedFilter value={tab} onChange={(value) => setTab(value as typeof tab)} options={[{ value: "all", label: "Todos" }, { value: "active", label: "Activos" }, { value: "pending", label: "Primer ingreso pendiente" }, { value: "inactive", label: "Inactivos" }]} /><SearchField value={search} onChange={setSearch} placeholder="Buscar usuario o área..." label="Buscar usuario o área" /></div>}>
    <SummaryGrid>{data.userStatus.map((status) => <SummaryMetric key={status.label} label={status.label} value={status.value} />)}</SummaryGrid>
    <TableViewport><table className="w-full min-w-[850px] border-collapse text-left"><thead><tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold uppercase text-[#456075]"><TableHead>Usuario</TableHead><TableHead>Área</TableHead><TableHead>Estado</TableHead><TableHead>Primer ingreso</TableHead><TableHead>Último acceso</TableHead><TableHead align="right">Visitas</TableHead></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-[#E8EDF1] text-[11px] font-semibold text-[#153244]"><td className="py-3 pr-3 font-extrabold">{user.name}</td><td className="px-3 py-3">{user.area}</td><td className="px-3 py-3"><StatusChip state={user.state} /></td><td className="px-3 py-3">{formatDateTime(user.firstLoginAt)}</td><td className="px-3 py-3">{formatDateTime(user.lastLoginAt)}</td><td className="py-3 pl-3 text-right">{user.visits}</td></tr>)}</tbody></table>{!users.length ? <EmptyState text={search.trim() ? "No hay usuarios que coincidan con la búsqueda." : "No hay usuarios en este estado."} /> : null}</TableViewport>
  </MetricsDetailModal>;
}

export function AreasAnalysisDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [selectedArea, setSelectedArea] = useState("");
  const selected = data.areaAnalysis.find((area) => area.area === selectedArea) ?? null;
  const highest = data.areaAnalysis[0];
  const lowest = [...data.areaAnalysis].sort((first, second) => first.percentage - second.percentage)[0];
  return <MetricsDetailModal title="Análisis por área" subtitle={`Período: ${data.periodLabel}`} loading={loading} error={error} onClose={onClose}>
    <SummaryGrid><SummaryMetric label="Mayor participación" value={highest ? `${highest.area} · ${highest.percentage}%` : "Sin datos"} /><SummaryMetric label="Menor participación" value={lowest ? `${lowest.area} · ${lowest.percentage}%` : "Sin datos"} /></SummaryGrid>
    {selected ? <div className="mb-4 rounded-[8px] border border-[#BFE4F4] bg-[#EDF8FD] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase text-[#007D95]">Detalle del área</p><h3 className="mt-1 text-[16px] font-extrabold text-[#061947]">{selected.area}</h3></div><button type="button" onClick={() => setSelectedArea("")} className="text-[11px] font-extrabold text-[#005CB9]">Cerrar detalle</button></div><div className="mt-3 grid gap-2 grid-cols-2 lg:grid-cols-5"><MiniValue label="Integrantes" value={selected.members} /><MiniValue label="Activos" value={selected.active} /><MiniValue label="Actividad" value={`${selected.percentage}%`} /><MiniValue label="Visitas" value={selected.visits} /><MiniValue label="Recursos abiertos" value={selected.resourceOpens} /></div></div> : null}
    <TableViewport><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold uppercase text-[#456075]"><TableHead>Área</TableHead><TableHead align="right">Integrantes</TableHead><TableHead align="right">Usuarios activos</TableHead><TableHead>% activos</TableHead><TableHead align="right">Visitas</TableHead><TableHead align="right">Recursos abiertos</TableHead></tr></thead><tbody>{data.areaAnalysis.map((area) => <tr key={area.area} className={`border-b border-[#E8EDF1] text-[11px] font-semibold text-[#153244] ${selectedArea === area.area ? "bg-[#EDF7FF]" : ""}`}><td className="py-3 pr-3"><button type="button" onClick={() => setSelectedArea(area.area)} className="text-left font-extrabold text-[#005CB9] hover:underline">{area.area}</button></td><td className="px-3 py-3 text-right">{area.members}</td><td className="px-3 py-3 text-right">{area.active}</td><td className="px-3 py-3"><span className="font-extrabold">{area.percentage}%</span><span className="mt-1 block h-1.5 min-w-24 overflow-hidden rounded-full bg-[#E7ECEF]"><span className="block h-full rounded-full bg-[#0878D1]" style={{ width: `${area.percentage}%` }} /></span></td><td className="px-3 py-3 text-right">{area.visits}</td><td className="py-3 pl-3 text-right">{area.resourceOpens}</td></tr>)}</tbody></table>{!data.areaAnalysis.length ? <EmptyState text="No hay áreas para analizar." /> : null}</TableViewport>
  </MetricsDetailModal>;
}

export function DirectoryQualityDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [filter, setFilter] = useState("all");
  const profiles = filter === "all" ? data.incompleteProfiles : data.incompleteProfiles.filter((profile) => profile.missingFields.includes(filter as IncompleteDirectoryProfile["missingFields"][number]));
  return <MetricsDetailModal title="Calidad del Directorio" subtitle={`Estado actual · ${data.periodLabel}`} loading={loading} error={error} onClose={onClose} filters={<SegmentedFilter value={filter} onChange={setFilter} options={[{ value: "all", label: "Todos" }, { value: "mail", label: "Falta mail" }, { value: "celular", label: "Falta celular" }, { value: "edificio", label: "Falta edificio" }, { value: "foto", label: "Falta foto" }]} />}>
    <SummaryGrid><SummaryMetric label="Perfiles completos" value={`${data.directoryCompletion.percentage}%`} />{data.directoryStatus.map((status) => <SummaryMetric key={status.label} label={status.label} value={status.value} />)}</SummaryGrid>
    <h3 className="mb-2 text-[14px] font-extrabold text-[#153244]">Perfiles incompletos</h3>
    <TableViewport><table className="w-full min-w-[680px] border-collapse text-left"><thead><tr className="border-b border-[#DDE5EA] text-[10px] font-extrabold uppercase text-[#456075]"><TableHead>Persona</TableHead><TableHead>Área</TableHead><TableHead>Campos faltantes</TableHead></tr></thead><tbody>{profiles.map((profile) => <tr key={profile.id} className="border-b border-[#E8EDF1] text-[11px] font-semibold text-[#153244]"><td className="py-3 pr-3 font-extrabold">{profile.name}</td><td className="px-3 py-3">{profile.area}</td><td className="py-3 pl-3"><div className="flex flex-wrap gap-1.5">{profile.missingFields.map((field) => <span key={field} className="rounded-[4px] bg-[#FFF0E8] px-2 py-1 text-[10px] font-extrabold capitalize text-[#9A4B16]">{field}</span>)}</div></td></tr>)}</tbody></table>{!profiles.length ? <EmptyState text="No hay perfiles incompletos con este filtro." /> : null}</TableViewport>
  </MetricsDetailModal>;
}

export function ActivityAnalysisDialog({ data, loading, error, onClose }: DetailDialogProps) {
  const [category, setCategory] = useState<"all" | ActivityCategory>("all");
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState("recent");
  const normalizedSearch = normalizeSearch(search);
  const activity = useMemo(() => data.recentActivity.filter((item) => (category === "all" || item.category === category) && (!normalizedSearch || item.searchText.includes(normalizedSearch))).sort((first, second) => order === "oldest" ? first.occurredAt.localeCompare(second.occurredAt) : second.occurredAt.localeCompare(first.occurredAt)), [category, data.recentActivity, normalizedSearch, order]);
  return <MetricsDetailModal title="Toda la actividad" subtitle={`Período: ${data.periodLabel}`} loading={loading} error={error} onClose={onClose} filters={<div className="space-y-3"><SegmentedFilter value={category} onChange={(value) => setCategory(value as typeof category)} options={[{ value: "all", label: "Todos" }, { value: "login", label: "Ingresos" }, { value: "navigation", label: "Navegación" }, { value: "resources", label: "Recursos" }, { value: "downloads", label: "Descargas" }, { value: "administration", label: "Administración" }]} /><FilterRow><SearchField value={search} onChange={setSearch} placeholder="Buscar usuario o actividad..." label="Buscar usuario o actividad" /><FilterSelect label="Orden" value={order} onChange={setOrder} options={[{ value: "recent", label: "Más reciente" }, { value: "oldest", label: "Más antigua" }]} /></FilterRow></div>}>
    <ActivityList activity={activity} showDate />
  </MetricsDetailModal>;
}

function ResourceTrend({ resource }: { resource: ResourceAnalysisMetric }) {
  const hasActivity = resource.daily.some((point) => point.opens || point.downloads);
  return <section className="mt-5 rounded-[8px] border border-[#DDE5EA] bg-[#FAFCFD] p-4"><h3 className="text-[14px] font-extrabold text-[#153244]">Actividad de {resource.name}</h3>{hasActivity ? <div className="mt-3 h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={resource.daily} margin={{ top: 8, right: 12, left: -22, bottom: 4 }}><CartesianGrid stroke="#E6EBEF" vertical={false} /><XAxis dataKey="day" tick={{ fontSize: 9, fill: "#536779" }} minTickGap={28} /><YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "#536779" }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} /><Line type="monotone" dataKey="opens" name="Aperturas" stroke="#0878D1" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="downloads" name="Descargas" stroke="#18A56B" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div> : <EmptyState text="Este recurso no tuvo actividad diaria en el período." />}</section>;
}

function SummaryGrid({ children }: { children: ReactNode }) { return <div className="mb-5 grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(145px,1fr))]">{children}</div>; }
function SummaryMetric({ label, value }: { label: string; value: string | number }) { return <div className="min-w-0 rounded-[7px] border border-[#E1E8ED] bg-[#F9FBFC] px-3 py-3"><strong className="block [overflow-wrap:anywhere] text-[18px] font-extrabold leading-tight text-[#061947]">{value}</strong><span className="mt-1 block text-[10px] font-bold leading-tight text-[#607485]">{label}</span></div>; }
function MiniValue({ label, value }: { label: string; value: string | number }) { return <div><strong className="block text-[15px] font-extrabold text-[#061947]">{value}</strong><span className="text-[10px] font-bold text-[#607485]">{label}</span></div>; }
function FilterRow({ children }: { children: ReactNode }) { return <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">{children}</div>; }
function SearchField({ value, placeholder, label, onChange }: { value: string; placeholder: string; label: string; onChange: (value: string) => void }) { return <label className="relative block min-w-0 flex-1"><span className="sr-only">{label}</span><IconSearch aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#536779]" /><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-[7px] border border-[#C7D1DA] bg-white py-2 pl-11 pr-4 text-[12px] font-semibold text-[#153244] outline-none placeholder:text-[#718296] focus:border-[#21AFC0] focus:ring-2 focus:ring-[#21AFC0]/20" /></label>; }
function FilterSelect({ label, value, options, allLabel, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; allLabel?: string; onChange: (value: string) => void }) { return <label className="block min-w-[170px]"><span className="mb-1 block text-[10px] font-extrabold uppercase text-[#536779]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-[7px] border border-[#C7D1DA] bg-white px-3 text-[12px] font-extrabold text-[#153244] outline-none focus:border-[#21AFC0]">{allLabel ? <option value="">{allLabel}</option> : null}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function SegmentedFilter({ value, options, onChange }: { value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) { return <div className="flex max-w-full gap-1 overflow-x-auto pb-1" aria-label="Filtros">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`min-h-10 shrink-0 rounded-[6px] px-3 text-[11px] font-extrabold ${value === option.value ? "bg-[#153244] text-white" : "border border-[#C7D1DA] bg-white text-[#153244] hover:bg-[#EDF7FF]"}`}>{option.label}</button>)}</div>; }
function TableViewport({ children }: { children: ReactNode }) { return <div className="max-w-full overflow-x-auto">{children}</div>; }
function TableHead({ children, align = "left" }: { children: ReactNode; align?: "left" | "right" }) { return <th className={`px-3 py-2 first:pl-0 last:pr-0 ${align === "right" ? "text-right" : "text-left"}`}>{children}</th>; }
function EmptyState({ text }: { text: string }) { return <p className="py-10 text-center text-[12px] font-semibold text-[#718296]">{text}</p>; }
function StatusChip({ state }: { state: MetricsUserState }) { const labels: Record<MetricsUserState, string> = { active: "Activo", pending: "Primer ingreso pendiente", inactive: "Inactivo", unregistered: "Sin acceso" }; const tones: Record<MetricsUserState, string> = { active: "bg-[#E4F7EF] text-[#16865A]", pending: "bg-[#FFF4C7] text-[#8A6500]", inactive: "bg-[#FDECEC] text-[#B52F2F]", unregistered: "bg-[#EEF2F5] text-[#536779]" }; return <span className={`inline-flex rounded-[4px] px-2 py-1 text-[10px] font-extrabold ${tones[state]}`}>{labels[state]}</span>; }
function formatDateTime(value: string | null) { return value ? new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Sin datos"; }
function normalizeSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim(); }

const fileKindLabels: Record<ResourceAnalysisMetric["kind"], string> = { pdf: "PDF", powerpoint: "Presentación", spreadsheet: "Planilla", word: "Documento", image: "Imagen", other: "Otro" };
