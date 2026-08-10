import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getNotifications, markNotificationRead, markNotificationsRead } from "../services/notificationService";
import { getErrorMessage } from "../services/serviceError";
import type { HubNotification } from "../types/notifications";

type NotificationContextValue = {
  notifications: HubNotification[];
  unreadCount: number;
  isLoading: boolean;
  isUpdating: boolean;
  error: string;
  refresh: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ profileId, children }: { profileId: string; children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<HubNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setError("");
    try {
      setNotifications(await getNotifications());
    } catch (refreshError) {
      setError(getErrorMessage(refreshError, "No se pudieron cargar las novedades."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel(`hub-notifications-${profileId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => void refresh())
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      void supabase.removeChannel(channel);
    };
  }, [profileId, refresh]);

  const markRead = useCallback(async (notificationId: string) => {
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification || notification.isRead) return;

    setIsUpdating(true);
    setError("");
    try {
      await markNotificationRead(notificationId, profileId);
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, isRead: true, readAt } : item));
    } catch (markError) {
      setError(getErrorMessage(markError, "No se pudo actualizar la novedad."));
      throw markError;
    } finally {
      setIsUpdating(false);
    }
  }, [notifications, profileId]);

  const markAllRead = useCallback(async () => {
    const unreadIds = notifications.filter((item) => !item.isRead).map((item) => item.id);
    if (unreadIds.length === 0) return;

    setIsUpdating(true);
    setError("");
    try {
      await markNotificationsRead(unreadIds, profileId);
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt: item.readAt ?? readAt })));
    } catch (markError) {
      setError(getErrorMessage(markError, "No se pudieron actualizar las novedades."));
      throw markError;
    } finally {
      setIsUpdating(false);
    }
  }, [notifications, profileId]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount: notifications.filter((item) => !item.isRead).length,
    isLoading,
    isUpdating,
    error,
    refresh,
    markRead,
    markAllRead,
  }), [error, isLoading, isUpdating, markAllRead, markRead, notifications, refresh]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotifications debe utilizarse dentro de NotificationProvider.");
  return context;
}
