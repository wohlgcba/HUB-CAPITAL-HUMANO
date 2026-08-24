export type ResourceFileKind = "pdf" | "word" | "powerpoint" | "spreadsheet" | "image" | "other";

export const resourceReactionEmojis = ["💖", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔", "👎"] as const;

export type ResourceReaction = (typeof resourceReactionEmojis)[number];

export type ResourceReactionSummary = {
  counts: Partial<Record<ResourceReaction, number>>;
  userReaction: ResourceReaction | null;
};

export type ResourceReactionMap = Record<string, ResourceReactionSummary>;

export type ResourceFile = {
  id: string;
  resourceId: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  fileKind: ResourceFileKind;
  mimeType: string | null;
  fileSizeBytes: number | null;
  thumbnailPath: string | null;
  thumbnailUrl: string | null;
  sortOrder: number;
  allowDownload: boolean;
  viewUrl: string | null;
};

export type SectionResource = {
  id: string;
  sectionId: string;
  title: string;
  description: string | null;
  coverImagePath: string | null;
  coverImageUrl: string | null;
  thumbnailStrategy: string;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
  files: ResourceFile[];
};

export type RecentResource = SectionResource & {
  sectionTitle: string | null;
};

export type ResourceSearchItem = {
  id: string;
  title: string;
  description: string | null;
  sectionId: string;
  sectionTitle: string;
  fileKind: ResourceFileKind | null;
  fileName: string | null;
  publishedAt: string;
};

export type ResourceInput = {
  sectionId: string;
  title: string;
  description: string | null;
  file: File | null;
  fileKind: ResourceFileKind;
  isFeatured: boolean;
  allowDownload: boolean;
  publishedAt: string;
  isActive: boolean;
};
