export type ResourceFileKind = "pdf" | "word" | "powerpoint" | "spreadsheet" | "image" | "other";

export type ResourceFile = {
  id: string;
  resourceId: string;
  storageBucket: string;
  storagePath: string;
  fileName: string;
  fileKind: ResourceFileKind;
  mimeType: string | null;
  fileSizeBytes: number | null;
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
  coverImageUrl: string | null;
  thumbnailStrategy: string;
  sortOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  publishedAt: string;
  updatedAt: string;
  files: ResourceFile[];
};

export type RecentResource = SectionResource & {
  sectionTitle: string | null;
};
