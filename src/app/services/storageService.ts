import { supabase } from "../lib/supabaseClient";
import type { ResourceFile, ResourceFileKind } from "../types/resources";
import { toServiceError } from "./serviceError";

const signedUrlLifetimeSeconds = 60 * 60;
const sectionBannerLimit = 10 * 1024 * 1024;
const resourceFileLimit = 50 * 1024 * 1024;
const profileAvatarLimit = 5 * 1024 * 1024;
const signedUrlRefreshMarginMs = 5 * 60 * 1000;

type HubBucket = "section-banners" | "resource-covers" | "resource-files" | "profile-avatars";
type StoredObject = { bucket: HubBucket | string; path: string };
type CachedSignedUrl = { url: string; expiresAt: number };

const signedUrlCache = new Map<string, CachedSignedUrl>();

const resourceKindsByExtension: Record<string, ResourceFileKind> = {
  pdf: "pdf",
  ppt: "powerpoint",
  pptx: "powerpoint",
  doc: "word",
  docx: "word",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
};

export async function getSignedAssetUrl(bucket: string, storagePath: string | null) {
  if (!storagePath) return null;

  const cacheKey = `${bucket}:${storagePath}`;
  const cached = signedUrlCache.get(cacheKey);
  if (cached && cached.expiresAt - signedUrlRefreshMarginMs > Date.now()) return cached.url;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(storagePath, signedUrlLifetimeSeconds);
  if (error) return null;
  signedUrlCache.set(cacheKey, { url: data.signedUrl, expiresAt: Date.now() + signedUrlLifetimeSeconds * 1000 });
  return data.signedUrl;
}

export async function getSignedAssetUrls(bucket: string, storagePaths: Array<string | null>) {
  const uniquePaths = [...new Set(storagePaths.filter((path): path is string => Boolean(path)))];
  const urlsByPath = new Map<string, string | null>();
  const pathsToSign: string[] = [];

  for (const path of uniquePaths) {
    const cached = signedUrlCache.get(`${bucket}:${path}`);
    if (cached && cached.expiresAt - signedUrlRefreshMarginMs > Date.now()) urlsByPath.set(path, cached.url);
    else pathsToSign.push(path);
  }

  if (pathsToSign.length > 0) {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrls(pathsToSign, signedUrlLifetimeSeconds);
    if (!error && data) {
      for (const [index, result] of data.entries()) {
        const path = result.path ?? pathsToSign[index];
        if (!path) continue;
        const url = result.signedUrl ?? null;
        urlsByPath.set(path, url);
        if (url) signedUrlCache.set(`${bucket}:${path}`, { url, expiresAt: Date.now() + signedUrlLifetimeSeconds * 1000 });
      }
    } else {
      for (const path of pathsToSign) urlsByPath.set(path, null);
    }
  }

  return urlsByPath;
}

export async function getDownloadUrl(file: ResourceFile) {
  if (!file.allowDownload) throw new Error("La descarga no está habilitada para este archivo.");

  const { data, error } = await supabase.storage
    .from(file.storageBucket)
    .createSignedUrl(file.storagePath, signedUrlLifetimeSeconds, { download: file.fileName });

  if (error) throw toServiceError(error, "No se pudo preparar la descarga.");
  return data.signedUrl;
}

export function validateSectionBanner(file: File) {
  if (!file.type.match(/^image\/(png|jpeg|webp)$/)) {
    throw new Error("La imagen debe ser PNG, JPG o WEBP.");
  }
  if (file.size > sectionBannerLimit) throw new Error("La imagen no puede superar los 10 MB.");
}

export function validateResourceFile(file: File) {
  const kind = inferResourceFileKind(file);
  if (!kind || kind === "other") throw new Error("El archivo debe ser PDF, PPTX, DOCX o XLSX.");
  if (file.size > resourceFileLimit) throw new Error("El archivo no puede superar los 50 MB.");
  return kind;
}

export function validateProfileAvatar(file: File) {
  getProfileAvatarContentType(file);
  if (file.size > profileAvatarLimit) throw new Error("La foto no puede superar los 5 MB.");
}

export function getProfileAvatarContentType(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (file.type === "image/png" || (!file.type && extension === "png")) return "image/png";
  if (["image/jpeg", "image/jpg"].includes(file.type) || (!file.type && ["jpg", "jpeg"].includes(extension))) return "image/jpeg";
  throw new Error("La foto debe ser JPG, JPEG o PNG.");
}

export function inferResourceFileKind(file: File): ResourceFileKind {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase("es-AR") ?? "";
  return resourceKindsByExtension[extension] ?? "other";
}

export function createStoragePath(ownerId: string, fileName: string) {
  const normalizedName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "archivo";
  return `${ownerId}/${crypto.randomUUID()}-${normalizedName}`;
}

export function createProfileAvatarPath(authUserId: string, file: File) {
  const extension = getProfileAvatarContentType(file) === "image/png" ? "png" : "jpg";
  return `${authUserId}/${crypto.randomUUID()}.${extension}`;
}

export async function uploadStorageFile(bucket: HubBucket, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) throw toServiceError(error, "No se pudo subir el archivo.");
  return path;
}

export async function removeStorageObjects(objects: StoredObject[]) {
  const pathsByBucket = new Map<string, Set<string>>();
  for (const object of objects) {
    if (!object.path) continue;
    const paths = pathsByBucket.get(object.bucket) ?? new Set<string>();
    paths.add(object.path);
    pathsByBucket.set(object.bucket, paths);
  }

  for (const [bucket, paths] of pathsByBucket) {
    if (paths.size === 0) continue;
    const { error } = await supabase.storage.from(bucket).remove([...paths]);
    if (error) throw toServiceError(error, "No se pudo eliminar un archivo de Storage.");
  }
}
