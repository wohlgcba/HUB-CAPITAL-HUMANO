import type { AppRole } from "./auth";
import type { DirectoryLinkType } from "./directory";

export type DirectoryChangeValues = {
  cuit?: string | null;
  area?: string | null;
  building?: string | null;
  linkTypeIds?: string[];
};

export type DirectoryChangeRequest = {
  id: string;
  profileId: string;
  directoryPersonId: string;
  personName: string;
  personEmail: string | null;
  currentValues: DirectoryChangeValues;
  requestedChanges: DirectoryChangeValues;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
  createdAt: string;
  updatedAt: string;
};

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
  linkTypes: DirectoryLinkType[];
  availableLinkTypes: DirectoryLinkType[];
  pendingChangeRequest: DirectoryChangeRequest | null;
};

export type EditableProfileInput = {
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
};

export type RestrictedProfileInput = {
  cuit: string;
  area: string;
  building: string | null;
  linkTypeIds: string[];
};

export type ProfileFormDraft = EditableProfileInput & RestrictedProfileInput;
