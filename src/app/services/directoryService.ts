import { supabase } from "../lib/supabaseClient";
import type {
  DirectoryFilterOption,
  DirectoryFilterOptions,
  DirectoryLinkType,
  DirectoryPersonDetail,
  DirectoryPersonSummary,
  DirectoryQuery,
  DirectoryResult,
} from "../types/directory";
import { getAdminPersonAccess } from "./adminService";
import { toServiceError } from "./serviceError";
import { getSignedAssetUrls } from "./storageService";

type PersonSummaryRow = {
  id: string;
  area: string;
  full_name: string;
  job_role: string | null;
  is_active: boolean;
};

type PersonDetailRow = PersonSummaryRow & {
  phone: string | null;
  email: string | null;
  gcba_building: string | null;
};

type LinkTypeRow = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

type PersonLinkRow = {
  person_id: string;
  link_type_id: string;
};

type ProfileSummaryRow = {
  directory_person_id: string | null;
  role: "user" | "admin";
  avatar_path: string | null;
};

export async function getDirectoryFilterOptions(includeInactive = false): Promise<DirectoryFilterOptions> {
  let peopleQuery = supabase.from("directory_people").select("id,area,gcba_building,is_active");
  if (!includeInactive) peopleQuery = peopleQuery.eq("is_active", true);
  const [peopleResult, linkTypesResult, personLinksResult] = await Promise.all([
    peopleQuery,
    supabase.from("link_types").select("id,name,color,sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("directory_person_link_types").select("person_id,link_type_id"),
  ]);

  const firstError = peopleResult.error || linkTypesResult.error || personLinksResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron cargar los filtros del Directorio.");
  const people = peopleResult.data;
  const visiblePersonIds = new Set(people.map((person) => person.id));
  const linkCounts = countValues(
    personLinksResult.data.filter((row) => visiblePersonIds.has(row.person_id)).map((row) => row.link_type_id),
  );

  return {
    total: people.length,
    areas: toFilterOptions(people.map((person) => person.area)),
    buildings: toFilterOptions(people.flatMap((person) => (person.gcba_building ? [person.gcba_building] : []))),
    statuses: [
      { value: "active", label: "Activos", count: people.filter((person) => person.is_active).length },
      { value: "inactive", label: "Inactivos", count: people.filter((person) => !person.is_active).length },
    ],
    linkTypes: (linkTypesResult.data as LinkTypeRow[]).map((linkType) => ({
      value: linkType.id,
      label: linkType.name,
      color: linkType.color,
      count: linkCounts.get(linkType.id) ?? 0,
    })),
  };
}

export async function searchDirectory(query: DirectoryQuery): Promise<DirectoryResult> {
  let allowedPersonIds: string[] | null = null;
  if (query.linkTypeId) {
    const linkResult = await supabase
      .from("directory_person_link_types")
      .select("person_id")
      .eq("link_type_id", query.linkTypeId);
    if (linkResult.error) throw toServiceError(linkResult.error, "No se pudo aplicar el filtro de tipo de enlace.");
    allowedPersonIds = linkResult.data.map((row) => row.person_id);
    if (allowedPersonIds.length === 0) return { people: [], filteredTotal: 0 };
  }

  let peopleQuery = supabase
    .from("directory_people")
    .select("id,area,full_name,job_role,is_active", { count: "exact" })
    .order("full_name", { ascending: true });

  if (!query.includeInactive) peopleQuery = peopleQuery.eq("is_active", true);
  if (query.status === "active") peopleQuery = peopleQuery.eq("is_active", true);
  if (query.status === "inactive") peopleQuery = peopleQuery.eq("is_active", false);
  if (query.area) peopleQuery = peopleQuery.eq("area", query.area);
  if (query.building) peopleQuery = peopleQuery.eq("gcba_building", query.building);
  if (allowedPersonIds) peopleQuery = peopleQuery.in("id", allowedPersonIds);

  const searchTerm = sanitizeSearch(query.search);
  if (searchTerm) {
    const pattern = `%${searchTerm}%`;
    peopleQuery = peopleQuery.or(
      `full_name.ilike.${pattern},area.ilike.${pattern},email.ilike.${pattern},gcba_building.ilike.${pattern},job_role.ilike.${pattern}`,
    );
  }

  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;
  const { data, error, count } = await peopleQuery.range(from, to);
  if (error) throw toServiceError(error, "No se pudo consultar el Directorio.");

  const peopleRows = data as PersonSummaryRow[];
  const personIds = peopleRows.map((person) => person.id);
  const [linksByPerson, profilesByPerson] = await Promise.all([
    getLinksByPerson(personIds),
    getProfilesByPerson(personIds),
  ]);
  const avatarUrlsByPerson = await getAvatarUrlsByPerson(profilesByPerson);

  return {
    filteredTotal: count ?? 0,
    people: peopleRows.map((person) =>
      mapSummary(
        person,
        linksByPerson.get(person.id) ?? [],
        profilesByPerson.get(person.id) ?? null,
        avatarUrlsByPerson.get(person.id) ?? null,
      ),
    ),
  };
}

export async function getDirectoryPersonDetail(personId: string, includeInactive = false): Promise<DirectoryPersonDetail | null> {
  let query = supabase
    .from("directory_people")
    .select("id,area,full_name,job_role,phone,email,gcba_building,is_active")
    .eq("id", personId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle<PersonDetailRow>();
  if (error) throw toServiceError(error, "No se pudo cargar el perfil del integrante.");
  if (!data) return null;

  const [linksByPerson, profilesByPerson] = await Promise.all([
    getLinksByPerson([personId]),
    getProfilesByPerson([personId]),
  ]);
  const avatarUrlsByPerson = await getAvatarUrlsByPerson(profilesByPerson);
  return {
    ...mapSummary(
      data,
      linksByPerson.get(personId) ?? [],
      profilesByPerson.get(personId) ?? null,
      avatarUrlsByPerson.get(personId) ?? null,
    ),
    phone: data.phone,
    email: data.email,
    building: data.gcba_building,
  };
}

export async function getAdminDirectoryPersonDetail(personId: string): Promise<DirectoryPersonDetail | null> {
  const detail = await getDirectoryPersonDetail(personId, true);
  if (!detail) return null;
  const access = await getAdminPersonAccess(personId);
  return {
    ...detail,
    cuit: access.cuit,
    systemRole: access.profileId ? access.systemRole : null,
    hasAccount: Boolean(access.authUserId),
    accountIsActive: access.accountIsActive,
    mustChangePassword: access.mustChangePassword,
    firstLoginAt: access.firstLoginAt,
    lastLoginAt: access.lastLoginAt,
  };
}

async function getLinksByPerson(personIds: string[]) {
  const result = new Map<string, DirectoryLinkType[]>();
  if (personIds.length === 0) return result;
  const [personLinksResult, linkTypesResult] = await Promise.all([
    supabase.from("directory_person_link_types").select("person_id,link_type_id").in("person_id", personIds),
    supabase.from("link_types").select("id,name,color,sort_order").eq("is_active", true),
  ]);
  const firstError = personLinksResult.error || linkTypesResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron cargar los tipos de enlace.");

  const typesById = new Map(
    (linkTypesResult.data as LinkTypeRow[]).map((linkType) => [
      linkType.id,
      { id: linkType.id, name: linkType.name, color: linkType.color, sortOrder: linkType.sort_order },
    ]),
  );
  for (const relation of personLinksResult.data as PersonLinkRow[]) {
    const linkType = typesById.get(relation.link_type_id);
    if (!linkType) continue;
    const current = result.get(relation.person_id) ?? [];
    current.push(linkType);
    current.sort((first, second) => first.sortOrder - second.sortOrder);
    result.set(relation.person_id, current);
  }
  return result;
}

async function getProfilesByPerson(personIds: string[]) {
  const result = new Map<string, ProfileSummaryRow>();
  if (personIds.length === 0) return result;
  const { data, error } = await supabase
    .from("profiles")
    .select("directory_person_id,role,avatar_path")
    .in("directory_person_id", personIds);
  if (error) throw toServiceError(error, "No se pudo cargar el estado de los usuarios.");
  for (const profile of data as ProfileSummaryRow[]) {
    if (profile.directory_person_id) result.set(profile.directory_person_id, profile);
  }
  return result;
}

async function getAvatarUrlsByPerson(profilesByPerson: Map<string, ProfileSummaryRow>) {
  const profiles = [...profilesByPerson.entries()];
  const serverUrls = await requestDirectoryAvatarUrls(profiles.map(([personId]) => personId));
  if (serverUrls) return serverUrls;
  const urlsByPath = await getSignedAssetUrls("profile-avatars", profiles.map(([, profile]) => profile.avatar_path));
  return new Map(profiles.map(([personId, profile]) => [personId, profile.avatar_path ? urlsByPath.get(profile.avatar_path) ?? null : null]));
}

async function requestDirectoryAvatarUrls(personIds: string[]) {
  if (personIds.length === 0) return new Map<string, string | null>();
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) return null;
    const response = await fetch("/api/directory-avatars", {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ personIds }),
    });
    if (!response.ok) return null;
    const payload = await response.json() as { avatars?: Record<string, string | null> };
    return new Map(Object.entries(payload.avatars ?? {}));
  } catch {
    return null;
  }
}

function mapSummary(
  row: PersonSummaryRow,
  linkTypes: DirectoryLinkType[],
  profile: ProfileSummaryRow | null,
  avatarUrl: string | null,
): DirectoryPersonSummary {
  return {
    id: row.id,
    name: row.full_name,
    area: row.area,
    role: row.job_role,
    linkTypes,
    avatarUrl,
    isActive: row.is_active,
    systemRole: profile?.role ?? null,
    hasAccount: Boolean(profile),
  };
}

function toFilterOptions(values: string[]): DirectoryFilterOption[] {
  const counts = countValues(values);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((first, second) => first.label.localeCompare(second.label, "es-AR"));
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

function sanitizeSearch(value: string) {
  return value.trim().replace(/[,%()]/g, " ").replace(/\s+/g, " ");
}
