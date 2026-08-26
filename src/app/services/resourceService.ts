import { supabase } from "../lib/supabaseClient";
import type {
  RecentResource,
  ResourceFile,
  ResourceFileKind,
  ResourceInput,
  ResourceSearchItem,
  SectionResource,
} from "../types/resources";
import { toServiceError } from "./serviceError";
import {
  createStoragePath,
  getDownloadUrl as createDownloadUrl,
  getSignedAssetUrl,
  removeStorageObjects,
  uploadStorageFile,
  validateSectionBanner,
  validateResourceFile,
} from "./storageService";

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
  created_at: string;
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
  "id,section_id,title,description,cover_image_path,thumbnail_strategy,sort_order,is_featured,is_active,created_at,published_at,updated_at";
const fileColumns =
  "id,resource_id,storage_bucket,storage_path,file_name,file_kind,mime_type,file_size_bytes,thumbnail_path,sort_order,allow_download";

export async function listSectionResources(sectionId: string): Promise<SectionResource[]> {
  return listResourcesForSection(sectionId, false);
}

export async function listAdminSectionResources(sectionId: string): Promise<SectionResource[]> {
  return listResourcesForSection(sectionId, true);
}

export async function getRecentResources(limit = 5): Promise<RecentResource[]> {
  return getRecentResourcesInternal(limit, false);
}

export async function getAdminRecentResources(limit = 8): Promise<RecentResource[]> {
  return getRecentResourcesInternal(limit, true);
}

export async function listPublishedResourceSearchItems(): Promise<ResourceSearchItem[]> {
  const resourcesResult = await supabase
    .from("section_resources")
    .select("id,section_id,title,description,published_at")
    .eq("is_active", true)
    .order("title", { ascending: true });
  if (resourcesResult.error) throw toServiceError(resourcesResult.error, "No se pudieron cargar los recursos del buscador.");
  if (resourcesResult.data.length === 0) return [];

  const resourceIds = resourcesResult.data.map((resource) => resource.id);
  const sectionIds = [...new Set(resourcesResult.data.map((resource) => resource.section_id))];
  const [sectionsResult, filesResult] = await Promise.all([
    supabase.from("sections").select("id,title").in("id", sectionIds).eq("is_active", true),
    supabase.from("resource_files").select("resource_id,file_name,file_kind,sort_order").in("resource_id", resourceIds).order("sort_order", { ascending: true }),
  ]);
  const firstError = sectionsResult.error || filesResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudo completar la información del buscador.");

  const sectionTitles = new Map(sectionsResult.data.map((section) => [section.id, section.title]));
  const firstFileByResource = new Map<string, { file_name: string; file_kind: ResourceFileKind }>();
  for (const file of filesResult.data as Array<{ resource_id: string; file_name: string; file_kind: ResourceFileKind }>) {
    if (!firstFileByResource.has(file.resource_id)) firstFileByResource.set(file.resource_id, file);
  }

  return resourcesResult.data.flatMap((resource) => {
    const sectionTitle = sectionTitles.get(resource.section_id);
    if (!sectionTitle) return [];
    const file = firstFileByResource.get(resource.id) ?? null;
    return [{
      id: resource.id,
      title: resource.title,
      description: resource.description,
      sectionId: resource.section_id,
      sectionTitle,
      fileKind: file?.file_kind ?? null,
      fileName: file?.file_name ?? null,
      publishedAt: resource.published_at,
    }];
  });
}

export async function getResourceById(resourceId: string): Promise<SectionResource | null> {
  return getResourceByIdInternal(resourceId, false);
}

export async function getAdminResourceById(resourceId: string): Promise<SectionResource | null> {
  return getResourceByIdInternal(resourceId, true);
}

export async function createResource(input: ResourceInput): Promise<SectionResource> {
  if (!input.file) throw new Error("Seleccioná un archivo.");
  const fileKind = validateResourceFile(input.file);
  const resourceId = crypto.randomUUID();
  const storagePath = createStoragePath(resourceId, input.file.name);
  await uploadStorageFile("resource-files", storagePath, input.file);
  let coverPath: string | null = null;
  if (input.coverFile) {
    try {
      validateSectionBanner(input.coverFile);
      coverPath = createStoragePath(resourceId, input.coverFile.name);
      await uploadStorageFile("resource-covers", coverPath, input.coverFile);
    } catch (coverError) {
      await removeStorageObjects([{ bucket: "resource-files", path: storagePath }]).catch(() => undefined);
      throw coverError;
    }
  }

  const { error: resourceError } = await supabase.from("section_resources").insert({
    id: resourceId,
    section_id: input.sectionId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    cover_image_path: coverPath,
    thumbnail_strategy: "auto_from_first_file",
    is_featured: input.isFeatured,
    is_active: input.isActive,
    published_at: toIsoDate(input.publishedAt),
  });

  if (resourceError) {
    await removeStorageObjects([
      { bucket: "resource-files", path: storagePath },
      ...(coverPath ? [{ bucket: "resource-covers", path: coverPath }] : []),
    ]).catch(() => undefined);
    throw toServiceError(resourceError, "No se pudo crear el recurso.");
  }

  const { error: fileError } = await supabase.from("resource_files").insert({
    resource_id: resourceId,
    storage_bucket: "resource-files",
    storage_path: storagePath,
    file_name: input.file.name,
    file_kind: fileKind,
    mime_type: input.file.type || null,
    file_size_bytes: input.file.size,
    sort_order: 0,
    allow_download: input.allowDownload,
  });

  if (fileError) {
    await supabase.from("section_resources").delete().eq("id", resourceId);
    await removeStorageObjects([
      { bucket: "resource-files", path: storagePath },
      ...(coverPath ? [{ bucket: "resource-covers", path: coverPath }] : []),
    ]).catch(() => undefined);
    throw toServiceError(fileError, "No se pudo vincular el archivo con el recurso.");
  }

  const resource = await getResourceByIdInternal(resourceId, true);
  if (!resource) throw new Error("El recurso se creó, pero no pudo recuperarse.");
  return resource;
}

export async function updateResource(resource: SectionResource, input: ResourceInput): Promise<SectionResource> {
  const previousFile = resource.files[0] ?? null;
  let uploadedPath: string | null = null;
  let uploadedKind: ResourceFileKind | null = null;
  let uploadedCoverPath: string | null = null;

  if (input.file) {
    uploadedKind = validateResourceFile(input.file);
    uploadedPath = createStoragePath(resource.id, input.file.name);
    await uploadStorageFile("resource-files", uploadedPath, input.file);
  }

  if (input.coverFile) {
    validateSectionBanner(input.coverFile);
    uploadedCoverPath = createStoragePath(resource.id, input.coverFile.name);
    try {
      await uploadStorageFile("resource-covers", uploadedCoverPath, input.coverFile);
    } catch (coverError) {
      if (uploadedPath) await removeStorageObjects([{ bucket: "resource-files", path: uploadedPath }]).catch(() => undefined);
      throw coverError;
    }
  }

  const { error: resourceError } = await supabase
    .from("section_resources")
    .update({
      section_id: input.sectionId,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      cover_image_path: uploadedCoverPath ?? resource.coverImagePath,
      is_featured: input.isFeatured,
      is_active: input.isActive,
      published_at: toIsoDate(input.publishedAt),
    })
    .eq("id", resource.id);

  if (resourceError) {
    await removeStorageObjects([
      ...(uploadedPath ? [{ bucket: "resource-files", path: uploadedPath }] : []),
      ...(uploadedCoverPath ? [{ bucket: "resource-covers", path: uploadedCoverPath }] : []),
    ]).catch(() => undefined);
    throw toServiceError(resourceError, "No se pudo actualizar el recurso.");
  }

  const rollbackResourceUpdate = async () => {
    await supabase
      .from("section_resources")
      .update({
        section_id: resource.sectionId,
        title: resource.title,
        description: resource.description,
        cover_image_path: resource.coverImagePath,
        is_featured: resource.isFeatured,
        is_active: resource.isActive,
        published_at: resource.publishedAt,
      })
      .eq("id", resource.id);

    for (const file of resource.files) {
      await supabase
        .from("resource_files")
        .update({ allow_download: file.allowDownload, file_kind: file.fileKind })
        .eq("id", file.id);
    }

    await removeStorageObjects([
      ...(uploadedPath ? [{ bucket: "resource-files", path: uploadedPath }] : []),
      ...(uploadedCoverPath ? [{ bucket: "resource-covers", path: uploadedCoverPath }] : []),
    ]).catch(() => undefined);
  };

  if (input.file && uploadedPath && uploadedKind) {
    const filePayload = {
      storage_bucket: "resource-files",
      storage_path: uploadedPath,
      file_name: input.file.name,
      file_kind: uploadedKind,
      mime_type: input.file.type || null,
      file_size_bytes: input.file.size,
      allow_download: input.allowDownload,
    };
    const fileResult = previousFile
      ? await supabase.from("resource_files").update(filePayload).eq("id", previousFile.id)
      : await supabase.from("resource_files").insert({ resource_id: resource.id, sort_order: 0, ...filePayload });

    if (fileResult.error) {
      await rollbackResourceUpdate();
      throw toServiceError(fileResult.error, "No se pudo reemplazar el archivo del recurso.");
    }

    if (previousFile) {
      await removeStorageObjects([{ bucket: previousFile.storageBucket, path: previousFile.storagePath }]).catch(() => undefined);
    }
  } else if (resource.files.length > 0) {
    const { error: primaryFileError } = await supabase
      .from("resource_files")
      .update({ allow_download: input.allowDownload, file_kind: input.fileKind })
      .eq("id", resource.files[0].id);
    if (primaryFileError) {
      await rollbackResourceUpdate();
      throw toServiceError(primaryFileError, "No se pudo actualizar la información del archivo.");
    }
    if (resource.files.length > 1) {
      const { error: remainingFilesError } = await supabase
        .from("resource_files")
        .update({ allow_download: input.allowDownload })
        .eq("resource_id", resource.id)
        .neq("id", resource.files[0].id);
      if (remainingFilesError) {
        await rollbackResourceUpdate();
        throw toServiceError(remainingFilesError, "No se pudo actualizar el permiso de descarga.");
      }
    }
  }

  if (uploadedCoverPath && resource.coverImagePath && uploadedCoverPath !== resource.coverImagePath) {
    await removeStorageObjects([{ bucket: "resource-covers", path: resource.coverImagePath }]).catch(() => undefined);
  }

  const updated = await getResourceByIdInternal(resource.id, true);
  if (!updated) throw new Error("El recurso se actualizó, pero no pudo recuperarse.");
  return updated;
}

export async function publishResource(resourceId: string): Promise<SectionResource> {
  const { error } = await supabase
    .from("section_resources")
    .update({ is_active: true, published_at: new Date().toISOString() })
    .eq("id", resourceId);
  if (error) throw toServiceError(error, "No se pudo publicar el recurso.");

  await supabase
    .from("notifications")
    .update({ is_active: false })
    .eq("source_key", `resource:${resourceId}:submitted`);

  const resource = await getResourceByIdInternal(resourceId, true);
  if (!resource) throw new Error("El recurso se publicó, pero no pudo recuperarse.");
  return resource;
}

export async function deleteResource(resource: SectionResource) {
  const { error } = await supabase.from("section_resources").delete().eq("id", resource.id);
  if (error) throw toServiceError(error, "No se pudo eliminar el recurso.");

  await supabase
    .from("notifications")
    .update({ is_active: false })
    .eq("source_key", `resource:${resource.id}:submitted`);

  const storageObjects = [
    ...(resource.coverImagePath ? [{ bucket: "resource-covers", path: resource.coverImagePath }] : []),
    ...resource.files.flatMap((file) => [
      { bucket: file.storageBucket, path: file.storagePath },
      ...(file.thumbnailPath ? [{ bucket: "resource-covers", path: file.thumbnailPath }] : []),
    ]),
  ];

  try {
    await removeStorageObjects(storageObjects);
    return { storageCleanupFailed: false };
  } catch {
    return { storageCleanupFailed: true };
  }
}

export async function getResourceDownloadUrl(file: ResourceFile) {
  return createDownloadUrl(file);
}

async function listResourcesForSection(sectionId: string, includeInactive: boolean) {
  let query = supabase
    .from("section_resources")
    .select(resourceColumns)
    .eq("section_id", sectionId)
    .order("sort_order", { ascending: true })
    .order("published_at", { ascending: false });
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw toServiceError(error, "No se pudieron cargar los recursos de la sección.");
  return hydrateResources(data as ResourceRow[]);
}

async function getRecentResourcesInternal(limit: number, includeInactive: boolean): Promise<RecentResource[]> {
  let query = supabase
    .from("section_resources")
    .select(resourceColumns)
    .order("updated_at", { ascending: false })
    .limit(limit);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw toServiceError(error, "No se pudieron cargar los recursos recientes.");

  const resources = await hydrateResources(data as ResourceRow[]);
  const sectionIds = [...new Set(resources.map((resource) => resource.sectionId))];
  if (sectionIds.length === 0) return [];

  let sectionsQuery = supabase.from("sections").select("id,title").in("id", sectionIds);
  if (!includeInactive) sectionsQuery = sectionsQuery.eq("is_active", true);
  const sectionsResult = await sectionsQuery;
  if (sectionsResult.error) throw toServiceError(sectionsResult.error, "No se pudieron identificar las secciones.");

  const sectionTitles = new Map(sectionsResult.data.map((section) => [section.id, section.title]));
  return resources.map((resource) => ({ ...resource, sectionTitle: sectionTitles.get(resource.sectionId) ?? null }));
}

async function getResourceByIdInternal(resourceId: string, includeInactive: boolean) {
  let query = supabase.from("section_resources").select(resourceColumns).eq("id", resourceId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  if (error) throw toServiceError(error, "No se pudo cargar el recurso.");
  if (!data) return null;
  const [resource] = await hydrateResources([data as ResourceRow]);
  return resource;
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
      coverImagePath: row.cover_image_path,
      coverImageUrl: await getSignedAssetUrl("resource-covers", row.cover_image_path),
      thumbnailStrategy: row.thumbnail_strategy,
      sortOrder: row.sort_order,
      isFeatured: row.is_featured,
      isActive: row.is_active,
      createdAt: row.created_at,
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
    thumbnailPath: row.thumbnail_path,
    thumbnailUrl,
    sortOrder: row.sort_order,
    allowDownload: row.allow_download,
    viewUrl,
  };
}

function toIsoDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("La fecha de publicación no es válida.");
  return parsed.toISOString();
}
