import type { ResourceFileKind } from "./resources";

export type MetricsPeriodPreset = "7d" | "30d" | "90d" | "year" | "custom";
export type MetricTone = "blue" | "green" | "yellow" | "violet";
export type MetricsRange = { start: Date; end: Date };

export type MetricKpi = {
  id: string;
  title: string;
  value: number;
  detail: string;
  changePercent: number | null;
  tone: MetricTone;
  icon: "users" | "visits" | "resources" | "downloads";
};

export type ActivityPoint = { day: string; activeUsers: number; visits: number };
export type TopSectionMetric = { id: string; slug: string; name: string; visits: number; percentage: number; color: string };
export type TopResourceMetric = { id: string; sectionId: string; name: string; section: string; opens: number; downloads: number; rate: number; kind: ResourceFileKind; tone: "blue" | "yellow" | "cyan" };
export type UserStatusMetric = { value: number; label: string; tone: MetricTone; icon: "registered" | "active" | "pending" | "inactive" };
export type LowActivityUser = { name: string; area: string; lastAccess: string };
export type AreaParticipationMetric = { area: string; users: number; active: number; percentage: number };
export type DirectoryStatusMetric = { value: number; label: string; icon: "users" | "phone" | "mail" | "building" | "photo"; tone: "blue" | "cyan" | "green" | "violet" };
export type DirectoryCompletionMetric = { percentage: number; complete: number; total: number };
export type RecentActivityMetric = { id: string; text: string; time: string; icon: "open" | "login" | "download" | "publish"; tone: "blue" | "cyan" | "yellow" | "violet" };
export type MetricsSectionOption = { id: string; title: string };

export type AdminMetricsSnapshot = {
  periodLabel: string;
  kpis: MetricKpi[];
  activity: ActivityPoint[];
  topSections: TopSectionMetric[];
  topResources: TopResourceMetric[];
  userStatus: UserStatusMetric[];
  lowActivityUsers: LowActivityUser[];
  areaParticipation: AreaParticipationMetric[];
  directoryStatus: DirectoryStatusMetric[];
  directoryCompletion: DirectoryCompletionMetric;
  recentActivity: RecentActivityMetric[];
  sectionOptions: MetricsSectionOption[];
};
