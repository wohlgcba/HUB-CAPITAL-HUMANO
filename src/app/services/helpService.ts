import { supabase } from "../lib/supabaseClient";
import type { HelpFaq, HelpFaqInput } from "../types/help";
import { isHelpFaqIconName } from "../types/help";
import { toServiceError } from "./serviceError";

type HelpFaqRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
  admin_only: boolean;
  created_at: string;
  updated_at: string;
};

const helpFaqColumns =
  "id,title,content,category,icon_name,sort_order,is_active,admin_only,created_at,updated_at";

export async function listHelpFaqs(includeUnpublished = false): Promise<HelpFaq[]> {
  let query = supabase
    .from("help_faqs")
    .select(helpFaqColumns)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!includeUnpublished) query = query.eq("is_active", true).eq("admin_only", false);

  const { data, error } = await query;
  if (error) throw toServiceError(error, "No se pudieron cargar las preguntas frecuentes.");
  return (data as HelpFaqRow[]).map(mapHelpFaq);
}

export async function createHelpFaq(input: HelpFaqInput): Promise<HelpFaq> {
  const { data, error } = await supabase
    .from("help_faqs")
    .insert(toHelpFaqPayload(input))
    .select(helpFaqColumns)
    .single();

  if (error) throw toServiceError(error, "No se pudo crear la pregunta frecuente.");
  return mapHelpFaq(data as HelpFaqRow);
}

export async function updateHelpFaq(id: string, input: HelpFaqInput): Promise<HelpFaq> {
  const { data, error } = await supabase
    .from("help_faqs")
    .update(toHelpFaqPayload(input))
    .eq("id", id)
    .select(helpFaqColumns)
    .single();

  if (error) throw toServiceError(error, "No se pudo actualizar la pregunta frecuente.");
  return mapHelpFaq(data as HelpFaqRow);
}

function toHelpFaqPayload(input: HelpFaqInput) {
  return {
    title: input.title.trim(),
    content: input.content.trim(),
    category: input.category.trim(),
    icon_name: input.iconName,
    sort_order: input.sortOrder,
    is_active: input.isActive,
    admin_only: input.adminOnly,
  };
}

function mapHelpFaq(row: HelpFaqRow): HelpFaq {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    category: row.category,
    iconName: isHelpFaqIconName(row.icon_name) ? row.icon_name : "help",
    sortOrder: row.sort_order,
    isActive: row.is_active,
    adminOnly: row.admin_only,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
