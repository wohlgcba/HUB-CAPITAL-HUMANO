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
  bannerUrl: string | null;
  coverImageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  resourceCount: number;
};
