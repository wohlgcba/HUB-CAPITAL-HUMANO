import { formatRelativeDate } from "../lib/formatters";
import type { HubNotification, NotificationCategory } from "../types/notifications";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

const categoryConfig: Record<NotificationCategory, { label: string; icon: AppIconName; background: string }> = {
  resource: { label: "Recursos", icon: "fileDescription", background: "bg-[#DDF8F5]" },
  section: { label: "Secciones", icon: "grid", background: "bg-[#FFF3BF]" },
  directory: { label: "Directorio", icon: "usersGroup", background: "bg-[#EAF4FF]" },
  system: { label: "Sistema", icon: "bell", background: "bg-[#EEF1F4]" },
};

type NotificationItemProps = {
  notification: HubNotification;
  disabled: boolean;
  isOpening: boolean;
  onMarkRead: (notificationId: string) => void;
  onOpen: (notification: HubNotification) => void;
};

export function NotificationItem({ notification, disabled, isOpening, onMarkRead, onOpen }: NotificationItemProps) {
  const category = categoryConfig[notification.category];

  return (
    <article className={`grid grid-cols-[48px_minmax(0,1fr)] gap-3 border-b border-[#E3E8EC] px-4 py-4 last:border-b-0 sm:grid-cols-[52px_minmax(0,1fr)_auto] sm:items-center sm:px-6 ${notification.isRead ? "bg-white" : "bg-[#F8FCFE]"}`}>
      <span className={`flex h-12 w-12 items-center justify-center rounded-full text-[#153244] ${category.background}`}>
        <AppIcon name={category.icon} size={22} />
      </span>

      <button
        type="button"
        onClick={() => onMarkRead(notification.id)}
        disabled={disabled || notification.isRead}
        className="min-w-0 rounded-[5px] text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0072BC] disabled:cursor-default"
        aria-label={notification.isRead ? `${notification.title}, leída` : `Marcar como leída: ${notification.title}`}
      >
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-extrabold uppercase text-[#5F6B76]">{category.label}</span>
          <span className="text-[11px] font-semibold text-[#7A8792]">{formatRelativeDate(notification.publishedAt)}</span>
        </span>
        <span className="mt-1 block text-[15px] font-extrabold leading-snug text-[#153244]">{notification.title}</span>
        <span className="mt-1 block text-[13px] font-semibold leading-relaxed text-[#5F6B76]">{notification.body}</span>
      </button>

      <div className="col-span-2 flex items-center justify-end gap-3 pl-[60px] sm:col-span-1 sm:pl-0">
        {!notification.isRead ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0072BC]" aria-label="Sin leer" /> : null}
        <button
          type="button"
          onClick={() => onOpen(notification)}
          disabled={disabled || !notification.targetPath}
          className="inline-flex min-h-11 min-w-[92px] items-center justify-center gap-2 rounded-[6px] border border-[#0072BC] bg-white px-4 text-[12px] font-extrabold text-[#0072BC] transition hover:bg-[#EAF4FF] disabled:cursor-not-allowed disabled:opacity-45"
          aria-label={notification.targetPath ? `Abrir: ${notification.title}` : `${notification.title}, sin destino disponible`}
        >
          {isOpening ? <AppIcon name="loader" size={17} className="animate-spin" /> : null}
          Abrir
          {!isOpening ? <AppIcon name="chevronRight" size={17} /> : null}
        </button>
      </div>
    </article>
  );
}
