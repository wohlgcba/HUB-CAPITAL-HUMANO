import { supabase } from "../lib/supabaseClient";
import type {
  AdminDashboardStats,
  AdminMetrics,
  AdminPersonAccess,
  AdminPersonInput,
} from "../types/admin";
import { AppServiceError, toServiceError } from "./serviceError";

type PersonAccessRow = {
  cuit: string | null;
  profile_id: string | null;
  auth_user_id: string | null;
  system_role: "user" | "admin";
  account_is_active: boolean;
  must_change_password: boolean;
  first_login_at: string | null;
  last_login_at: string | null;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [sections, publishedSections, resources, publishedResources, users, activeUsers] = await Promise.all([
    exactCount("sections"),
    exactCount("sections", true),
    exactCount("section_resources"),
    exactCount("section_resources", true),
    exactCount("profiles"),
    exactCount("profiles", true),
  ]);

  return {
    sections,
    publishedSections,
    resources,
    publishedResources,
    users,
    activeUsers,
    pending: sections - publishedSections + (resources - publishedResources) + (users - activeUsers),
  };
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [profilesResult, peopleResult, sectionsResult, resourcesResult] = await Promise.all([
    supabase.from("profiles").select("id,directory_person_id,is_active"),
    supabase.from("directory_people").select("id,area"),
    supabase.from("sections").select("id,title"),
    supabase.from("section_resources").select("id,section_id,created_at"),
  ]);
  const firstError = profilesResult.error || peopleResult.error || sectionsResult.error || resourcesResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron calcular las métricas administrativas.");

  const areaByPerson = new Map(peopleResult.data.map((person) => [person.id, person.area]));
  const sectionTitleById = new Map(sectionsResult.data.map((section) => [section.id, section.title]));
  const usersByArea = countGroups(
    profilesResult.data.map((profile) =>
      profile.directory_person_id ? areaByPerson.get(profile.directory_person_id) ?? "Sin área" : "Sin área",
    ),
  );
  const resourcesBySection = countGroups(
    resourcesResult.data.map((resource) => sectionTitleById.get(resource.section_id) ?? "Sección eliminada"),
  );
  for (const section of sectionsResult.data) {
    if (!resourcesBySection.some((group) => group.label === section.title)) resourcesBySection.push({ label: section.title, value: 0 });
  }

  const recentThreshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return {
    totalUsers: profilesResult.data.length,
    activeUsers: profilesResult.data.filter((profile) => profile.is_active).length,
    sections: sectionsResult.data.length,
    resources: resourcesResult.data.length,
    recentResources: resourcesResult.data.filter((resource) => new Date(resource.created_at).getTime() >= recentThreshold).length,
    resourcesBySection: resourcesBySection.sort((first, second) => second.value - first.value || first.label.localeCompare(second.label, "es-AR")),
    usersByArea,
  };
}

export async function getAdminPersonAccess(personId: string): Promise<AdminPersonAccess> {
  const { data, error } = await supabase.rpc("admin_directory_person_access", { target_person_id: personId });
  if (error) throw toServiceError(error, "No se pudo cargar la información administrativa del usuario.");
  const row = (data as PersonAccessRow[] | null)?.[0];
  if (!row) {
    return {
      cuit: null,
      profileId: null,
      authUserId: null,
      systemRole: "user",
      accountIsActive: true,
      mustChangePassword: false,
      firstLoginAt: null,
      lastLoginAt: null,
    };
  }
  return {
    cuit: row.cuit,
    profileId: row.profile_id,
    authUserId: row.auth_user_id,
    systemRole: row.system_role,
    accountIsActive: row.account_is_active,
    mustChangePassword: row.must_change_password,
    firstLoginAt: row.first_login_at,
    lastLoginAt: row.last_login_at,
  };
}

export async function createDirectoryPerson(person: AdminPersonInput) {
  return requestAdminUser<{ personId: string }>({ action: "create", person });
}

export async function updateDirectoryPerson(personId: string, person: AdminPersonInput) {
  return requestAdminUser<{ personId: string }>({ action: "update", personId, person });
}

export async function setDirectoryPersonActive(personId: string, isActive: boolean) {
  return requestAdminUser<{ personId: string; isActive: boolean }>({ action: "set-active", personId, isActive });
}

export async function permanentlyDeleteDirectoryPerson(personId: string) {
  return requestAdminUser<{ personId: string }>({ action: "delete", personId });
}

async function exactCount(table: "sections" | "section_resources" | "profiles", active?: boolean) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (active !== undefined) query = query.eq("is_active", active);
  const { count, error } = await query;
  if (error) throw toServiceError(error, "No se pudieron calcular los indicadores administrativos.");
  return count ?? 0;
}

async function requestAdminUser<T>(body: Record<string, unknown>): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new AppServiceError("La sesión administrativa no está disponible.", "SESSION_MISSING");

  const response = await fetch("/api/admin-users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as { error?: string; code?: string } | T | null;
  if (!response.ok) {
    const errorPayload = payload as { error?: string; code?: string } | null;
    throw new AppServiceError(errorPayload?.error || "No se pudo completar la operación administrativa.", errorPayload?.code);
  }
  if (!payload) throw new AppServiceError("El servicio administrativo no devolvió una respuesta válida.", "EMPTY_RESPONSE");
  return payload as T;
}

function countGroups(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((first, second) => second.value - first.value || first.label.localeCompare(second.label, "es-AR"));
}
