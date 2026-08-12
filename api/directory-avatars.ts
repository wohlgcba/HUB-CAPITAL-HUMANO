import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const signedUrlLifetimeSeconds = 60 * 60;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Caller = { role: "user" | "admin" };
type ProfileRow = { directory_person_id: string | null; avatar_path: string | null };
type PersonRow = { id: string; is_active: boolean; admin_only: boolean };

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "private, max-age=300");
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Método no permitido." });
  }

  try {
    const adminClient = createAdminClient();
    const caller = await requireActiveUser(adminClient, readBearerToken(request));
    const personIds = parsePersonIds(request.body);
    if (personIds.length === 0) return response.status(200).json({ avatars: {} });

    const [profilesResult, peopleResult] = await Promise.all([
      adminClient.from("profiles").select("directory_person_id,avatar_path").in("directory_person_id", personIds),
      adminClient.from("directory_people").select("id,is_active,admin_only").in("id", personIds),
    ]);
    const firstError = profilesResult.error || peopleResult.error;
    if (firstError) throw firstError;

    const visiblePeople = new Set(
      (peopleResult.data as PersonRow[])
        .filter((person) => person.is_active && (!person.admin_only || caller.role === "admin"))
        .map((person) => person.id),
    );
    const profiles = (profilesResult.data as ProfileRow[]).filter(
      (profile) => profile.directory_person_id && profile.avatar_path && visiblePeople.has(profile.directory_person_id),
    );
    const paths = [...new Set(profiles.map((profile) => profile.avatar_path).filter((path): path is string => Boolean(path)))];
    const urlsByPath = new Map<string, string | null>();

    if (paths.length > 0) {
      const { data, error } = await adminClient.storage.from("profile-avatars").createSignedUrls(paths, signedUrlLifetimeSeconds);
      if (error) throw error;
      for (const [index, item] of data.entries()) {
        const path = item.path ?? paths[index];
        if (path) urlsByPath.set(path, item.signedUrl ?? null);
      }
    }

    const avatars = Object.fromEntries(
      profiles.map((profile) => [profile.directory_person_id!, urlsByPath.get(profile.avatar_path!) ?? null]),
    );
    return response.status(200).json({ avatars });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las fotos de perfil.";
    return response.status(message === "UNAUTHORIZED" ? 401 : 500).json({ error: message });
  }
}

function createAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !secretKey) throw new Error("Servicio no configurado.");
  return createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function requireActiveUser(adminClient: SupabaseClient, token: string): Promise<Caller> {
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);
  if (userError || !userData.user) throw new Error("UNAUTHORIZED");
  const { data: profile, error } = await adminClient.from("profiles").select("role,is_active").eq("auth_user_id", userData.user.id).maybeSingle();
  if (error || !profile?.is_active) throw new Error("UNAUTHORIZED");
  return { role: profile.role };
}

function readBearerToken(request: VercelRequest) {
  const authorization = Array.isArray(request.headers.authorization) ? request.headers.authorization[0] : request.headers.authorization;
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("UNAUTHORIZED");
  return token;
}

function parsePersonIds(body: unknown) {
  const parsed = typeof body === "string" ? JSON.parse(body) as unknown : body;
  if (!parsed || typeof parsed !== "object") return [];
  const ids = (parsed as { personIds?: unknown }).personIds;
  if (!Array.isArray(ids)) return [];
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && uuidPattern.test(id)))].slice(0, 100);
}
