import { supabase } from "../lib/supabaseClient";
import type {
  DirectoryChangeRequest,
  DirectoryChangeValues,
  RestrictedProfileInput,
} from "../types/profile";
import { toServiceError } from "./serviceError";

type ChangeRequestRow = {
  id: string;
  profile_id: string;
  directory_person_id: string;
  current_values: Record<string, unknown>;
  requested_changes: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

type PersonIdentityRow = {
  id: string;
  full_name: string;
  email: string | null;
};

const requestColumns =
  "id,profile_id,directory_person_id,current_values,requested_changes,status,review_note,created_at,updated_at";

export async function submitMyDirectoryChangeRequest(input: RestrictedProfileInput) {
  const { data, error } = await supabase.rpc("submit_my_directory_change_request", {
    new_cuit: input.cuit.replace(/\D/g, ""),
    new_area: input.area.trim(),
    new_gcba_building: input.building?.trim() || null,
    new_link_type_ids: input.linkTypeIds,
  });
  if (error) throw toServiceError(error, getProfileRequestError(error.message));
  return data as string;
}

export async function getMyPendingDirectoryChangeRequest(): Promise<DirectoryChangeRequest | null> {
  const { data, error } = await supabase
    .from("directory_change_requests")
    .select(requestColumns)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw toServiceError(error, "No se pudo revisar tu solicitud pendiente.");
  if (!data) return null;
  const [request] = await hydrateRequests([data as ChangeRequestRow]);
  return request ?? null;
}

export async function getPendingDirectoryPersonIds(personIds: string[]): Promise<Set<string>> {
  if (personIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("directory_change_requests")
    .select("directory_person_id")
    .eq("status", "pending")
    .in("directory_person_id", personIds);
  if (error) throw toServiceError(error, "No se pudieron cargar las solicitudes pendientes.");
  return new Set(data.map((request) => request.directory_person_id));
}

export async function getPendingChangeRequestForPerson(personId: string): Promise<DirectoryChangeRequest | null> {
  const { data, error } = await supabase
    .from("directory_change_requests")
    .select(requestColumns)
    .eq("directory_person_id", personId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw toServiceError(error, "No se pudo cargar la solicitud pendiente.");
  if (!data) return null;
  const [request] = await hydrateRequests([data as ChangeRequestRow]);
  return request ?? null;
}

export async function reviewDirectoryChangeRequest(requestId: string, approved: boolean, note: string | null) {
  const { data, error } = await supabase.rpc("review_directory_change_request", {
    target_request_id: requestId,
    approve_request: approved,
    reviewer_note: note?.trim() || null,
  });
  if (error) throw toServiceError(error, approved ? "No se pudo aprobar la solicitud." : "No se pudo rechazar la solicitud.");
  return data as "approved" | "rejected";
}

async function hydrateRequests(rows: ChangeRequestRow[]): Promise<DirectoryChangeRequest[]> {
  const personIds = [...new Set(rows.map((row) => row.directory_person_id))];
  const { data, error } = await supabase
    .from("directory_people")
    .select("id,full_name,email")
    .in("id", personIds);
  if (error) throw toServiceError(error, "No se pudo identificar a las personas solicitantes.");
  const people = new Map((data as PersonIdentityRow[]).map((person) => [person.id, person]));

  return rows.map((row) => {
    const person = people.get(row.directory_person_id);
    return {
      id: row.id,
      profileId: row.profile_id,
      directoryPersonId: row.directory_person_id,
      personName: person?.full_name ?? "Integrante",
      personEmail: person?.email ?? null,
      currentValues: mapChangeValues(row.current_values),
      requestedChanges: mapChangeValues(row.requested_changes),
      status: row.status,
      reviewNote: row.review_note,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

function mapChangeValues(value: Record<string, unknown>): DirectoryChangeValues {
  const linkTypeIds = Array.isArray(value.link_type_ids)
    ? value.link_type_ids.filter((item): item is string => typeof item === "string")
    : undefined;
  return {
    ...(Object.hasOwn(value, "cuit") ? { cuit: typeof value.cuit === "string" ? value.cuit : null } : {}),
    ...(Object.hasOwn(value, "area") ? { area: typeof value.area === "string" ? value.area : null } : {}),
    ...(Object.hasOwn(value, "gcba_building") ? { building: typeof value.gcba_building === "string" ? value.gcba_building : null } : {}),
    ...(linkTypeIds ? { linkTypeIds } : {}),
  };
}

function getProfileRequestError(message: string) {
  if (message.includes("NO_CHANGES")) return "No hay cambios para enviar.";
  if (message.includes("INVALID_CUIT")) return "Ingresá un CUIT válido de 11 dígitos.";
  if (message.includes("INVALID_AREA")) return "Ingresá un área válida.";
  if (message.includes("INVALID_LINK_TYPE")) return "Uno de los tipos de enlace ya no está disponible.";
  return "No se pudo enviar la solicitud de cambios.";
}
