import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const resourceBucket = "resource-files";
const resourceFileLimit = 50 * 1024 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reactionChoices = ["💖", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔", "👎"] as const;
const fileKinds = {
  pdf: { kind: "pdf", mime: "application/pdf" },
  ppt: { kind: "powerpoint", mime: "application/vnd.ms-powerpoint" },
  pptx: { kind: "powerpoint", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  doc: { kind: "word", mime: "application/msword" },
  docx: { kind: "word", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xls: { kind: "spreadsheet", mime: "application/vnd.ms-excel" },
  xlsx: { kind: "spreadsheet", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
} as const;

type AppRole = "user" | "admin";
type ResourceFileKind = (typeof fileKinds)[keyof typeof fileKinds]["kind"];
type Caller = { userId: string; profileId: string; fullName: string; role: AppRole };
type FileData = { fileName: string; fileSize: number; fileKind: ResourceFileKind; contentType: string };

type RequestBody =
  | { action: "prepare-upload"; sectionId: unknown; fileName: unknown; fileSize: unknown }
  | { action: "complete-submission"; sectionId: unknown; resourceId: unknown; storagePath: unknown; title: unknown; description: unknown; fileName: unknown; fileSize: unknown }
  | { action: "cancel-upload"; resourceId: unknown; storagePath: unknown }
  | { action: "get-reactions"; resourceIds: unknown }
  | { action: "set-reaction"; resourceId: unknown; emoji: unknown };

type ReactionEventRow = {
  profile_id: string | null;
  entity_id: string | null;
  metadata: { emoji?: unknown } | null;
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
    const caller = await requireActiveUser(adminClient, readBearerToken(request));
    const body = parseBody(request.body);

    switch (body.action) {
      case "prepare-upload": {
        requireStandardUser(caller);
        const sectionId = requireUuid(body.sectionId, "La sección indicada no es válida.");
        await requireNovedadesSection(adminClient, sectionId);
        const file = validateFile(body.fileName, body.fileSize);
        const resourceId = randomUUID();
        const storagePath = createSubmissionPath(caller.profileId, resourceId, file.fileName);
        const { data, error } = await adminClient.storage.from(resourceBucket).createSignedUploadUrl(storagePath, { upsert: false });
        if (error || !data?.token) throw new ApiError("No se pudo preparar la subida del archivo.", 500, "UPLOAD_PREPARE_FAILED");
        return response.status(200).json({ resourceId, storagePath, token: data.token, fileKind: file.fileKind, contentType: file.contentType });
      }
      case "complete-submission": {
        requireStandardUser(caller);
        const sectionId = requireUuid(body.sectionId, "La sección indicada no es válida.");
        const resourceId = requireUuid(body.resourceId, "El recurso indicado no es válido.");
        const storagePath = requiredText(body.storagePath, "La ruta del archivo no es válida.", 900);
        const title = requiredText(body.title, "Ingresá el título del recurso.", 220);
        const description = nullableText(body.description, 1000);
        const file = validateFile(body.fileName, body.fileSize);
        await requireNovedadesSection(adminClient, sectionId);
        assertOwnedStoragePath(storagePath, caller.profileId, resourceId);
        await requireUploadedObject(adminClient, storagePath, file.fileSize);
        await createSubmission(adminClient, caller, { sectionId, resourceId, storagePath, title, description, ...file });
        return response.status(201).json({ resourceId });
      }
      case "cancel-upload": {
        const resourceId = requireUuid(body.resourceId, "El recurso indicado no es válido.");
        const storagePath = requiredText(body.storagePath, "La ruta del archivo no es válida.", 900);
        assertOwnedStoragePath(storagePath, caller.profileId, resourceId);
        const { data: registeredFile, error: registeredFileError } = await adminClient
          .from("resource_files")
          .select("id")
          .eq("resource_id", resourceId)
          .eq("storage_path", storagePath)
          .maybeSingle();
        if (registeredFileError) throw new ApiError("No se pudo comprobar el estado del archivo.", 500, "UPLOAD_STATE_FAILED");
        if (registeredFile) return response.status(200).json({ removed: false });
        await adminClient.storage.from(resourceBucket).remove([storagePath]);
        return response.status(200).json({ removed: true });
      }
      case "get-reactions": {
        const resourceIds = parseResourceIds(body.resourceIds);
        const summaries = await getReactionSummaries(adminClient, caller.profileId, resourceIds);
        return response.status(200).json({ summaries });
      }
      case "set-reaction": {
        const resourceId = requireUuid(body.resourceId, "El recurso indicado no es válido.");
        const emoji = body.emoji === null ? null : requireReaction(body.emoji);
        await requirePublishedResource(adminClient, resourceId);
        const { error: deleteError } = await adminClient
          .from("audit_events")
          .delete()
          .eq("profile_id", caller.profileId)
          .eq("event_type", "resource_reaction")
          .eq("entity_type", "resource")
          .eq("entity_id", resourceId);
        if (deleteError) throw new ApiError("No se pudo actualizar la reacción.", 500, "REACTION_UPDATE_FAILED");

        if (emoji) {
          const { error: insertError } = await adminClient.from("audit_events").insert({
            profile_id: caller.profileId,
            event_type: "resource_reaction",
            entity_type: "resource",
            entity_id: resourceId,
            metadata: { emoji },
          });
          if (insertError) throw new ApiError("No se pudo guardar la reacción.", 500, "REACTION_UPDATE_FAILED");
        }

        const summaries = await getReactionSummaries(adminClient, caller.profileId, [resourceId]);
        return response.status(200).json({ summary: summaries[resourceId] });
      }
    }
  } catch (error) {
    const apiError = error instanceof ApiError ? error : new ApiError("No se pudo completar la operación.", 500, "INTERNAL_ERROR");
    return response.status(apiError.status).json({ error: apiError.message, code: apiError.code });
  }
}

function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) throw new ApiError("El servicio no está configurado.", 503, "SERVER_NOT_CONFIGURED");
  return createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireActiveUser(adminClient: SupabaseClient, token: string): Promise<Caller> {
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) throw new ApiError("La sesión no es válida.", 401, "UNAUTHORIZED");
  const { data: profile, error } = await adminClient
    .from("profiles")
    .select("id,full_name,role,is_active")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (error || !profile?.is_active) throw new ApiError("El usuario no está habilitado.", 403, "USER_INACTIVE");
  return { userId: userData.user.id, profileId: profile.id, fullName: profile.full_name, role: profile.role };
}

function requireStandardUser(caller: Caller) {
  if (caller.role !== "user") throw new ApiError("Usá las herramientas administrativas para publicar contenido.", 403, "STANDARD_USER_REQUIRED");
}

async function requireNovedadesSection(adminClient: SupabaseClient, sectionId: string) {
  const { data, error } = await adminClient.from("sections").select("id").eq("id", sectionId).eq("slug", "novedades").eq("is_active", true).maybeSingle();
  if (error || !data) throw new ApiError("Las propuestas solo están habilitadas en Novedades.", 403, "INVALID_SUBMISSION_SECTION");
}

async function requirePublishedResource(adminClient: SupabaseClient, resourceId: string) {
  const { data: resource, error } = await adminClient.from("section_resources").select("section_id").eq("id", resourceId).eq("is_active", true).maybeSingle();
  if (error || !resource) throw new ApiError("El recurso no está disponible.", 404, "RESOURCE_NOT_FOUND");
  const { data: section } = await adminClient.from("sections").select("id").eq("id", resource.section_id).eq("is_active", true).maybeSingle();
  if (!section) throw new ApiError("El recurso no está disponible.", 404, "RESOURCE_NOT_FOUND");
}

async function createSubmission(
  adminClient: SupabaseClient,
  caller: Caller,
  input: FileData & { sectionId: string; resourceId: string; storagePath: string; title: string; description: string | null },
) {
  const { error: resourceError } = await adminClient.from("section_resources").insert({
    id: input.resourceId,
    section_id: input.sectionId,
    title: input.title,
    description: input.description,
    thumbnail_strategy: "auto_from_first_file",
    is_featured: false,
    is_active: false,
    published_at: new Date().toISOString(),
  });
  if (resourceError) {
    await adminClient.storage.from(resourceBucket).remove([input.storagePath]);
    throw new ApiError("No se pudo registrar la propuesta.", 409, "SUBMISSION_CREATE_FAILED");
  }

  const { error: fileError } = await adminClient.from("resource_files").insert({
    resource_id: input.resourceId,
    storage_bucket: resourceBucket,
    storage_path: input.storagePath,
    file_name: input.fileName,
    file_kind: input.fileKind,
    mime_type: input.contentType,
    file_size_bytes: input.fileSize,
    sort_order: 0,
    allow_download: true,
  });
  if (fileError) {
    await adminClient.from("section_resources").delete().eq("id", input.resourceId);
    await adminClient.storage.from(resourceBucket).remove([input.storagePath]);
    throw new ApiError("No se pudo vincular el archivo con la propuesta.", 409, "SUBMISSION_FILE_FAILED");
  }

  await Promise.all([
    adminClient.from("audit_events").insert({
      profile_id: caller.profileId,
      event_type: "resource_submitted",
      entity_type: "resource",
      entity_id: input.resourceId,
      metadata: { section: "novedades" },
    }),
    adminClient.from("notifications").insert({
      title: "Recurso pendiente de revisión",
      body: `${input.title} fue propuesto en Novedades por ${caller.fullName}.`,
      category: "resource",
      audience: "admin",
      target_path: "/secciones/novedades",
      related_type: "resource",
      related_id: input.resourceId,
      source_key: `resource:${input.resourceId}:submitted`,
      created_by: caller.profileId,
    }),
  ]);
}

async function requireUploadedObject(adminClient: SupabaseClient, storagePath: string, expectedSize: number) {
  const separator = storagePath.lastIndexOf("/");
  const directory = storagePath.slice(0, separator);
  const fileName = storagePath.slice(separator + 1);
  const { data, error } = await adminClient.storage.from(resourceBucket).list(directory, { limit: 10, search: fileName });
  const storedFile = data?.find((item) => item.name === fileName);
  if (error || !storedFile) throw new ApiError("El archivo todavía no está disponible en Storage.", 409, "UPLOAD_NOT_FOUND");
  const storedSize = Number(storedFile.metadata?.size ?? expectedSize);
  if (!Number.isFinite(storedSize) || storedSize <= 0 || storedSize > resourceFileLimit) {
    await adminClient.storage.from(resourceBucket).remove([storagePath]);
    throw new ApiError("El archivo subido no es válido.", 422, "INVALID_FILE_SIZE");
  }
}

async function getReactionSummaries(adminClient: SupabaseClient, profileId: string, requestedIds: string[]) {
  if (requestedIds.length === 0) return {};
  const { data: resources, error: resourceError } = await adminClient.from("section_resources").select("id,section_id").in("id", requestedIds).eq("is_active", true);
  if (resourceError) throw new ApiError("No se pudieron cargar las reacciones.", 500, "REACTIONS_READ_FAILED");
  const sectionIds = [...new Set(resources.map((resource) => resource.section_id))];
  const { data: sections, error: sectionError } = sectionIds.length
    ? await adminClient.from("sections").select("id").in("id", sectionIds).eq("is_active", true)
    : { data: [], error: null };
  if (sectionError) throw new ApiError("No se pudieron cargar las reacciones.", 500, "REACTIONS_READ_FAILED");
  const activeSections = new Set(sections.map((section) => section.id));
  const resourceIds = resources.filter((resource) => activeSections.has(resource.section_id)).map((resource) => resource.id);
  if (resourceIds.length === 0) return {};

  const { data: events, error } = await adminClient
    .from("audit_events")
    .select("profile_id,entity_id,metadata")
    .eq("event_type", "resource_reaction")
    .eq("entity_type", "resource")
    .in("entity_id", resourceIds);
  if (error) throw new ApiError("No se pudieron cargar las reacciones.", 500, "REACTIONS_READ_FAILED");

  const summaries = Object.fromEntries(resourceIds.map((resourceId) => [resourceId, { counts: {} as Record<string, number>, userReaction: null as string | null }]));
  for (const event of events as ReactionEventRow[]) {
    if (!event.entity_id || !summaries[event.entity_id]) continue;
    const emoji = event.metadata?.emoji;
    if (typeof emoji !== "string" || !reactionChoices.includes(emoji as (typeof reactionChoices)[number])) continue;
    const summary = summaries[event.entity_id];
    summary.counts[emoji] = (summary.counts[emoji] ?? 0) + 1;
    if (event.profile_id === profileId) summary.userReaction = emoji;
  }
  return summaries;
}

function parseBody(body: unknown): RequestBody {
  const parsed = typeof body === "string" ? safeJsonParse(body) : body;
  if (!parsed || typeof parsed !== "object" || !("action" in parsed)) throw new ApiError("La solicitud no es válida.");
  const action = (parsed as { action?: unknown }).action;
  if (!["prepare-upload", "complete-submission", "cancel-upload", "get-reactions", "set-reaction"].includes(String(action))) {
    throw new ApiError("La acción indicada no es válida.");
  }
  return parsed as RequestBody;
}

function readBearerToken(request: VercelRequest) {
  const authorization = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError("La sesión no es válida.", 401, "UNAUTHORIZED");
  return token;
}

function validateFile(fileNameValue: unknown, fileSizeValue: unknown): FileData {
  const fileName = requiredText(fileNameValue, "Seleccioná un archivo.", 255);
  const extension = fileName.split(".").pop()?.toLowerCase() as keyof typeof fileKinds | undefined;
  const definition = extension ? fileKinds[extension] : undefined;
  const fileSize = Number(fileSizeValue);
  if (!definition) throw new ApiError("El archivo debe ser PDF, PPTX, DOCX o XLSX.", 422, "INVALID_FILE_TYPE");
  if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > resourceFileLimit) throw new ApiError("El archivo no puede superar los 50 MB.", 422, "INVALID_FILE_SIZE");
  return { fileName, fileSize, fileKind: definition.kind, contentType: definition.mime };
}

function createSubmissionPath(profileId: string, resourceId: string, fileName: string) {
  const safeName = fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "archivo";
  return `community/${profileId}/${resourceId}/${randomUUID()}-${safeName}`;
}

function assertOwnedStoragePath(path: string, profileId: string, resourceId: string) {
  if (!path.startsWith(`community/${profileId}/${resourceId}/`) || path.includes("..")) {
    throw new ApiError("La ruta del archivo no es válida.", 403, "INVALID_STORAGE_PATH");
  }
}

function parseResourceIds(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && uuidPattern.test(item)))].slice(0, 100);
}

function requireReaction(value: unknown) {
  if (typeof value !== "string" || !reactionChoices.includes(value as (typeof reactionChoices)[number])) {
    throw new ApiError("La reacción indicada no es válida.", 422, "INVALID_REACTION");
  }
  return value;
}

function requireUuid(value: unknown, message: string) {
  if (typeof value !== "string" || !uuidPattern.test(value)) throw new ApiError(message, 422, "INVALID_UUID");
  return value;
}

function requiredText(value: unknown, message: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) throw new ApiError(message, 422, "REQUIRED_FIELD");
  return value.trim().slice(0, maxLength);
}

function nullableText(value: unknown, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : null;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new ApiError("La solicitud no contiene JSON válido.");
  }
}
