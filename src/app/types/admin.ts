import type { AppRole } from "./auth";

export type AdminDashboardStats = {
  sections: number;
  publishedSections: number;
  resources: number;
  publishedResources: number;
  users: number;
  activeUsers: number;
  pending: number;
};

export type AdminPersonInput = {
  name: string;
  area: string;
  role: string | null;
  linkTypeIds: string[];
  phone: string | null;
  email: string | null;
  building: string | null;
  cuit: string | null;
  isActive: boolean;
  systemRole: AppRole;
};

export type AdminPersonAccess = {
  cuit: string | null;
  profileId: string | null;
  authUserId: string | null;
  systemRole: AppRole;
  accountIsActive: boolean;
  mustChangePassword: boolean;
  firstLoginAt: string | null;
  lastLoginAt: string | null;
};

export type AdminMetricGroup = {
  label: string;
  value: number;
};

export type AdminMetrics = {
  totalUsers: number;
  activeUsers: number;
  sections: number;
  resources: number;
  recentResources: number;
  resourcesBySection: AdminMetricGroup[];
  usersByArea: AdminMetricGroup[];
};
