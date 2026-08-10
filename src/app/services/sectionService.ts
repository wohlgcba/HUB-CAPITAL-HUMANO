import { supabase } from "../lib/supabaseClient";
import type { HubSection } from "../types/hub";
import { toServiceError } from "./serviceError";
import { getSignedAssetUrl } from "./storageService";

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
  updated_at: string;
};

export async function listPublishedSections(): Promise<HubSection[]> {
  const [sectionsResult, resourcesResult] = await Promise.all([
    supabase
      .from("sections")
      .select("id,slug,title,description,category,banner_path,cover_image_path,sort_order,is_active,updated_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase.from("section_resources").select("id,section_id").eq("is_active", true),
  ]);

  if (sectionsResult.error) throw toServiceError(sectionsResult.error, "No se pudieron cargar las secciones.");
  if (resourcesResult.error) throw toServiceError(resourcesResult.error, "No se pudieron contar los recursos.");

  const counts = new Map<string, number>();
  for (const resource of resourcesResult.data) counts.set(resource.section_id, (counts.get(resource.section_id) ?? 0) + 1);

  return Promise.all(
    (sectionsResult.data as SectionRow[]).map((section) => hydrateSection(section, counts.get(section.id) ?? 0)),
  );
}

export async function getSectionBySlug(slug: string): Promise<HubSection | null> {
  const sectionResult = await supabase
    .from("sections")
    .select("id,slug,title,description,category,banner_path,cover_image_path,sort_order,is_active,updated_at")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<SectionRow>();

  if (sectionResult.error) throw toServiceError(sectionResult.error, "No se pudo cargar la sección.");
  if (!sectionResult.data) return null;

  const countResult = await supabase
    .from("section_resources")
    .select("id", { count: "exact", head: true })
    .eq("section_id", sectionResult.data.id)
    .eq("is_active", true);
  if (countResult.error) throw toServiceError(countResult.error, "No se pudieron contar los recursos de la sección.");

  return hydrateSection(sectionResult.data, countResult.count ?? 0);
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
    bannerUrl,
    coverImageUrl,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    updatedAt: row.updated_at,
    resourceCount,
  };
}
