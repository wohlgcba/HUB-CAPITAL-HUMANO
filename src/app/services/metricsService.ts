import { supabase } from "../lib/supabaseClient";
import type { AdminMetricsSnapshot, MetricsRange, TopResourceMetric } from "../types/metrics";
import type { ResourceFileKind } from "../types/resources";
import { toServiceError } from "./serviceError";

type AuditRow = { id: string; profile_id: string | null; event_type: string; entity_type: string | null; entity_id: string | null; created_at: string };
type ProfileRow = { id: string; directory_person_id: string | null; full_name: string; role: "user" | "admin"; is_active: boolean; must_change_password: boolean; first_login_at: string | null; last_login_at: string | null; avatar_path: string | null };
type PersonRow = { id: string; area: string; phone: string | null; email: string | null; gcba_building: string | null; is_active: boolean };
type SectionRow = { id: string; title: string; slug: string; is_active: boolean };
type ResourceRow = { id: string; section_id: string; title: string; created_at: string; published_at: string; is_active: boolean };
type FileRow = { resource_id: string; file_kind: ResourceFileKind; sort_order: number };

const sectionColors = ["#0878D1", "#62CFC4", "#FFCC00", "#9A6FD1", "#F28C28"];
const trackedActivity = new Set(["hub_view", "login", "section_view", "resource_view", "resource_download"]);

export async function getMetricsSectionOptions() {
  const { data, error } = await supabase.from("sections").select("id,title").order("sort_order", { ascending: true });
  if (error) throw toServiceError(error, "No se pudieron cargar las secciones para filtrar.");
  return data.map((section) => ({ id: section.id, title: section.title }));
}

export async function getAdminActivityMetrics(range: MetricsRange, sectionId: string): Promise<AdminMetricsSnapshot> {
  const duration = range.end.getTime() - range.start.getTime() + 1;
  const previousRange = { start: new Date(range.start.getTime() - duration), end: new Date(range.start.getTime() - 1) };
  const [profilesResult, peopleResult, sectionsResult, resourcesResult, filesResult, events] = await Promise.all([
    supabase.from("profiles").select("id,directory_person_id,full_name,role,is_active,must_change_password,first_login_at,last_login_at,avatar_path"),
    supabase.from("directory_people").select("id,area,phone,email,gcba_building,is_active"),
    supabase.from("sections").select("id,title,slug,is_active").order("sort_order", { ascending: true }),
    supabase.from("section_resources").select("id,section_id,title,created_at,published_at,is_active"),
    supabase.from("resource_files").select("resource_id,file_kind,sort_order").order("sort_order", { ascending: true }),
    getAuditEvents(previousRange.start, range.end),
  ]);
  const firstError = profilesResult.error || peopleResult.error || sectionsResult.error || resourcesResult.error || filesResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron calcular las métricas.");

  const profiles = profilesResult.data as ProfileRow[];
  const userProfiles = profiles.filter((profile) => profile.role === "user");
  const userProfileIds = new Set(userProfiles.map((profile) => profile.id));
  const people = peopleResult.data as PersonRow[];
  const sections = sectionsResult.data as SectionRow[];
  const resources = resourcesResult.data as ResourceRow[];
  const files = filesResult.data as FileRow[];
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const sectionById = new Map(sections.map((section) => [section.id, section]));
  const profileById = new Map(userProfiles.map((profile) => [profile.id, profile]));
  const personById = new Map(people.map((person) => [person.id, person]));
  const firstFileKind = new Map<string, ResourceFileKind>();
  for (const file of files) if (!firstFileKind.has(file.resource_id)) firstFileKind.set(file.resource_id, file.file_kind);

  const userEvents = events.filter((event) => Boolean(event.profile_id && userProfileIds.has(event.profile_id)));
  const currentEvents = userEvents.filter((event) => isWithin(event.created_at, range) && matchesSection(event, sectionId, resourceById));
  const previousEvents = userEvents.filter((event) => isWithin(event.created_at, previousRange) && matchesSection(event, sectionId, resourceById));
  const activeProfileIds = uniqueProfiles(currentEvents.filter((event) => trackedActivity.has(event.event_type)));
  const previousActiveProfileIds = uniqueProfiles(previousEvents.filter((event) => trackedActivity.has(event.event_type)));
  const visits = countVisits(currentEvents, Boolean(sectionId));
  const previousVisits = countVisits(previousEvents, Boolean(sectionId));
  const resourceViews = countType(currentEvents, "resource_view");
  const previousResourceViews = countType(previousEvents, "resource_view");
  const downloads = countType(currentEvents, "resource_download");
  const previousDownloads = countType(previousEvents, "resource_download");
  const enabledUsers = userProfiles.filter((profile) => profile.is_active && profile.first_login_at).length;

  const kpis = [
    { id: "active-users", title: "Usuarios activos", value: activeProfileIds.size, detail: `de ${enabledUsers} usuarios habilitados`, changePercent: percentageChange(activeProfileIds.size, previousActiveProfileIds.size), tone: "blue" as const, icon: "users" as const },
    { id: "hub-visits", title: sectionId ? "Visitas a la sección" : "Visitas al HUB", value: visits, detail: "sesiones registradas en el período", changePercent: percentageChange(visits, previousVisits), tone: "green" as const, icon: "visits" as const },
    { id: "opened-resources", title: "Recursos abiertos", value: resourceViews, detail: "aperturas de recursos", changePercent: percentageChange(resourceViews, previousResourceViews), tone: "yellow" as const, icon: "resources" as const },
    { id: "downloads", title: "Descargas", value: downloads, detail: "archivos descargados", changePercent: percentageChange(downloads, previousDownloads), tone: "violet" as const, icon: "downloads" as const },
  ];

  const sectionViewCounts = new Map<string, number>();
  for (const event of currentEvents) {
    const eventSectionId = getEventSectionId(event, resourceById);
    if (eventSectionId && ["section_view", "resource_view"].includes(event.event_type)) sectionViewCounts.set(eventSectionId, (sectionViewCounts.get(eventSectionId) ?? 0) + 1);
  }
  const totalSectionVisits = [...sectionViewCounts.values()].reduce((total, value) => total + value, 0);
  const topSections = [...sectionViewCounts.entries()].flatMap(([id, sectionVisits]) => {
    const section = sectionById.get(id);
    return section ? [{ id, slug: section.slug, name: section.title, visits: sectionVisits, percentage: totalSectionVisits ? Math.round((sectionVisits / totalSectionVisits) * 100) : 0 }] : [];
  }).sort((a, b) => b.visits - a.visits).slice(0, 5).map((section, index) => ({ ...section, color: sectionColors[index % sectionColors.length] }));

  const topResources = buildTopResources(currentEvents, resources, sectionById, firstFileKind, sectionId);
  const adminPersonIds = new Set(profiles.filter((profile) => profile.role === "admin" && profile.directory_person_id).map((profile) => profile.directory_person_id));
  const activePeople = people.filter((person) => person.is_active && !adminPersonIds.has(person.id));
  const activePersonIds = new Set(activePeople.map((person) => person.id));
  const noActivityThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const activeProfiles = userProfiles.filter((profile) => profile.is_active && Boolean(profile.directory_person_id && activePersonIds.has(profile.directory_person_id)));
  const firstLoginProfiles = activeProfiles.filter((profile) => Boolean(profile.first_login_at));
  const pendingFirstLogin = activeProfiles.filter((profile) => !profile.first_login_at);
  const noActivity = firstLoginProfiles.filter((profile) => !profile.last_login_at || new Date(profile.last_login_at).getTime() < noActivityThreshold);
  const userStatus = [
    { value: activePeople.length, label: "Usuarios en el Directorio", tone: "blue" as const, icon: "registered" as const },
    { value: firstLoginProfiles.length, label: "Usuarios habilitados", tone: "green" as const, icon: "active" as const },
    { value: pendingFirstLogin.length, label: "Pendientes de primer ingreso", tone: "yellow" as const, icon: "pending" as const },
    { value: noActivity.length, label: "Sin actividad en 30 días", tone: "violet" as const, icon: "inactive" as const },
  ];
  const lowActivityUsers = [...pendingFirstLogin, ...noActivity].sort((a, b) => (dateValue(a.last_login_at) - dateValue(b.last_login_at))).slice(0, 5).map((profile) => ({ name: profile.full_name, area: profile.directory_person_id ? personById.get(profile.directory_person_id)?.area ?? "Sin especificar" : "Sin especificar", lastAccess: formatLastAccess(profile.last_login_at) }));

  const profilesByArea = new Map<string, ProfileRow[]>();
  for (const profile of userProfiles) {
    const area = profile.directory_person_id ? personById.get(profile.directory_person_id)?.area ?? "Sin especificar" : "Sin especificar";
    profilesByArea.set(area, [...(profilesByArea.get(area) ?? []), profile]);
  }
  const areaParticipation = [...profilesByArea.entries()].map(([area, areaProfiles]) => {
    const active = areaProfiles.filter((profile) => activeProfileIds.has(profile.id)).length;
    return { area, users: areaProfiles.length, active, percentage: areaProfiles.length ? Math.round((active / areaProfiles.length) * 100) : 0 };
  }).sort((a, b) => b.active - a.active || b.users - a.users).slice(0, 8);

  const profileByPerson = new Map(userProfiles.flatMap((profile) => profile.directory_person_id ? [[profile.directory_person_id, profile] as const] : []));
  const completeProfiles = activePeople.filter((person) => Boolean(person.phone && person.email && person.gcba_building)).length;
  const directoryStatus = [
    { value: activePeople.length, label: "Integrantes totales", icon: "users" as const, tone: "blue" as const },
    { value: activePeople.filter((person) => Boolean(person.phone)).length, label: "Con celular", icon: "phone" as const, tone: "cyan" as const },
    { value: activePeople.filter((person) => Boolean(person.email)).length, label: "Con mail", icon: "mail" as const, tone: "green" as const },
    { value: activePeople.filter((person) => Boolean(person.gcba_building)).length, label: "Con edificio", icon: "building" as const, tone: "blue" as const },
    { value: activePeople.filter((person) => Boolean(profileByPerson.get(person.id)?.avatar_path)).length, label: "Con foto de perfil", icon: "photo" as const, tone: "violet" as const },
  ];

  return {
    periodLabel: `${formatDate(range.start)} - ${formatDate(range.end)}`,
    kpis,
    activity: buildActivitySeries(currentEvents, range, Boolean(sectionId)),
    topSections,
    topResources,
    userStatus,
    lowActivityUsers,
    areaParticipation,
    directoryStatus,
    directoryCompletion: { percentage: activePeople.length ? Math.round((completeProfiles / activePeople.length) * 100) : 0, complete: completeProfiles, total: activePeople.length },
    recentActivity: buildRecentActivity(currentEvents, profileById, resourceById, sectionById),
    sectionOptions: sections.map((section) => ({ id: section.id, title: section.title })),
  };
}

async function getAuditEvents(start: Date, end: Date) {
  const rows: AuditRow[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase.from("audit_events").select("id,profile_id,event_type,entity_type,entity_id,created_at").gte("created_at", start.toISOString()).lte("created_at", end.toISOString()).order("created_at", { ascending: false }).range(from, from + pageSize - 1);
    if (error) throw toServiceError(error, "No se pudo cargar la actividad registrada.");
    rows.push(...(data as AuditRow[]));
    if (data.length < pageSize) break;
  }
  return rows;
}

function matchesSection(event: AuditRow, sectionId: string, resources: Map<string, ResourceRow>) { return !sectionId || getEventSectionId(event, resources) === sectionId; }
function getEventSectionId(event: AuditRow, resources: Map<string, ResourceRow>) { return event.entity_type === "section" ? event.entity_id : event.entity_type === "resource" && event.entity_id ? resources.get(event.entity_id)?.section_id ?? null : null; }
function isWithin(value: string, range: MetricsRange) { const time = new Date(value).getTime(); return time >= range.start.getTime() && time <= range.end.getTime(); }
function uniqueProfiles(events: AuditRow[]) { return new Set(events.flatMap((event) => event.profile_id ? [event.profile_id] : [])); }
function countType(events: AuditRow[], type: string) { return events.filter((event) => event.event_type === type).length; }
function countVisits(events: AuditRow[], scoped: boolean) { return scoped ? countType(events, "section_view") : countType(events, "hub_view"); }
function percentageChange(current: number, previous: number) { if (previous === 0) return current === 0 ? 0 : null; return Math.round(((current - previous) / previous) * 100); }

function buildTopResources(events: AuditRow[], resources: ResourceRow[], sections: Map<string, SectionRow>, fileKinds: Map<string, ResourceFileKind>, sectionId: string): TopResourceMetric[] {
  const opens = new Map<string, number>(); const downloads = new Map<string, number>();
  for (const event of events) {
    if (!event.entity_id) continue;
    if (event.event_type === "resource_view") opens.set(event.entity_id, (opens.get(event.entity_id) ?? 0) + 1);
    if (event.event_type === "resource_download") downloads.set(event.entity_id, (downloads.get(event.entity_id) ?? 0) + 1);
  }
  return resources.filter((resource) => !sectionId || resource.section_id === sectionId).map((resource, index) => {
    const openCount = opens.get(resource.id) ?? 0; const downloadCount = downloads.get(resource.id) ?? 0;
    return { id: resource.id, sectionId: resource.section_id, name: resource.title, section: sections.get(resource.section_id)?.title ?? "Sección eliminada", opens: openCount, downloads: downloadCount, rate: openCount ? Math.round((downloadCount / openCount) * 100) : 0, kind: fileKinds.get(resource.id) ?? "other", tone: (["blue", "yellow", "cyan"] as const)[index % 3] };
  }).filter((resource) => resource.opens > 0 || resource.downloads > 0).sort((a, b) => b.opens - a.opens || b.downloads - a.downloads).slice(0, 5);
}

function buildActivitySeries(events: AuditRow[], range: MetricsRange, scoped: boolean) {
  const days = eachDay(range.start, range.end);
  const bucketSize = days.length > 120 ? 30 : days.length > 45 ? 7 : 1;
  const points = [];
  for (let index = 0; index < days.length; index += bucketSize) {
    const start = days[index]; const next = days[Math.min(days.length, index + bucketSize) - 1]; const end = endOfDay(next);
    const bucketEvents = events.filter((event) => isWithin(event.created_at, { start, end }));
    points.push({ day: bucketSize === 1 ? new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "2-digit" }).format(start) : `${formatShortDate(start)}–${formatShortDate(next)}`, activeUsers: uniqueProfiles(bucketEvents.filter((event) => trackedActivity.has(event.event_type))).size, visits: countVisits(bucketEvents, scoped) });
  }
  return points;
}

function buildRecentActivity(events: AuditRow[], profiles: Map<string, ProfileRow>, resources: Map<string, ResourceRow>, sections: Map<string, SectionRow>) {
  return events.filter((event) => ["hub_view", "login", "resource_view", "resource_download", "resource_published", "section_view"].includes(event.event_type)).slice(0, 8).map((event) => {
    const person = event.profile_id ? profiles.get(event.profile_id)?.full_name ?? "Un usuario" : "Un usuario";
    const resource = event.entity_id ? resources.get(event.entity_id)?.title : null;
    const section = event.entity_id ? sections.get(event.entity_id)?.title : null;
    const definitions = {
      login: { text: `${person} ingresó al HUB`, icon: "login" as const, tone: "blue" as const },
      hub_view: { text: `${person} visitó el HUB`, icon: "login" as const, tone: "blue" as const },
      resource_view: { text: `${person} abrió “${resource ?? "un recurso"}”`, icon: "open" as const, tone: "violet" as const },
      resource_download: { text: `${person} descargó “${resource ?? "un recurso"}”`, icon: "download" as const, tone: "cyan" as const },
      resource_published: { text: `${person} publicó “${resource ?? "un recurso"}”`, icon: "publish" as const, tone: "blue" as const },
      section_view: { text: `${person} visitó “${section ?? "una sección"}”`, icon: "open" as const, tone: "yellow" as const },
    };
    return { id: event.id, ...definitions[event.event_type as keyof typeof definitions], time: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(new Date(event.created_at)) };
  });
}

function eachDay(start: Date, end: Date) { const days: Date[] = []; const cursor = startOfDay(start); while (cursor <= end) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); } return days; }
function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; }
function endOfDay(date: Date) { const copy = new Date(date); copy.setHours(23, 59, 59, 999); return copy; }
function dateValue(value: string | null) { return value ? new Date(value).getTime() : 0; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("es-AR").format(date); }
function formatShortDate(date: Date) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date); }
function formatLastAccess(value: string | null) { if (!value) return "Nunca ingresó"; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); return days <= 0 ? "Hoy" : `Hace ${days} ${days === 1 ? "día" : "días"}`; }
