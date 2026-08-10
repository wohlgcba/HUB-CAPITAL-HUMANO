import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type AppRole = "user" | "admin";
type AdminAction = "create" | "update" | "set-active" | "delete";

type PersonPayload = {
  name: string;
  area: string;
  role: string | null;
  linkTypeIds: string[];
  phone: string | null;
  email: string | null;
  building: string | null;
  cuit: string | null;
  isActive: boolean;
  systemRole: AppRole;
};

type RequestBody =
  | { action: "create"; person: unknown }
  | { action: "update"; personId: unknown; person: unknown }
  | { action: "set-active"; personId: unknown; isActive: unknown }
  | { action: "delete"; personId: unknown };

type Caller = {
  userId: string;
  profileId: string;
};

type DirectoryRow = {
  id: string;
  cuit: string | null;
  area: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  job_role: string | null;
  gcba_building: string | null;
  is_active: boolean;
};

type ProfileRow = {
  id: string;
  auth_user_id: string | null;
  directory_person_id: string | null;
  cuit: string | null;
  email: string;
  full_name: string;
  role: AppRole;
  is_active: boolean;
};

class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = "INVALID_REQUEST",
  ) {
    super(message);
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método no permitido.", code: "METHOD_NOT_ALLOWED" });
  }

  try {
    const adminClient = createAdminClient();
    const caller = await requireAdmin(adminClient, readBearerToken(request));
    const body = parseBody(request.body);

    switch (body.action) {
      case "create": {
        const person = validatePerson(body.person, true);
        const personId = await createPerson(adminClient, caller, person);
        return response.status(201).json({ personId });
      }
      case "update": {
        const personId = requireUuid(body.personId, "La persona indicada no es válida.");
        const person = validatePerson(body.person, false);
        await updatePerson(adminClient, caller, personId, person);
        return response.status(200).json({ personId });
      }
      case "set-active": {
        const personId = requireUuid(body.personId, "La persona indicada no es válida.");
        if (typeof body.isActive !== "boolean") throw new ApiError("El estado indicado no es válido.");
        await setPersonActive(adminClient, caller, personId, body.isActive);
        return response.status(200).json({ personId, isActive: body.isActive });
      }
      case "delete": {
        const personId = requireUuid(body.personId, "La persona indicada no es válida.");
        await deletePerson(adminClient, caller, personId);
        return response.status(200).json({ personId });
      }
    }
  } catch (error) {
    const apiError = toApiError(error);
    return response.status(apiError.status).json({ error: apiError.message, code: apiError.code });
  }
}

function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) throw new ApiError("El servicio administrativo no está configurado.", 503, "SERVER_NOT_CONFIGURED");

  return createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function readBearerToken(request: VercelRequest) {
  const authorization = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new ApiError("La sesión no es válida.", 401, "UNAUTHORIZED");
  return match[1];
}

async function requireAdmin(adminClient: SupabaseClient, token: string): Promise<Caller> {
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) throw new ApiError("La sesión no es válida.", 401, "UNAUTHORIZED");

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,role,is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin" || !profile.is_active) {
    throw new ApiError("No tenés permisos para realizar esta acción.", 403, "ADMIN_REQUIRED");
  }

  return { userId: userData.user.id, profileId: profile.id };
}

function parseBody(body: unknown): RequestBody {
  const parsed = typeof body === "string" ? safeJsonParse(body) : body;
  if (!parsed || typeof parsed !== "object" || !("action" in parsed)) throw new ApiError("La solicitud no es válida.");
  const action = (parsed as { action?: unknown }).action;
  if (!isAdminAction(action)) throw new ApiError("La acción indicada no es válida.");
  return parsed as RequestBody;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ApiError("La solicitud no contiene JSON válido.");
  }
}

function isAdminAction(value: unknown): value is AdminAction {
  return value === "create" || value === "update" || value === "set-active" || value === "delete";
}

function validatePerson(value: unknown, requireAccountFields: boolean): PersonPayload {
  if (!value || typeof value !== "object") throw new ApiError("Los datos de la persona no son válidos.");
  const raw = value as Record<string, unknown>;
  const name = requiredText(raw.name, "Ingresá el nombre.", 160);
  const area = requiredText(raw.area, "Ingresá el área.", 180);
  const email = nullableText(raw.email, 320)?.toLowerCase() ?? null;
  const cuit = normalizeCuit(raw.cuit);
  const systemRole = raw.systemRole === "admin" ? "admin" : raw.systemRole === "user" ? "user" : null;

  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError("Ingresá un email válido.", 422, "INVALID_EMAIL");
  if (cuit && !isValidCuit(cuit)) throw new ApiError("Ingresá un CUIT válido.", 422, "INVALID_CUIT");
  if (requireAccountFields && (!email || !cuit)) throw new ApiError("El email y el CUIT son obligatorios para crear el usuario.", 422, "ACCOUNT_FIELDS_REQUIRED");
  if (!systemRole) throw new ApiError("Seleccioná un rol del sistema.", 422, "INVALID_SYSTEM_ROLE");
  if (typeof raw.isActive !== "boolean") throw new ApiError("Seleccioná un estado válido.", 422, "INVALID_STATUS");

  const linkTypeIds = Array.isArray(raw.linkTypeIds)
    ? [...new Set(raw.linkTypeIds.filter((item): item is string => typeof item === "string" && uuidPattern.test(item)))]
    : [];

  return {
    name,
    area,
    role: nullableText(raw.role, 180),
    linkTypeIds,
    phone: nullableText(raw.phone, 80),
    email,
    building: nullableText(raw.building, 200),
    cuit,
    isActive: raw.isActive,
    systemRole,
  };
}

async function createPerson(adminClient: SupabaseClient, caller: Caller, person: PersonPayload) {
  await assertUniqueIdentity(adminClient, person.email, person.cuit);
  await assertLinkTypes(adminClient, person.linkTypeIds);

  let personId: string | null = null;
  let profileId: string | null = null;
  let authUserId: string | null = null;

  try {
    const { data: insertedPerson, error: personError } = await adminClient
      .from("directory_people")
      .insert(toDirectoryPayload(person))
      .select("id")
      .single();
    if (personError || !insertedPerson) throw new ApiError("No se pudo crear la persona.", 409, "DIRECTORY_CREATE_FAILED");
    personId = insertedPerson.id;

    const { data: insertedProfile, error: profileError } = await adminClient
      .from("profiles")
      .insert(toProfilePayload(person, personId!))
      .select("id")
      .single();
    if (profileError || !insertedProfile) throw new ApiError("No se pudo crear el perfil del usuario.", 409, "PROFILE_CREATE_FAILED");
    profileId = insertedProfile.id;

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: person.email!,
      password: person.cuit!,
      email_confirm: true,
      user_metadata: { full_name: person.name },
    });
    if (authError || !authData.user) throw new ApiError("No se pudo crear el acceso del usuario.", 409, "AUTH_CREATE_FAILED");
    authUserId = authData.user.id;

    if (!person.isActive) await updateAuthActiveState(adminClient, authUserId, false);

    const { error: profileLinkError } = await adminClient
      .from("profiles")
      .update({ auth_user_id: authUserId })
      .eq("id", profileId!);
    if (profileLinkError) throw new ApiError("No se pudo vincular el acceso con el perfil.", 409, "PROFILE_LINK_FAILED");

    await replaceLinkTypes(adminClient, personId!, person.linkTypeIds);
    await writeAudit(adminClient, caller.profileId, "directory_person_created", personId!);
    return personId!;
  } catch (error) {
    if (authUserId) await adminClient.auth.admin.deleteUser(authUserId).catch(() => undefined);
    if (profileId) await adminClient.from("profiles").delete().eq("id", profileId);
    if (personId) await adminClient.from("directory_people").delete().eq("id", personId);
    throw error;
  }
}

async function updatePerson(adminClient: SupabaseClient, caller: Caller, personId: string, person: PersonPayload) {
  const current = await getPersonBundle(adminClient, personId);
  if (current.profile && (!person.email || !person.cuit)) {
    throw new ApiError("Un usuario con acceso debe conservar email y CUIT.", 422, "ACCOUNT_FIELDS_REQUIRED");
  }
  if (!current.profile && person.systemRole === "admin" && (!person.email || !person.cuit)) {
    throw new ApiError("Un administrador debe tener email y CUIT.", 422, "ACCOUNT_FIELDS_REQUIRED");
  }
  if (current.profile?.auth_user_id === caller.userId && (!person.isActive || person.systemRole !== "admin")) {
    throw new ApiError("No podés desactivar ni quitar tu propio rol administrador.", 409, "CURRENT_ADMIN_PROTECTED");
  }

  await assertUniqueIdentity(
    adminClient,
    person.email,
    person.cuit,
    personId,
    current.profile?.id ?? null,
    current.profile?.auth_user_id ?? null,
  );
  await assertLinkTypes(adminClient, person.linkTypeIds);

  const previousDirectory = toDirectoryPayload({
    ...person,
    name: current.person.full_name,
    area: current.person.area,
    role: current.person.job_role,
    phone: current.person.phone,
    email: current.person.email,
    building: current.person.gcba_building,
    cuit: current.person.cuit,
    isActive: current.person.is_active,
  });

  let profile = current.profile;
  let createdAuthUserId: string | null = null;
  let createdProfileId: string | null = null;

  try {
    if (!profile && person.email && person.cuit) {
      const { data: insertedProfile, error: profileError } = await adminClient
        .from("profiles")
        .insert(toProfilePayload(person, personId))
        .select("id,auth_user_id,directory_person_id,cuit,email,full_name,role,is_active")
        .single();
      if (profileError || !insertedProfile) throw new ApiError("No se pudo crear el perfil del usuario.", 409, "PROFILE_CREATE_FAILED");
      profile = insertedProfile as ProfileRow;
      createdProfileId = profile.id;

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: person.email,
        password: person.cuit,
        email_confirm: true,
        user_metadata: { full_name: person.name },
      });
      if (authError || !authData.user) throw new ApiError("No se pudo crear el acceso del usuario.", 409, "AUTH_CREATE_FAILED");
      createdAuthUserId = authData.user.id;
      profile.auth_user_id = createdAuthUserId;
    }

    if (profile?.auth_user_id) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(profile.auth_user_id, {
        email: person.email!,
        email_confirm: true,
        user_metadata: { full_name: person.name },
      });
      if (authUpdateError) throw new ApiError("No se pudo actualizar el acceso del usuario.", 409, "AUTH_UPDATE_FAILED");
      await updateAuthActiveState(adminClient, profile.auth_user_id, person.isActive);
    }

    const { error: directoryError } = await adminClient
      .from("directory_people")
      .update(toDirectoryPayload(person))
      .eq("id", personId);
    if (directoryError) throw new ApiError("No se pudo actualizar la persona.", 409, "DIRECTORY_UPDATE_FAILED");

    if (profile) {
      const { error: profileError } = await adminClient
        .from("profiles")
        .update({
          auth_user_id: profile.auth_user_id,
          cuit: person.cuit,
          email: person.email,
          full_name: person.name,
          role: person.systemRole,
          is_active: person.isActive,
        })
        .eq("id", profile.id);
      if (profileError) throw new ApiError("No se pudo actualizar el perfil del usuario.", 409, "PROFILE_UPDATE_FAILED");
    }

    await replaceLinkTypes(adminClient, personId, person.linkTypeIds);
    await writeAudit(adminClient, caller.profileId, "directory_person_updated", personId);
  } catch (error) {
    if (createdAuthUserId) await adminClient.auth.admin.deleteUser(createdAuthUserId).catch(() => undefined);
    if (createdProfileId) await adminClient.from("profiles").delete().eq("id", createdProfileId);
    await adminClient.from("directory_people").update(previousDirectory).eq("id", personId);
    throw error;
  }
}

async function setPersonActive(adminClient: SupabaseClient, caller: Caller, personId: string, isActive: boolean) {
  const current = await getPersonBundle(adminClient, personId);
  if (current.profile?.auth_user_id === caller.userId && !isActive) {
    throw new ApiError("No podés desactivar tu propio usuario.", 409, "CURRENT_ADMIN_PROTECTED");
  }

  if (current.profile?.auth_user_id) await updateAuthActiveState(adminClient, current.profile.auth_user_id, isActive);

  const { error: personError } = await adminClient.from("directory_people").update({ is_active: isActive }).eq("id", personId);
  if (personError) throw new ApiError("No se pudo actualizar el estado de la persona.", 409, "STATUS_UPDATE_FAILED");

  if (current.profile) {
    const { error: profileError } = await adminClient.from("profiles").update({ is_active: isActive }).eq("id", current.profile.id);
    if (profileError) {
      await adminClient.from("directory_people").update({ is_active: current.person.is_active }).eq("id", personId);
      if (current.profile.auth_user_id) await updateAuthActiveState(adminClient, current.profile.auth_user_id, current.profile.is_active).catch(() => undefined);
      throw new ApiError("No se pudo actualizar el estado del usuario.", 409, "STATUS_UPDATE_FAILED");
    }
  }

  await writeAudit(adminClient, caller.profileId, isActive ? "directory_person_reactivated" : "directory_person_deactivated", personId);
}

async function deletePerson(adminClient: SupabaseClient, caller: Caller, personId: string) {
  const current = await getPersonBundle(adminClient, personId);
  if (current.profile?.auth_user_id === caller.userId) {
    throw new ApiError("No podés eliminar tu propio usuario administrador.", 409, "CURRENT_ADMIN_PROTECTED");
  }

  if (current.profile?.auth_user_id) {
    const { error: authError } = await adminClient.auth.admin.deleteUser(current.profile.auth_user_id, false);
    if (authError) throw new ApiError("No se pudo eliminar el acceso del usuario.", 409, "AUTH_DELETE_FAILED");
  }

  if (current.profile) {
    const { error: profileError } = await adminClient.from("profiles").delete().eq("id", current.profile.id);
    if (profileError) throw new ApiError("No se pudo eliminar el perfil del usuario.", 409, "PROFILE_DELETE_FAILED");
  }

  const { error: personError } = await adminClient.from("directory_people").delete().eq("id", personId);
  if (personError) throw new ApiError("No se pudo eliminar la persona del Directorio.", 409, "DIRECTORY_DELETE_FAILED");

  await writeAudit(adminClient, caller.profileId, "directory_person_deleted", personId);
}

async function getPersonBundle(adminClient: SupabaseClient, personId: string) {
  const { data: person, error: personError } = await adminClient
    .from("directory_people")
    .select("id,cuit,area,full_name,phone,email,job_role,gcba_building,is_active")
    .eq("id", personId)
    .maybeSingle();
  if (personError || !person) throw new ApiError("La persona no existe.", 404, "PERSON_NOT_FOUND");

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id,auth_user_id,directory_person_id,cuit,email,full_name,role,is_active")
    .eq("directory_person_id", personId)
    .maybeSingle();
  if (profileError) throw new ApiError("No se pudo consultar el perfil del usuario.", 500, "PROFILE_READ_FAILED");

  return { person: person as DirectoryRow, profile: (profile as ProfileRow | null) ?? null };
}

async function assertUniqueIdentity(
  adminClient: SupabaseClient,
  email: string | null,
  cuit: string | null,
  excludedPersonId?: string,
  excludedProfileId?: string | null,
  excludedAuthUserId?: string | null,
) {
  if (!email && !cuit) return;

  const queries = [];
  if (email) {
    let directoryEmailQuery = adminClient.from("directory_people").select("id").ilike("email", email);
    if (excludedPersonId) directoryEmailQuery = directoryEmailQuery.neq("id", excludedPersonId);
    let profileEmailQuery = adminClient.from("profiles").select("id").ilike("email", email);
    if (excludedProfileId) profileEmailQuery = profileEmailQuery.neq("id", excludedProfileId);
    queries.push(directoryEmailQuery.limit(1), profileEmailQuery.limit(1));
  }
  if (cuit) {
    let directoryCuitQuery = adminClient.from("directory_people").select("id").eq("cuit", cuit);
    if (excludedPersonId) directoryCuitQuery = directoryCuitQuery.neq("id", excludedPersonId);
    let profileCuitQuery = adminClient.from("profiles").select("id").eq("cuit", cuit);
    if (excludedProfileId) profileCuitQuery = profileCuitQuery.neq("id", excludedProfileId);
    queries.push(directoryCuitQuery.limit(1), profileCuitQuery.limit(1));
  }

  const results = await Promise.all(queries);
  if (results.some((result) => result.error)) throw new ApiError("No se pudo validar la identidad del usuario.", 500, "IDENTITY_CHECK_FAILED");
  if (results.some((result) => (result.data?.length ?? 0) > 0)) throw new ApiError("El email o CUIT ya pertenece a otro usuario.", 409, "DUPLICATE_IDENTITY");

  if (email) {
    const authUsers = await listAllAuthUsers(adminClient);
    const duplicateAuth = authUsers.find((user) => user.email?.toLowerCase() === email && user.id !== excludedAuthUserId);
    if (duplicateAuth) throw new ApiError("El email ya tiene un acceso registrado.", 409, "DUPLICATE_EMAIL");
  }
}

async function listAllAuthUsers(adminClient: SupabaseClient) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new ApiError("No se pudo validar el email en Auth.", 500, "AUTH_READ_FAILED");
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

async function assertLinkTypes(adminClient: SupabaseClient, linkTypeIds: string[]) {
  if (linkTypeIds.length === 0) return;
  const { data, error } = await adminClient.from("link_types").select("id").in("id", linkTypeIds).eq("is_active", true);
  if (error || data.length !== linkTypeIds.length) throw new ApiError("Uno de los tipos de enlace no es válido.", 422, "INVALID_LINK_TYPE");
}

async function replaceLinkTypes(adminClient: SupabaseClient, personId: string, linkTypeIds: string[]) {
  const { error: deleteError } = await adminClient.from("directory_person_link_types").delete().eq("person_id", personId);
  if (deleteError) throw new ApiError("No se pudieron actualizar los tipos de enlace.", 409, "LINK_TYPES_UPDATE_FAILED");
  if (linkTypeIds.length === 0) return;

  const { error: insertError } = await adminClient
    .from("directory_person_link_types")
    .insert(linkTypeIds.map((linkTypeId) => ({ person_id: personId, link_type_id: linkTypeId })));
  if (insertError) throw new ApiError("No se pudieron actualizar los tipos de enlace.", 409, "LINK_TYPES_UPDATE_FAILED");
}

async function updateAuthActiveState(adminClient: SupabaseClient, authUserId: string, isActive: boolean) {
  const { error } = await adminClient.auth.admin.updateUserById(authUserId, {
    ban_duration: isActive ? "none" : "876000h",
  });
  if (error) throw new ApiError("No se pudo actualizar el acceso del usuario.", 409, "AUTH_STATUS_FAILED");
}

async function writeAudit(adminClient: SupabaseClient, profileId: string, eventType: string, personId: string) {
  await adminClient.from("audit_events").insert({
    profile_id: profileId,
    event_type: eventType,
    entity_type: "directory_person",
    entity_id: personId,
  });
}

function toDirectoryPayload(person: PersonPayload) {
  return {
    cuit: person.cuit,
    area: person.area,
    full_name: person.name,
    phone: person.phone,
    email: person.email,
    job_role: person.role,
    gcba_building: person.building,
    is_active: person.isActive,
  };
}

function toProfilePayload(person: PersonPayload, personId: string) {
  return {
    auth_user_id: null,
    directory_person_id: personId,
    cuit: person.cuit,
    email: person.email,
    full_name: person.name,
    role: person.systemRole,
    must_change_password: true,
    is_active: person.isActive,
  };
}

function requiredText(value: unknown, message: string, maxLength: number) {
  const normalized = nullableText(value, maxLength);
  if (!normalized) throw new ApiError(message, 422, "REQUIRED_FIELD");
  return normalized;
}

function nullableText(value: unknown, maxLength: number) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new ApiError("Uno de los campos supera el largo permitido.", 422, "FIELD_TOO_LONG");
  return normalized;
}

function normalizeCuit(value: unknown) {
  const normalized = nullableText(value, 24)?.replace(/\D/g, "") ?? null;
  return normalized || null;
}

function isValidCuit(value: string) {
  if (!/^\d{11}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = value
    .slice(0, 10)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const result = 11 - (sum % 11);
  const expected = result === 11 ? 0 : result === 10 ? 9 : result;
  return expected === Number(value.at(-1));
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireUuid(value: unknown, message: string) {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new ApiError(message, 422, "INVALID_ID");
  return value;
}

function toApiError(error: unknown) {
  if (error instanceof ApiError) return error;
  return new ApiError("No se pudo completar la operación administrativa.", 500, "INTERNAL_ERROR");
}
