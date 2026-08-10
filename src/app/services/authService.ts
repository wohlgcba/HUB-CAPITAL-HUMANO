import type { Session } from "@supabase/supabase-js";
import { setSessionPersistence, supabase } from "../lib/supabaseClient";
import type { AuthenticatedUser, UserProfile } from "../types/auth";
import { AppServiceError, toServiceError } from "./serviceError";

type ProfileRow = {
  id: string;
  auth_user_id: string;
  directory_person_id: string | null;
  email: string;
  full_name: string;
  role: "user" | "admin";
  must_change_password: boolean;
  is_active: boolean;
  first_login_at: string | null;
  last_login_at: string | null;
};

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw toServiceError(error, "No se pudo recuperar la sesión.");
  return data.session;
}

export async function getProfile(authUserId: string): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,auth_user_id,directory_person_id,email,full_name,role,must_change_password,is_active,first_login_at,last_login_at",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle<ProfileRow>();

  if (error) throw toServiceError(error, "No se pudo cargar el perfil del usuario.");
  if (!data) throw new AppServiceError("Tu cuenta todavía no tiene un perfil habilitado.", "PROFILE_NOT_FOUND");
  if (!data.is_active) throw new AppServiceError("Tu usuario se encuentra inactivo.", "USER_INACTIVE");

  return mapProfile(data);
}

export async function hydrateAuthenticatedUser(session: Session): Promise<AuthenticatedUser> {
  const profile = await getProfile(session.user.id);
  return { session, user: session.user, profile };
}

export async function signIn(email: string, password: string, remember: boolean): Promise<AuthenticatedUser> {
  setSessionPersistence(remember);
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

  if (error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes("invalid login credentials")) {
      throw new AppServiceError("Correo o contraseña incorrectos.", "INVALID_CREDENTIALS");
    }
    if (normalizedMessage.includes("email not confirmed")) {
      throw new AppServiceError("El correo todavía no fue confirmado.", "EMAIL_NOT_CONFIRMED");
    }
    throw toServiceError(error, "No se pudo iniciar sesión. Revisá tu conexión e intentá nuevamente.");
  }

  if (!data.session || !data.user) throw new AppServiceError("Supabase no devolvió una sesión válida.", "SESSION_MISSING");

  try {
    const authenticatedUser = await hydrateAuthenticatedUser(data.session);
    void recordLogin().catch(() => undefined);
    return authenticatedUser;
  } catch (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw toServiceError(error, "No se pudo cerrar la sesión.");
}

export async function changePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw toServiceError(error, "No se pudo actualizar la contraseña.");

  const { error: profileError } = await supabase.rpc("complete_password_change");
  if (profileError) {
    throw toServiceError(profileError, "La contraseña cambió, pero no se pudo actualizar el estado del perfil.");
  }
}

export async function requestPasswordReset(email: string) {
  const redirectTo = `${window.location.origin}/`;
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw toServiceError(error, "No se pudo enviar el correo de recuperación.");
}

async function recordLogin() {
  const { error } = await supabase.rpc("record_login");
  if (error) throw toServiceError(error, "No se pudo registrar el ingreso.");
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    authUserId: row.auth_user_id,
    directoryPersonId: row.directory_person_id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    isActive: row.is_active,
    firstLoginAt: row.first_login_at,
    lastLoginAt: row.last_login_at,
  };
}
