export const helpFaqIconNames = [
  "help",
  "lock",
  "fileDescription",
  "download",
  "usersGroup",
  "search",
  "bell",
  "upload",
  "clipboard",
  "bulb",
  "mail",
  "calendar",
  "settings",
] as const;

export type HelpFaqIconName = (typeof helpFaqIconNames)[number];

export type HelpFaq = {
  id: string;
  title: string;
  content: string;
  category: string;
  iconName: HelpFaqIconName;
  sortOrder: number;
  isActive: boolean;
  adminOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HelpFaqInput = {
  title: string;
  content: string;
  category: string;
  iconName: HelpFaqIconName;
  sortOrder: number;
  isActive: boolean;
  adminOnly: boolean;
};

export function isHelpFaqIconName(value: string): value is HelpFaqIconName {
  return (helpFaqIconNames as readonly string[]).includes(value);
}
