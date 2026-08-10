export type HubStats = {
  members: number;
  resources: number;
  sections: number;
};

export type HubSection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  bannerPath: string | null;
  coverImagePath: string | null;
  bannerUrl: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  resourceCount: number;
};

export type SectionInput = {
  title: string;
  slug: string;
  category: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  bannerFile: File | null;
};
