import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { IconLoader2, IconX } from "@tabler/icons-react";

type MetricsDetailModalProps = {
  title: string;
  subtitle: string;
  filters?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  loading?: boolean;
  error?: string;
  onClose: () => void;
};

export function MetricsDetailModal({ title, subtitle, filters, children, footer, loading = false, error = "", onClose }: MetricsDetailModalProps) {
  const titleId = useId();
  const subtitleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handleKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, []);

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#061947]/65 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={subtitleId} aria-busy={loading} onKeyDown={trapFocus} className="flex h-[calc(100dvh-24px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[12px] border border-[#D8E0E6] bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.35)] sm:h-auto sm:max-h-[80dvh]">
        <header className="flex items-start justify-between gap-4 border-b border-[#E1E7EC] px-5 py-4 sm:px-6">
          <div className="min-w-0"><h2 id={titleId} className="text-[22px] font-extrabold text-[#061947] sm:text-[25px]">{title}</h2><p id={subtitleId} className="mt-1 text-[12px] font-semibold text-[#657787]">{subtitle}</p></div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={`Cerrar ${title}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9D3DB] text-[#153244] hover:bg-[#F2F5F7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"><IconX size={22} /></button>
        </header>
        {filters ? <div className="border-b border-[#E1E7EC] bg-[#F8FAFB] px-5 py-3 sm:px-6">{filters}</div> : null}
        <div className="relative min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 sm:px-6 sm:py-5">
          {error ? <div role="alert" className="rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-4 text-[13px] font-bold text-[#B52F2F]">{error}</div> : children}
          {loading ? <div className="absolute inset-0 flex items-center justify-center bg-white/80" aria-label="Actualizando análisis"><IconLoader2 className="animate-spin text-[#0072BC]" size={32} /></div> : null}
        </div>
        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E1E7EC] px-5 py-4 sm:px-6">
          {footer}
          <button type="button" onClick={onClose} className="min-h-11 w-full rounded-[7px] bg-[#0072BC] px-6 text-[13px] font-extrabold text-white hover:bg-[#005F9D] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC] sm:w-auto">Cerrar</button>
        </footer>
      </div>
    </div>
  );
}
