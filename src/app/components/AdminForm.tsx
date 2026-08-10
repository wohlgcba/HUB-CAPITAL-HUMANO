import { useEffect, useId, useRef } from "react";
import { AppIcon } from "./AppIcon";

type AdminFormProps = {
  open: boolean;
  title: string;
  description?: string;
  submitLabel: string;
  loading?: boolean;
  wide?: boolean;
  children: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function AdminForm({
  open,
  title,
  description,
  submitLabel,
  loading = false,
  wide = false,
  children,
  onSubmit,
  onCancel,
}: AdminFormProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#061947]/60 px-3 py-4 sm:px-5 sm:py-6">
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[calc(100dvh-32px)] w-full flex-col overflow-hidden rounded-[14px] border border-[#E3E8EC] bg-white shadow-[0_28px_90px_rgba(6,42,67,0.30)] sm:max-h-[calc(100dvh-48px)] ${wide ? "max-w-[880px]" : "max-w-[680px]"}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E3E8EC] px-5 py-4 sm:px-6">
          <div>
            <h2 id={titleId} className="text-[22px] font-extrabold leading-tight text-[#061947]">{title}</h2>
            {description ? <p className="mt-1.5 text-[13px] font-semibold text-[#5F6B76]">{description}</p> : null}
          </div>
          <button ref={closeRef} type="button" onClick={onCancel} disabled={loading} aria-label="Cerrar formulario" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#153244] hover:bg-[#F3F6F8] disabled:opacity-50">
            <AppIcon name="x" size={22} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        <div className="flex flex-col-reverse gap-3 border-t border-[#E3E8EC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-[7px] border border-[#C7D1DA] bg-white px-5 text-[13px] font-extrabold text-[#153244] disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white disabled:cursor-wait disabled:opacity-55">
            <AppIcon name={loading ? "loader" : "deviceFloppy"} size={18} className={loading ? "animate-spin" : ""} />
            {loading ? "Guardando..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
