import { supabase } from "../lib/supabaseClient";
import type { HubNotification, NotificationCategory } from "../types/notifications";
import { toServiceError } from "./serviceError";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  target_path: string | null;
  related_type: string | null;
  related_id: string | null;
  published_at: string;
  notification_reads: Array<{ read_at: string }> | null;
};

export async function getNotifications(limit = 100): Promise<HubNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,category,target_path,related_type,related_id,published_at,notification_reads(read_at)")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw toServiceError(error, "No se pudieron cargar las novedades.");
  return ((data ?? []) as NotificationRow[]).map(toNotification);
}

export async function markNotificationRead(notificationId: string, profileId: string) {
  const { error } = await supabase.from("notification_reads").upsert(
    { notification_id: notificationId, profile_id: profileId, read_at: new Date().toISOString() },
    { onConflict: "notification_id,profile_id" },
  );

  if (error) throw toServiceError(error, "No se pudo actualizar la novedad.");
}

export async function markNotificationsRead(notificationIds: string[], profileId: string) {
  if (notificationIds.length === 0) return;
  const readAt = new Date().toISOString();
  const { error } = await supabase.from("notification_reads").upsert(
    notificationIds.map((notificationId) => ({ notification_id: notificationId, profile_id: profileId, read_at: readAt })),
    { onConflict: "notification_id,profile_id" },
  );

  if (error) throw toServiceError(error, "No se pudieron marcar las novedades como leidas.");
}

function toNotification(row: NotificationRow): HubNotification {
  const readAt = row.notification_reads?.[0]?.read_at ?? null;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    category: row.category,
    targetPath: row.target_path,
    relatedType: row.related_type,
    relatedId: row.related_id,
    publishedAt: row.published_at,
    isRead: Boolean(readAt),
    readAt,
  };
}
