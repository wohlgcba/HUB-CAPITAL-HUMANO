export type NotificationCategory = "resource" | "section" | "directory" | "system";

export type HubNotification = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  targetPath: string | null;
  relatedType: string | null;
  relatedId: string | null;
  publishedAt: string;
  isRead: boolean;
  readAt: string | null;
};

export type NotificationFilter = "all" | "unread";
