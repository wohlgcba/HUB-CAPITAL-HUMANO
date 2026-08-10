import type { AppRole } from "./auth";

export type MyProfileDetails = {
  profileId: string;
  authUserId: string;
  directoryPersonId: string | null;
  fullName: string;
  area: string | null;
  jobRole: string | null;
  phone: string | null;
  email: string;
  building: string | null;
  cuit: string | null;
  systemRole: AppRole;
  isActive: boolean;
  mustChangePassword: boolean;
  avatarPath: string | null;
  avatarUrl: string | null;
  emailNotificationsEnabled: boolean | null;
};
