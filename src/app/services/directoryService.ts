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
import { toServiceError } from "./serviceError";

type PersonSummaryRow = {
  id: string;
  area: string;
  full_name: string;
  job_role: string | null;
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

export async function getDirectoryFilterOptions(): Promise<DirectoryFilterOptions> {
  const [peopleResult, linkTypesResult, personLinksResult] = await Promise.all([
    supabase.from("directory_people").select("id,area,gcba_building").eq("is_active", true),
    supabase.from("link_types").select("id,name,color,sort_order").eq("is_active", true).order("sort_order"),
    supabase.from("directory_person_link_types").select("person_id,link_type_id"),
  ]);

  const firstError = peopleResult.error || linkTypesResult.error || personLinksResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron cargar los filtros del Directorio.");

  const people = peopleResult.data;
  const linkCounts = countValues(personLinksResult.data.map((row) => row.link_type_id));

  return {
    total: people.length,
    areas: toFilterOptions(people.map((person) => person.area)),
    buildings: toFilterOptions(people.flatMap((person) => (person.gcba_building ? [person.gcba_building] : []))),
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
    .select("id,area,full_name,job_role", { count: "exact" })
    .eq("is_active", true)
    .order("full_name", { ascending: true });

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
  const linksByPerson = await getLinksByPerson(peopleRows.map((person) => person.id));

  return {
    filteredTotal: count ?? 0,
    people: peopleRows.map((person) => mapSummary(person, linksByPerson.get(person.id) ?? [])),
  };
}

export async function getDirectoryPersonDetail(personId: string): Promise<DirectoryPersonDetail | null> {
  const { data, error } = await supabase
    .from("directory_people")
    .select("id,area,full_name,job_role,phone,email,gcba_building")
    .eq("id", personId)
    .eq("is_active", true)
    .maybeSingle<PersonDetailRow>();

  if (error) throw toServiceError(error, "No se pudo cargar el perfil del integrante.");
  if (!data) return null;

  const linksByPerson = await getLinksByPerson([personId]);
  return {
    ...mapSummary(data, linksByPerson.get(personId) ?? []),
    phone: data.phone,
    email: data.email,
    building: data.gcba_building,
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

function mapSummary(row: PersonSummaryRow, linkTypes: DirectoryLinkType[]): DirectoryPersonSummary {
  return {
    id: row.id,
    name: row.full_name,
    area: row.area,
    role: row.job_role,
    linkTypes,
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
