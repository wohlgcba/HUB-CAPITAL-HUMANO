import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useNotifications } from "../context/NotificationContext";
import { logAuditEvent } from "../services/auditService";
import { getErrorMessage } from "../services/serviceError";
import type { HubNotification, NotificationFilter } from "../types/notifications";
import { AppIcon } from "./AppIcon";
import { NotificationItem } from "./NotificationItem";

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type NotificationsModalProps = {
  onClose: () => void;
};

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, isLoading, isUpdating, error, refresh, markRead, markAllRead } = useNotifications();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [openingId, setOpeningId] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const openingIdRef = useRef(openingId);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    openingIdRef.current = openingId;
  }, [openingId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    void logAuditEvent("notifications_view", "notifications");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !openingIdRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const visibleNotifications = useMemo(
    () => filter === "unread" ? notifications.filter((notification) => !notification.isRead) : notifications,
    [filter, notifications],
  );

  const handleTrapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (elements.length === 0) return;
    if (event.shiftKey && document.activeElement === elements[0]) {
      event.preventDefault();
      elements.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
      event.preventDefault();
      elements[0].focus();
    }
  };

  const handleMarkRead = async (notificationId: string) => {
    try {
      await markRead(notificationId);
    } catch (markError) {
      toast.error("No se pudo marcar la novedad", { description: getErrorMessage(markError, "Intentá nuevamente.") });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      toast.success("Novedades actualizadas", { description: "Todas las novedades quedaron marcadas como leídas." });
    } catch (markError) {
      toast.error("No se pudieron actualizar las novedades", { description: getErrorMessage(markError, "Intentá nuevamente.") });
    }
  };

  const handleOpen = async (notification: HubNotification) => {
    if (!notification.targetPath || openingId) return;
    setOpeningId(notification.id);
    try {
      await markRead(notification.id);
      onClose();
      navigate(notification.targetPath);
    } catch (openError) {
      toast.error("No se pudo abrir la novedad", { description: getErrorMessage(openError, "Intentá nuevamente.") });
      setOpeningId("");
    }
  };

  const closeIfAvailable = () => {
    if (!openingId) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#061947]/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeIfAvailable(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-modal-title"
        aria-describedby="notifications-modal-description"
        aria-busy={isLoading || isUpdating || Boolean(openingId)}
        onKeyDown={handleTrapFocus}
        className="flex h-[calc(100dvh-24px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[12px] border border-[#D8E0E6] bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.32)] sm:h-[80dvh] sm:max-h-[820px] sm:rounded-[14px]"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#D8E0E6] px-5 py-5 sm:px-7 sm:py-6">
          <div>
            <h2 id="notifications-modal-title" className="text-[24px] font-extrabold leading-tight text-[#061947]">Novedades</h2>
            <p id="notifications-modal-description" className="mt-2 text-[13px] font-semibold leading-relaxed text-[#5F6B76]">Mantenete al día con las últimas actualizaciones del HUB.</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={closeIfAvailable} disabled={Boolean(openingId)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C7D1DA] hover:bg-[#F5F7F8] disabled:opacity-50" aria-label="Cerrar Novedades"><AppIcon name="x" size={23} /></button>
        </header>

        <div className="flex shrink-0 flex-col gap-3 border-b border-[#D8E0E6] px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-center gap-1" role="tablist" aria-label="Filtrar novedades">
            <FilterTab active={filter === "all"} onClick={() => setFilter("all")} label={`Todas (${notifications.length})`} />
            <FilterTab active={filter === "unread"} onClick={() => setFilter("unread")} label={`Sin leer (${unreadCount})`} />
          </div>
          <button type="button" onClick={() => void handleMarkAllRead()} disabled={isUpdating || unreadCount === 0} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-[6px] px-2 text-[12px] font-extrabold text-[#005CB9] hover:bg-[#EAF4FF] disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto">
            {isUpdating ? <AppIcon name="loader" size={17} className="animate-spin" /> : <AppIcon name="check" size={17} />}
            Marcar todas como leídas
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {error ? (
            <div role="alert" className="m-5 flex flex-col gap-3 rounded-[9px] border border-[#F0C6C6] bg-[#FFF4F4] p-4 text-[13px] font-bold text-[#9E2929] sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => void refresh()} className="min-h-11 rounded-[6px] border border-[#9E2929] px-4">Reintentar</button>
            </div>
          ) : isLoading ? <NotificationsSkeleton /> : visibleNotifications.length > 0 ? (
            <section aria-label="Listado de novedades">
              {visibleNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  disabled={isUpdating || Boolean(openingId)}
                  isOpening={openingId === notification.id}
                  onMarkRead={(notificationId) => void handleMarkRead(notificationId)}
                  onOpen={(item) => void handleOpen(item)}
                />
              ))}
            </section>
          ) : (
            <section className="flex min-h-[300px] flex-col items-center justify-center px-6 py-10 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF8F5] text-[#153244]"><AppIcon name="bell" size={30} /></span>
              <h3 className="mt-4 text-[18px] font-extrabold text-[#153244]">{filter === "unread" && notifications.length > 0 ? "No tenés novedades sin leer." : "No tenés novedades por el momento."}</h3>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-[#D8E0E6] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <button type="button" onClick={() => toast.info("Próximamente", { description: "La configuración de notificaciones estará disponible en una próxima etapa." })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] px-2 text-[12px] font-extrabold text-[#5F6B76] hover:bg-[#F5F7F8] sm:justify-start">
            <AppIcon name="settings" size={19} /> Configuración de notificaciones
          </button>
          <button type="button" onClick={closeIfAvailable} disabled={Boolean(openingId)} className="min-h-11 rounded-[7px] bg-[#005CB9] px-7 text-[13px] font-extrabold text-white hover:bg-[#004B98] disabled:opacity-50">Cerrar</button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function FilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`min-h-11 border-b-2 px-4 text-[12px] font-extrabold transition ${active ? "border-[#0072BC] text-[#005CB9]" : "border-transparent text-[#5F6B76] hover:bg-[#F5F7F8]"}`}>{label}</button>;
}

function NotificationsSkeleton() {
  return <div className="space-y-px" aria-label="Cargando novedades">{Array.from({ length: 4 }, (_, index) => <div key={index} className="mx-4 h-[112px] animate-pulse border-b border-[#E3E8EC] bg-[#E8EEF2] last:border-b-0 sm:mx-6" />)}</div>;
}
