import { supabase } from "../lib/supabaseClient";
import type { HubSection, SectionInput } from "../types/hub";
import { toServiceError } from "./serviceError";
import {
  createStoragePath,
  getSignedAssetUrl,
  removeStorageObjects,
  uploadStorageFile,
  validateSectionBanner,
} from "./storageService";

type SectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  banner_path: string | null;
  cover_image_path: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

const sectionColumns =
  "id,slug,title,description,category,banner_path,cover_image_path,sort_order,is_active,created_at,updated_at";

export async function listPublishedSections(): Promise<HubSection[]> {
  return listSections(false);
}

export async function listAdminSections(): Promise<HubSection[]> {
  return listSections(true);
}

export async function getSectionBySlug(slug: string): Promise<HubSection | null> {
  return getSectionBySlugInternal(slug, false);
}

export async function getAdminSectionBySlug(slug: string): Promise<HubSection | null> {
  return getSectionBySlugInternal(slug, true);
}

export async function createSection(input: SectionInput): Promise<HubSection> {
  const sectionId = crypto.randomUUID();
  let bannerPath: string | null = null;

  if (input.bannerFile) {
    validateSectionBanner(input.bannerFile);
    bannerPath = createStoragePath(sectionId, input.bannerFile.name);
    await uploadStorageFile("section-banners", bannerPath, input.bannerFile);
  }

  const { error } = await supabase.from("sections").insert({
    id: sectionId,
    title: input.title.trim(),
    slug: input.slug.trim(),
    category: input.category.trim(),
    description: input.description.trim(),
    banner_path: bannerPath,
    cover_image_path: null,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    updated_at: toIsoDate(input.updatedAt),
  });

  if (error) {
    if (bannerPath) await removeStorageObjects([{ bucket: "section-banners", path: bannerPath }]).catch(() => undefined);
    throw toServiceError(error, "No se pudo crear la sección.");
  }

  const section = await getSectionById(sectionId, true);
  if (!section) throw new Error("La sección se creó, pero no pudo recuperarse.");
  return section;
}

export async function updateSection(section: HubSection, input: SectionInput): Promise<HubSection> {
  let nextBannerPath = section.bannerPath;
  let uploadedPath: string | null = null;

  if (input.bannerFile) {
    validateSectionBanner(input.bannerFile);
    uploadedPath = createStoragePath(section.id, input.bannerFile.name);
    await uploadStorageFile("section-banners", uploadedPath, input.bannerFile);
    nextBannerPath = uploadedPath;
  }

  const { error } = await supabase
    .from("sections")
    .update({
      title: input.title.trim(),
      slug: input.slug.trim(),
      category: input.category.trim(),
      description: input.description.trim(),
      banner_path: nextBannerPath,
      sort_order: input.sortOrder,
      is_active: input.isActive,
    })
    .eq("id", section.id);

  if (error) {
    if (uploadedPath) await removeStorageObjects([{ bucket: "section-banners", path: uploadedPath }]).catch(() => undefined);
    throw toServiceError(error, "No se pudo actualizar la sección.");
  }

  if (uploadedPath && section.bannerPath && section.bannerPath !== uploadedPath) {
    await removeStorageObjects([{ bucket: "section-banners", path: section.bannerPath }]).catch(() => undefined);
  }

  const updated = await getSectionById(section.id, true);
  if (!updated) throw new Error("La sección se actualizó, pero no pudo recuperarse.");
  return updated;
}

export async function deleteSection(section: HubSection) {
  const resourcesResult = await supabase
    .from("section_resources")
    .select("id,cover_image_path")
    .eq("section_id", section.id);
  if (resourcesResult.error) throw toServiceError(resourcesResult.error, "No se pudieron revisar los recursos asociados.");

  const resourceIds = resourcesResult.data.map((resource) => resource.id);
  const filesResult = resourceIds.length
    ? await supabase
        .from("resource_files")
        .select("storage_bucket,storage_path,thumbnail_path")
        .in("resource_id", resourceIds)
    : { data: [], error: null };
  if (filesResult.error) throw toServiceError(filesResult.error, "No se pudieron revisar los archivos asociados.");

  const { error: deleteError } = await supabase.from("sections").delete().eq("id", section.id);
  if (deleteError) throw toServiceError(deleteError, "No se pudo eliminar la sección.");

  const storageObjects = [
    ...[section.bannerPath, section.coverImagePath]
      .filter((path): path is string => Boolean(path))
      .map((path) => ({ bucket: "section-banners", path })),
    ...resourcesResult.data.flatMap((resource) =>
      resource.cover_image_path ? [{ bucket: "resource-covers", path: resource.cover_image_path }] : [],
    ),
    ...filesResult.data.flatMap((file) => [
      { bucket: file.storage_bucket, path: file.storage_path },
      ...(file.thumbnail_path ? [{ bucket: "resource-covers", path: file.thumbnail_path }] : []),
    ]),
  ];

  try {
    await removeStorageObjects(storageObjects);
    return { storageCleanupFailed: false };
  } catch {
    return { storageCleanupFailed: true };
  }
}

async function listSections(includeInactive: boolean): Promise<HubSection[]> {
  let sectionsQuery = supabase.from("sections").select(sectionColumns).order("sort_order", { ascending: true });
  let resourcesQuery = supabase.from("section_resources").select("id,section_id");
  if (!includeInactive) {
    sectionsQuery = sectionsQuery.eq("is_active", true);
    resourcesQuery = resourcesQuery.eq("is_active", true);
  }

  const [sectionsResult, resourcesResult] = await Promise.all([sectionsQuery, resourcesQuery]);
  if (sectionsResult.error) throw toServiceError(sectionsResult.error, "No se pudieron cargar las secciones.");
  if (resourcesResult.error) throw toServiceError(resourcesResult.error, "No se pudieron contar los recursos.");

  const counts = new Map<string, number>();
  for (const resource of resourcesResult.data) counts.set(resource.section_id, (counts.get(resource.section_id) ?? 0) + 1);
  return Promise.all((sectionsResult.data as SectionRow[]).map((section) => hydrateSection(section, counts.get(section.id) ?? 0)));
}

async function getSectionBySlugInternal(slug: string, includeInactive: boolean) {
  let query = supabase.from("sections").select(sectionColumns).eq("slug", slug);
  if (!includeInactive) query = query.eq("is_active", true);
  const sectionResult = await query.maybeSingle<SectionRow>();
  if (sectionResult.error) throw toServiceError(sectionResult.error, "No se pudo cargar la sección.");
  if (!sectionResult.data) return null;
  return hydrateWithCount(sectionResult.data, includeInactive);
}

async function getSectionById(sectionId: string, includeInactive: boolean) {
  let query = supabase.from("sections").select(sectionColumns).eq("id", sectionId);
  if (!includeInactive) query = query.eq("is_active", true);
  const result = await query.maybeSingle<SectionRow>();
  if (result.error) throw toServiceError(result.error, "No se pudo cargar la sección.");
  if (!result.data) return null;
  return hydrateWithCount(result.data, includeInactive);
}

async function hydrateWithCount(section: SectionRow, includeInactive: boolean) {
  let countQuery = supabase
    .from("section_resources")
    .select("id", { count: "exact", head: true })
    .eq("section_id", section.id);
  if (!includeInactive) countQuery = countQuery.eq("is_active", true);
  const countResult = await countQuery;
  if (countResult.error) throw toServiceError(countResult.error, "No se pudieron contar los recursos de la sección.");
  return hydrateSection(section, countResult.count ?? 0);
}

async function hydrateSection(row: SectionRow, resourceCount: number): Promise<HubSection> {
  const [bannerUrl, coverImageUrl] = await Promise.all([
    getSignedAssetUrl("section-banners", row.banner_path),
    getSignedAssetUrl("section-banners", row.cover_image_path),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    category: row.category,
    bannerPath: row.banner_path,
    coverImagePath: row.cover_image_path,
    bannerUrl,
    coverImageUrl,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resourceCount,
  };
}

function toIsoDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
