import { supabase } from "../lib/supabaseClient";
import type {
  ResourceReaction,
  ResourceReactionMap,
  ResourceReactionSummary,
} from "../types/resources";
import { AppServiceError } from "./serviceError";
import { validateResourceFile } from "./storageService";

const resourceBucket = "resource-files";

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
  file: File;
}) {
  validateResourceFile(input.file);
  const prepared = await requestCommunity<PreparedUpload>({
    action: "prepare-upload",
    sectionId: input.sectionId,
    fileName: input.file.name,
    fileSize: input.file.size,
  });

  const { error: uploadError } = await supabase.storage
    .from(resourceBucket)
    .uploadToSignedUrl(prepared.storagePath, prepared.token, input.file, {
      cacheControl: "3600",
      contentType: prepared.contentType,
    });
  if (uploadError) {
    await requestCommunity({
      action: "cancel-upload",
      resourceId: prepared.resourceId,
      storagePath: prepared.storagePath,
    }).catch(() => undefined);
    throw new AppServiceError("No se pudo subir el archivo.", uploadError.name || "UPLOAD_FAILED");
  }

  await requestCommunity<{ resourceId: string }>({
    action: "complete-submission",
    sectionId: input.sectionId,
    resourceId: prepared.resourceId,
    storagePath: prepared.storagePath,
    title: input.title,
    description: input.description,
    fileName: input.file.name,
    fileSize: input.file.size,
  });
  return prepared.resourceId;
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
