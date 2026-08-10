import { supabase } from "../lib/supabaseClient";
import type { RecentResource, ResourceFile, ResourceFileKind, SectionResource } from "../types/resources";
import { toServiceError } from "./serviceError";
import { getDownloadUrl as createDownloadUrl, getSignedAssetUrl } from "./storageService";

type ResourceRow = {
  id: string;
  section_id: string;
  title: string;
  description: string | null;
  cover_image_path: string | null;
  thumbnail_strategy: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
  published_at: string;
  updated_at: string;
};

type FileRow = {
  id: string;
  resource_id: string;
  storage_bucket: string;
  storage_path: string;
  file_name: string;
  file_kind: ResourceFileKind;
  mime_type: string | null;
  file_size_bytes: number | string | null;
  thumbnail_path: string | null;
  sort_order: number;
  allow_download: boolean;
};

const resourceColumns =
  "id,section_id,title,description,cover_image_path,thumbnail_strategy,sort_order,is_featured,is_active,published_at,updated_at";
const fileColumns =
  "id,resource_id,storage_bucket,storage_path,file_name,file_kind,mime_type,file_size_bytes,thumbnail_path,sort_order,allow_download";

export async function listSectionResources(sectionId: string): Promise<SectionResource[]> {
  const { data, error } = await supabase
    .from("section_resources")
    .select(resourceColumns)
    .eq("section_id", sectionId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });

  if (error) throw toServiceError(error, "No se pudieron cargar los recursos de la sección.");
  return hydrateResources(data as ResourceRow[]);
}

export async function getRecentResources(limit = 5): Promise<RecentResource[]> {
  const { data, error } = await supabase
    .from("section_resources")
    .select(resourceColumns)
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, "No se pudieron cargar los recursos recientes.");
  const resources = await hydrateResources(data as ResourceRow[]);
  const sectionIds = [...new Set(resources.map((resource) => resource.sectionId))];

  if (sectionIds.length === 0) return [];

  const sectionsResult = await supabase.from("sections").select("id,title").in("id", sectionIds).eq("is_active", true);
  if (sectionsResult.error) throw toServiceError(sectionsResult.error, "No se pudieron identificar las secciones.");

  const sectionTitles = new Map(sectionsResult.data.map((section) => [section.id, section.title]));
  return resources.map((resource) => ({ ...resource, sectionTitle: sectionTitles.get(resource.sectionId) ?? null }));
}

export async function getResourceById(resourceId: string): Promise<SectionResource | null> {
  const { data, error } = await supabase
    .from("section_resources")
    .select(resourceColumns)
    .eq("id", resourceId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw toServiceError(error, "No se pudo cargar el recurso.");
  if (!data) return null;

  const [resource] = await hydrateResources([data as ResourceRow]);
  return resource;
}

export async function getResourceDownloadUrl(file: ResourceFile) {
  return createDownloadUrl(file);
}

async function hydrateResources(rows: ResourceRow[]): Promise<SectionResource[]> {
  if (rows.length === 0) return [];

  const resourceIds = rows.map((resource) => resource.id);
  const { data: filesData, error: filesError } = await supabase
    .from("resource_files")
    .select(fileColumns)
    .in("resource_id", resourceIds)
    .order("sort_order", { ascending: true });

  if (filesError) throw toServiceError(filesError, "No se pudieron cargar los archivos de los recursos.");

  const files = await Promise.all((filesData as FileRow[]).map(hydrateFile));
  const filesByResource = new Map<string, ResourceFile[]>();
  for (const file of files) {
    const current = filesByResource.get(file.resourceId) ?? [];
    current.push(file);
    filesByResource.set(file.resourceId, current);
  }

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      sectionId: row.section_id,
      title: row.title,
      description: row.description,
      coverImageUrl: await getSignedAssetUrl("resource-covers", row.cover_image_path),
      thumbnailStrategy: row.thumbnail_strategy,
      sortOrder: row.sort_order,
      isFeatured: row.is_featured,
      isActive: row.is_active,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      files: filesByResource.get(row.id) ?? [],
    })),
  );
}

async function hydrateFile(row: FileRow): Promise<ResourceFile> {
  const [viewUrl, thumbnailUrl] = await Promise.all([
    getSignedAssetUrl(row.storage_bucket, row.storage_path),
    getSignedAssetUrl("resource-covers", row.thumbnail_path),
  ]);

  return {
    id: row.id,
    resourceId: row.resource_id,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileKind: row.file_kind,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes === null ? null : Number(row.file_size_bytes),
    thumbnailUrl,
    sortOrder: row.sort_order,
    allowDownload: row.allow_download,
    viewUrl,
  };
}
