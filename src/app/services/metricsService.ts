import { supabase } from "../lib/supabaseClient";
import type {
  AdminMetricsSnapshot,
  AreaAnalysisMetric,
  IncompleteDirectoryProfile,
  MetricsRange,
  MetricsUserState,
  ResourceAnalysisMetric,
  SectionAnalysisMetric,
  UserAnalysisMetric,
} from "../types/metrics";
import type { ResourceFileKind } from "../types/resources";
import { toServiceError } from "./serviceError";

type AuditRow = { id: string; profile_id: string | null; event_type: string; entity_type: string | null; entity_id: string | null; created_at: string };
type ProfileRow = { id: string; directory_person_id: string | null; full_name: string; role: "user" | "admin"; is_active: boolean; must_change_password: boolean; first_login_at: string | null; last_login_at: string | null; avatar_path: string | null };
type PersonRow = { id: string; full_name: string; area: string; phone: string | null; email: string | null; gcba_building: string | null; is_active: boolean };
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
    supabase.from("directory_people").select("id,full_name,area,phone,email,gcba_building,is_active"),
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
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const personById = new Map(people.map((person) => [person.id, person]));
  const firstFileKind = new Map<string, ResourceFileKind>();
  for (const file of files) if (!firstFileKind.has(file.resource_id)) firstFileKind.set(file.resource_id, file.file_kind);

  const userEvents = events.filter((event) => Boolean(event.profile_id && userProfileIds.has(event.profile_id)));
  const allCurrentEvents = events.filter((event) => isWithin(event.created_at, range) && matchesSection(event, sectionId, resourceById));
  const currentEvents = allCurrentEvents.filter((event) => Boolean(event.profile_id && userProfileIds.has(event.profile_id)));
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

  const sectionAnalysis = buildSectionAnalysis(currentEvents, sections, resources, sectionId);
  const topSections = sectionAnalysis.filter((section) => section.visits > 0 || section.resourceOpens > 0).slice(0, 5);
  const resourceAnalysis = buildResourceAnalysis(currentEvents, resources, sectionById, firstFileKind, sectionId, range);
  const topResources = resourceAnalysis.filter((resource) => resource.opens > 0 || resource.downloads > 0).slice(0, 5);
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

  const profileByPerson = new Map(userProfiles.flatMap((profile) => profile.directory_person_id ? [[profile.directory_person_id, profile] as const] : []));
  const userAnalysis = buildUserAnalysis(activePeople, profileByPerson, currentEvents, sectionId, noActivityThreshold);
  const areaAnalysis = buildAreaAnalysis(activePeople, profileByPerson, currentEvents, activeProfileIds, sectionId);
  const areaParticipation = areaAnalysis.slice(0, 8).map((area) => ({ area: area.area, users: area.members, active: area.active, percentage: area.percentage }));
  const incompleteProfiles = buildIncompleteProfiles(activePeople, profileByPerson);
  const completeProfiles = activePeople.length - incompleteProfiles.length;
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
    recentActivity: buildRecentActivity(allCurrentEvents, profileById, resourceById, sectionById),
    sectionAnalysis,
    resourceAnalysis,
    userAnalysis,
    areaAnalysis,
    incompleteProfiles,
    sectionOptions: sections.filter((section) => section.is_active).map((section) => ({ id: section.id, title: section.title })),
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

function buildSectionAnalysis(events: AuditRow[], sections: SectionRow[], resources: ResourceRow[], sectionId: string): SectionAnalysisMetric[] {
  const resourceSectionById = new Map(resources.map((resource) => [resource.id, resource.section_id]));
  const sectionVisits = new Map<string, AuditRow[]>();
  const sectionResourceOpens = new Map<string, number>();
  for (const event of events) {
    if (event.event_type === "section_view" && event.entity_id) sectionVisits.set(event.entity_id, [...(sectionVisits.get(event.entity_id) ?? []), event]);
    if (event.event_type === "resource_view" && event.entity_id) {
      const eventSectionId = resourceSectionById.get(event.entity_id);
      if (eventSectionId) sectionResourceOpens.set(eventSectionId, (sectionResourceOpens.get(eventSectionId) ?? 0) + 1);
    }
  }
  const visibleSections = sections.filter((section) => section.is_active && (!sectionId || section.id === sectionId));
  const totalVisits = visibleSections.reduce((total, section) => total + (sectionVisits.get(section.id)?.length ?? 0), 0);
  return visibleSections.map((section) => {
    const visits = sectionVisits.get(section.id) ?? [];
    return { id: section.id, slug: section.slug, name: section.title, visits: visits.length, uniqueUsers: uniqueProfiles(visits).size, percentage: totalVisits ? Math.round((visits.length / totalVisits) * 100) : 0, resourceOpens: sectionResourceOpens.get(section.id) ?? 0, color: sectionColors[0] };
  }).sort((first, second) => second.visits - first.visits || second.resourceOpens - first.resourceOpens || first.name.localeCompare(second.name, "es-AR")).map((section, index) => ({ ...section, color: sectionColors[index % sectionColors.length] }));
}

function buildResourceAnalysis(events: AuditRow[], resources: ResourceRow[], sections: Map<string, SectionRow>, fileKinds: Map<string, ResourceFileKind>, sectionId: string, range: MetricsRange): ResourceAnalysisMetric[] {
  return resources.filter((resource) => resource.is_active && (!sectionId || resource.section_id === sectionId)).map((resource, index) => {
    const resourceEvents = events.filter((event) => event.entity_id === resource.id);
    const openEvents = resourceEvents.filter((event) => event.event_type === "resource_view");
    const downloadEvents = resourceEvents.filter((event) => event.event_type === "resource_download");
    const daily = eachDay(range.start, range.end).map((day) => {
      const dayRange = { start: startOfDay(day), end: endOfDay(day) };
      return { day: formatShortDate(day), opens: openEvents.filter((event) => isWithin(event.created_at, dayRange)).length, downloads: downloadEvents.filter((event) => isWithin(event.created_at, dayRange)).length };
    });
    return { id: resource.id, sectionId: resource.section_id, name: resource.title, section: sections.get(resource.section_id)?.title ?? "Sección eliminada", opens: openEvents.length, uniqueUsers: uniqueProfiles(openEvents).size, downloads: downloadEvents.length, rate: openEvents.length ? Math.round((downloadEvents.length / openEvents.length) * 100) : 0, kind: fileKinds.get(resource.id) ?? "other", tone: (["blue", "yellow", "cyan"] as const)[index % 3], daily };
  }).sort((first, second) => second.opens - first.opens || second.downloads - first.downloads || first.name.localeCompare(second.name, "es-AR"));
}

function buildUserAnalysis(people: PersonRow[], profiles: Map<string, ProfileRow>, events: AuditRow[], sectionId: string, inactiveThreshold: number): UserAnalysisMetric[] {
  return people.map((person) => {
    const profile = profiles.get(person.id);
    const profileEvents = profile ? events.filter((event) => event.profile_id === profile.id) : [];
    let state: MetricsUserState = "unregistered";
    if (profile && !profile.first_login_at) state = "pending";
    else if (profile && (!profile.is_active || !profile.last_login_at || new Date(profile.last_login_at).getTime() < inactiveThreshold)) state = "inactive";
    else if (profile) state = "active";
    return { id: person.id, name: person.full_name, area: person.area, state, firstLoginAt: profile?.first_login_at ?? null, lastLoginAt: profile?.last_login_at ?? null, visits: countVisits(profileEvents, Boolean(sectionId)) };
  }).sort((first, second) => first.name.localeCompare(second.name, "es-AR"));
}

function buildAreaAnalysis(people: PersonRow[], profiles: Map<string, ProfileRow>, events: AuditRow[], activeProfileIds: Set<string>, sectionId: string): AreaAnalysisMetric[] {
  const peopleByArea = new Map<string, PersonRow[]>();
  for (const person of people) peopleByArea.set(person.area, [...(peopleByArea.get(person.area) ?? []), person]);
  return [...peopleByArea.entries()].map(([area, areaPeople]) => {
    const profileIds = new Set(areaPeople.flatMap((person) => { const profile = profiles.get(person.id); return profile ? [profile.id] : []; }));
    const areaEvents = events.filter((event) => Boolean(event.profile_id && profileIds.has(event.profile_id)));
    const active = [...profileIds].filter((profileId) => activeProfileIds.has(profileId)).length;
    return { area, members: areaPeople.length, active, percentage: areaPeople.length ? Math.round((active / areaPeople.length) * 100) : 0, visits: countVisits(areaEvents, Boolean(sectionId)), resourceOpens: countType(areaEvents, "resource_view") };
  }).sort((first, second) => second.percentage - first.percentage || second.active - first.active || first.area.localeCompare(second.area, "es-AR"));
}

function buildIncompleteProfiles(people: PersonRow[], profiles: Map<string, ProfileRow>): IncompleteDirectoryProfile[] {
  return people.flatMap((person) => {
    const profile = profiles.get(person.id);
    const missingFields: IncompleteDirectoryProfile["missingFields"] = [];
    if (!person.email) missingFields.push("mail");
    if (!person.phone) missingFields.push("celular");
    if (!person.gcba_building) missingFields.push("edificio");
    if (!profile?.avatar_path) missingFields.push("foto");
    return missingFields.length ? [{ id: person.id, name: person.full_name, area: person.area, missingFields }] : [];
  }).sort((first, second) => second.missingFields.length - first.missingFields.length || first.name.localeCompare(second.name, "es-AR"));
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
  return events.flatMap((event) => {
    const profile = event.profile_id ? profiles.get(event.profile_id) : null;
    const actor = profile?.full_name ?? "Un usuario";
    const resource = event.entity_id ? resources.get(event.entity_id)?.title : null;
    const section = event.entity_id ? sections.get(event.entity_id)?.title : null;
    const isAdministration = profile?.role === "admin" || event.event_type.startsWith("directory_") || event.event_type.startsWith("profile_");
    const definitions: Record<string, { action: string; category: "login" | "navigation" | "resources" | "downloads" | "administration"; icon: "open" | "login" | "download" | "publish"; tone: "blue" | "cyan" | "yellow" | "violet" }> = {
      login: { action: "ingresó al HUB", category: "login", icon: "login", tone: "blue" },
      hub_view: { action: "visitó el HUB", category: "navigation", icon: "login", tone: "blue" },
      section_view: { action: `visitó “${section ?? "una sección"}”`, category: "navigation", icon: "open", tone: "yellow" },
      resource_view: { action: `abrió “${resource ?? "un recurso"}”`, category: "resources", icon: "open", tone: "violet" },
      resource_download: { action: `descargó “${resource ?? "un recurso"}”`, category: "downloads", icon: "download", tone: "cyan" },
      resource_published: { action: `publicó “${resource ?? "un recurso"}”`, category: "administration", icon: "publish", tone: "blue" },
      resource_submitted: { action: `propuso “${resource ?? "un recurso"}”`, category: "resources", icon: "publish", tone: "violet" },
      resource_reaction: { action: `reaccionó a “${resource ?? "un recurso"}”`, category: "resources", icon: "open", tone: "violet" },
      directory_person_created: { action: "añadió una persona al Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_person_updated: { action: "actualizó una persona del Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_person_reactivated: { action: "reactivó una persona del Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_person_deactivated: { action: "desactivó una persona del Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_person_deleted: { action: "eliminó una persona del Directorio", category: "administration", icon: "publish", tone: "blue" },
      profile_contact_updated: { action: "actualizó sus datos de contacto", category: "administration", icon: "publish", tone: "blue" },
      directory_change_requested: { action: "solicitó un cambio en el Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_change_approved: { action: "aprobó un cambio del Directorio", category: "administration", icon: "publish", tone: "blue" },
      directory_change_rejected: { action: "rechazó un cambio del Directorio", category: "administration", icon: "publish", tone: "blue" },
    };
    const definition = definitions[event.event_type];
    if (!definition && !isAdministration) return [];
    const activity = definition ?? { action: event.event_type.replaceAll("_", " "), category: "administration" as const, icon: "publish" as const, tone: "blue" as const };
    const occurredAt = new Date(event.created_at);
    return [{
      id: event.id,
      actor,
      action: activity.action,
      searchText: normalizeSearch(`${actor} ${activity.action}`),
      category: isAdministration ? "administration" as const : activity.category,
      occurredAt: event.created_at,
      date: new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(occurredAt),
      time: new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit" }).format(occurredAt),
      icon: activity.icon,
      tone: activity.tone,
    }];
  });
}

function eachDay(start: Date, end: Date) { const days: Date[] = []; const cursor = startOfDay(start); while (cursor <= end) { days.push(new Date(cursor)); cursor.setDate(cursor.getDate() + 1); } return days; }
function startOfDay(date: Date) { const copy = new Date(date); copy.setHours(0, 0, 0, 0); return copy; }
function endOfDay(date: Date) { const copy = new Date(date); copy.setHours(23, 59, 59, 999); return copy; }
function dateValue(value: string | null) { return value ? new Date(value).getTime() : 0; }
function formatDate(date: Date) { return new Intl.DateTimeFormat("es-AR").format(date); }
function formatShortDate(date: Date) { return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit" }).format(date); }
function formatLastAccess(value: string | null) { if (!value) return "Nunca ingresó"; const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); return days <= 0 ? "Hoy" : `Hace ${days} ${days === 1 ? "día" : "días"}`; }
function normalizeSearch(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR"); }
