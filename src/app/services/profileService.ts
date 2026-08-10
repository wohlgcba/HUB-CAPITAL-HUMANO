import { supabase } from "../lib/supabaseClient";
import type { MyProfileDetails } from "../types/profile";
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

export async function getMyProfileDetails(): Promise<MyProfileDetails> {
  const { data, error } = await supabase.rpc("get_my_profile_details").maybeSingle<MyProfileRow>();
  if (error) throw toServiceError(error, "No se pudo cargar tu perfil.");
  if (!data) throw new Error("No se encontró un perfil activo para tu usuario.");

  const avatarUrl = await getSignedAssetUrl(profileAvatarBucket, data.avatar_path);
  return mapProfileDetails(data, avatarUrl);
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

function mapProfileDetails(row: MyProfileRow, avatarUrl: string | null): MyProfileDetails {
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
  };
}
