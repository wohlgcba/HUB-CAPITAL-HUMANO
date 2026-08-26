import { supabase } from "../lib/supabaseClient";
import type { EditableProfileInput, MyProfileDetails } from "../types/profile";
import type { DirectoryLinkType } from "../types/directory";
import { getMyPendingDirectoryChangeRequest } from "./profileChangeService";
import { toServiceError } from "./serviceError";
import {
  createProfileAvatarPath,
  getProfileAvatarContentType,
  getSignedAssetUrl,
  removeStorageObjects,
  uploadStorageFile,
  validateProfileAvatar,
} from "./storageService";

const profileAvatarBucket = "profile-avatars";

type MyProfileRow = {
  profile_id: string;
  auth_user_id: string;
  directory_person_id: string | null;
  full_name: string;
  area: string | null;
  job_role: string | null;
  phone: string | null;
  email: string;
  gcba_building: string | null;
  cuit: string | null;
  system_role: "user" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  avatar_path: string | null;
  email_notifications_enabled: boolean | null;
};

type LinkTypeRow = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
};

export async function getMyProfileDetails(): Promise<MyProfileDetails> {
  const { data, error } = await supabase.rpc("get_my_profile_details").maybeSingle<MyProfileRow>();
  if (error) throw toServiceError(error, "No se pudo cargar tu perfil.");
  if (!data) throw new Error("No se encontró un perfil activo para tu usuario.");

  const [avatarUrl, linkTypeData, pendingChangeRequest] = await Promise.all([
    getSignedAssetUrl(profileAvatarBucket, data.avatar_path),
    getMyProfileLinkTypes(data.directory_person_id),
    getMyPendingDirectoryChangeRequest(),
  ]);
  return mapProfileDetails(data, avatarUrl, linkTypeData.current, linkTypeData.available, pendingChangeRequest);
}

export async function saveMyEditableProfile(current: MyProfileDetails, input: EditableProfileInput) {
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const { error } = await supabase.rpc("update_my_contact_details", {
    new_full_name: fullName,
    new_phone: input.phone?.trim() || null,
  });
  if (error) throw toServiceError(error, "No se pudieron actualizar tus datos de contacto.");

  const normalizedEmail = input.email.trim().toLowerCase();
  let emailChangeRequested = false;
  if (normalizedEmail !== current.email.toLowerCase()) {
    const emailResult = await supabase.auth.updateUser({ email: normalizedEmail });
    if (emailResult.error) throw toServiceError(emailResult.error, "No se pudo iniciar el cambio de email.");
    emailChangeRequested = true;
  }

  return { emailChangeRequested };
}

export async function saveMyProfileAvatar(profile: MyProfileDetails, file: File) {
  validateProfileAvatar(file);
  const contentType = getProfileAvatarContentType(file);
  const uploadFile = file.type === contentType ? file : new File([file], file.name, { type: contentType });
  const nextPath = createProfileAvatarPath(profile.authUserId, file);
  await uploadStorageFile(profileAvatarBucket, nextPath, uploadFile);

  const { error } = await supabase.rpc("update_my_profile_avatar", { new_avatar_path: nextPath });
  if (error) {
    await removeStorageObjects([{ bucket: profileAvatarBucket, path: nextPath }]).catch(() => undefined);
    throw toServiceError(error, "La foto se subió, pero no se pudo actualizar el perfil.");
  }

  if (profile.avatarPath && profile.avatarPath !== nextPath) {
    await removeStorageObjects([{ bucket: profileAvatarBucket, path: profile.avatarPath }]).catch(() => undefined);
  }

  const avatarUrl = await getSignedAssetUrl(profileAvatarBucket, nextPath);
  return { avatarPath: nextPath, avatarUrl };
}

async function getMyProfileLinkTypes(directoryPersonId: string | null) {
  const availableResult = await supabase
    .from("link_types")
    .select("id,name,color,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (availableResult.error) throw toServiceError(availableResult.error, "No se pudieron cargar los tipos de enlace.");
  const available = (availableResult.data as LinkTypeRow[]).map(mapLinkType);
  if (!directoryPersonId) return { current: [] as DirectoryLinkType[], available };

  const relationResult = await supabase
    .from("directory_person_link_types")
    .select("link_type_id")
    .eq("person_id", directoryPersonId);
  if (relationResult.error) throw toServiceError(relationResult.error, "No se pudieron cargar tus tipos de enlace.");
  const selectedIds = new Set(relationResult.data.map((relation) => relation.link_type_id));
  return { current: available.filter((linkType) => selectedIds.has(linkType.id)), available };
}

function mapLinkType(row: LinkTypeRow): DirectoryLinkType {
  return { id: row.id, name: row.name, color: row.color, sortOrder: row.sort_order };
}

function mapProfileDetails(
  row: MyProfileRow,
  avatarUrl: string | null,
  linkTypes: DirectoryLinkType[],
  availableLinkTypes: DirectoryLinkType[],
  pendingChangeRequest: MyProfileDetails["pendingChangeRequest"],
): MyProfileDetails {
  return {
    profileId: row.profile_id,
    authUserId: row.auth_user_id,
    directoryPersonId: row.directory_person_id,
    fullName: row.full_name,
    area: row.area,
    jobRole: row.job_role,
    phone: row.phone,
    email: row.email,
    building: row.gcba_building,
    cuit: row.cuit,
    systemRole: row.system_role,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password,
    avatarPath: row.avatar_path,
    avatarUrl,
    emailNotificationsEnabled: row.email_notifications_enabled,
    linkTypes,
    availableLinkTypes,
    pendingChangeRequest,
  };
}
