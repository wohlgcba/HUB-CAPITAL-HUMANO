export type DirectoryLinkType = {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
};

export type DirectoryPersonSummary = {
  id: string;
  name: string;
  area: string;
  role: string | null;
  linkTypes: DirectoryLinkType[];
  avatarUrl: string | null;
  isActive: boolean;
  systemRole: "user" | "admin" | null;
  hasAccount: boolean;
  hasPendingChanges: boolean;
};

export type DirectoryPersonDetail = DirectoryPersonSummary & {
  phone: string | null;
  email: string | null;
  building: string | null;
  cuit?: string | null;
  accountIsActive?: boolean;
  mustChangePassword?: boolean;
  firstLoginAt?: string | null;
  lastLoginAt?: string | null;
};

export type DirectoryFilterOption = {
  value: string;
  label: string;
  count: number;
  color?: string;
};

export type DirectoryOrganizationUnit = {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  count: number;
};

export type DirectoryFilterOptions = {
  areas: DirectoryFilterOption[];
  organizationUnits: DirectoryOrganizationUnit[];
  linkTypes: DirectoryFilterOption[];
  buildings: DirectoryFilterOption[];
  statuses: DirectoryFilterOption[];
  total: number;
};

export type DirectoryQuery = {
  search: string;
  organizationUnitId: string;
  organizationExact: boolean;
  linkTypeId: string;
  building: string;
  status: string;
  includeInactive: boolean;
  page: number;
  pageSize: number;
};

export type DirectoryResult = {
  people: DirectoryPersonSummary[];
  filteredTotal: number;
};
