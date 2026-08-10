import { supabase } from "../lib/supabaseClient";
import type { ResourceFile } from "../types/resources";
import { toServiceError } from "./serviceError";

const signedUrlLifetimeSeconds = 60 * 60;

export async function getSignedAssetUrl(bucket: string, storagePath: string | null) {
  if (!storagePath) return null;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, signedUrlLifetimeSeconds);
  if (error) return null;
  return data.signedUrl;
}

export async function getDownloadUrl(file: ResourceFile) {
  if (!file.allowDownload) throw new Error("La descarga no está habilitada para este archivo.");

  const { data, error } = await supabase.storage
    .from(file.storageBucket)
    .createSignedUrl(file.storagePath, signedUrlLifetimeSeconds, { download: file.fileName });

  if (error) throw toServiceError(error, "No se pudo preparar la descarga.");
  return data.signedUrl;
}
