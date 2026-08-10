import { supabase } from "../lib/supabaseClient";
import type { HubStats } from "../types/hub";
import { toServiceError } from "./serviceError";

export async function getHubStats(): Promise<HubStats> {
  const [membersResult, resourcesResult, sectionsResult] = await Promise.all([
    supabase.from("directory_people").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("section_resources").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("sections").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const firstError = membersResult.error || resourcesResult.error || sectionsResult.error;
  if (firstError) throw toServiceError(firstError, "No se pudieron calcular los indicadores del HUB.");

  return {
    members: membersResult.count ?? 0,
    resources: resourcesResult.count ?? 0,
    sections: sectionsResult.count ?? 0,
  };
}
