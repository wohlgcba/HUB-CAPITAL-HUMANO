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
};

export type DirectoryPersonDetail = DirectoryPersonSummary & {
  phone: string | null;
  email: string | null;
  building: string | null;
};

export type DirectoryFilterOption = {
  value: string;
  label: string;
  count: number;
  color?: string;
};

export type DirectoryFilterOptions = {
  areas: DirectoryFilterOption[];
  linkTypes: DirectoryFilterOption[];
  buildings: DirectoryFilterOption[];
  total: number;
};

export type DirectoryQuery = {
  search: string;
  area: string;
  linkTypeId: string;
  building: string;
  page: number;
  pageSize: number;
};

export type DirectoryResult = {
  people: DirectoryPersonSummary[];
  filteredTotal: number;
};
