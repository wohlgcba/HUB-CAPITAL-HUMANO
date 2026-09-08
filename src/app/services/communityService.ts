import { supabase } from "../lib/supabaseClient";
import type {
  ResourceReaction,
  ResourceReactionMap,
  ResourceReactionSummary,
} from "../types/resources";
import { AppServiceError } from "./serviceError";
import { validateResourceFile, validateSectionBanner } from "./storageService";

const resourceBucket = "resource-files";
const coverBucket = "resource-covers";

type PreparedUpload = {
  resourceId: string;
  storagePath: string;
  token: string;
  contentType: string;
};

export async function submitNovedadesResource(input: {
  sectionId: string;
  title: string;
  description: string | null;
  file: File | null;
  coverFile: File | null;
}) {
  if (!input.file && !input.coverFile) {
    const created = await requestCommunity<{ resourceId: string }>({
      action: "create-submission",
      sectionId: input.sectionId,
      title: input.title,
      description: input.description,
    });
    return created.resourceId;
  }
  if (input.file) validateResourceFile(input.file);
  if (input.coverFile) validateSectionBanner(input.coverFile);

  let fileUpload: PreparedUpload | null = null;
  let coverUpload: PreparedUpload | null = null;
  try {
    if (input.file) {
      fileUpload = await requestCommunity<PreparedUpload>({
        action: "prepare-upload",
        sectionId: input.sectionId,
        fileName: input.file.name,
        fileSize: input.file.size,
      });
    }
    if (input.coverFile) {
      coverUpload = await requestCommunity<PreparedUpload>({
        action: "prepare-cover-upload",
        sectionId: input.sectionId,
        resourceId: fileUpload?.resourceId ?? null,
        fileName: input.coverFile.name,
        fileSize: input.coverFile.size,
      });
    }

    const resourceId = fileUpload?.resourceId ?? coverUpload?.resourceId;
    if (!resourceId || (fileUpload && coverUpload && fileUpload.resourceId !== coverUpload.resourceId)) {
      throw new AppServiceError("No se pudo preparar la propuesta.", "UPLOAD_PREPARE_FAILED");
    }

    if (input.file && fileUpload) await uploadWithSignedUrl(resourceBucket, fileUpload, input.file, "archivo");
    if (input.coverFile && coverUpload) await uploadWithSignedUrl(coverBucket, coverUpload, input.coverFile, "imagen de portada");

    await requestCommunity<{ resourceId: string }>({
      action: "complete-submission",
      sectionId: input.sectionId,
      resourceId,
      title: input.title,
      description: input.description,
      ...(fileUpload && input.file ? {
        storagePath: fileUpload.storagePath,
        fileName: input.file.name,
        fileSize: input.file.size,
      } : {}),
      ...(coverUpload && input.coverFile ? {
        coverStoragePath: coverUpload.storagePath,
        coverFileName: input.coverFile.name,
        coverFileSize: input.coverFile.size,
      } : {}),
    });
    return resourceId;
  } catch (error) {
    await Promise.all([
      fileUpload ? cancelUpload(fileUpload, "file") : Promise.resolve(),
      coverUpload ? cancelUpload(coverUpload, "cover") : Promise.resolve(),
    ]);
    throw error;
  }
}

async function uploadWithSignedUrl(bucket: string, prepared: PreparedUpload, file: File, label: string) {
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(prepared.storagePath, prepared.token, file, {
    cacheControl: "3600",
    contentType: prepared.contentType,
  });
  if (error) throw new AppServiceError(`No se pudo subir el ${label}.`, error.name || "UPLOAD_FAILED");
}

async function cancelUpload(prepared: PreparedUpload, uploadKind: "file" | "cover") {
  await requestCommunity({
    action: "cancel-upload",
    resourceId: prepared.resourceId,
    storagePath: prepared.storagePath,
    uploadKind,
  }).catch(() => undefined);
}

export async function getResourceReactions(resourceIds: string[]): Promise<ResourceReactionMap> {
  if (resourceIds.length === 0) return {};
  const response = await requestCommunity<{ summaries: ResourceReactionMap }>({
    action: "get-reactions",
    resourceIds,
  });
  return response.summaries;
}

export async function setResourceReaction(resourceId: string, emoji: ResourceReaction | null) {
  const response = await requestCommunity<{ summary: ResourceReactionSummary }>({
    action: "set-reaction",
    resourceId,
    emoji,
  });
  return response.summary;
}

async function requestCommunity<T = Record<string, never>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new AppServiceError("La sesión no está disponible.", "SESSION_MISSING");
  }

  const response = await fetch("/api/community", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = (await response.json().catch(() => null)) as
    | ({ error?: string; code?: string } & Partial<T>)
    | null;

  if (!response.ok) {
    throw new AppServiceError(
      payload?.error || "No se pudo completar la operación.",
      payload?.code || "COMMUNITY_REQUEST_FAILED",
    );
  }
  if (!payload) throw new AppServiceError("El servicio no devolvió una respuesta válida.", "EMPTY_RESPONSE");
  return payload as T;
}
