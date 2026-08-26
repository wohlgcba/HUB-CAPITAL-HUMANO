import { useEffect, useMemo, useRef, useState } from "react";
import type { DirectoryFilterOptions } from "../types/directory";
import type { DirectoryChangeRequest, DirectoryChangeValues } from "../types/profile";
import { AppIcon } from "./AppIcon";

type Props = {
  request: DirectoryChangeRequest | null;
  options: DirectoryFilterOptions;
  loading: boolean;
  onClose: () => void;
  onReview: (approved: boolean, note: string) => void;
};

const focusableSelector = 'button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function DirectoryChangeRequestDialog({ request, options, loading, onClose, onReview }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!request) return;
    setNote("");
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onClose, request]);

  const rows = useMemo(() => request ? getChangedRows(request.currentValues, request.requestedChanges, options) : [], [options, request]);
  if (!request) return null;

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (!elements.length) return;
    if (event.shiftKey && document.activeElement === elements[0]) {
      event.preventDefault();
      elements.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
      event.preventDefault();
      elements[0].focus();
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#061947]/60 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="change-request-title" onKeyDown={trapFocus} className="max-h-[calc(100dvh-24px)] w-full max-w-[720px] overflow-y-auto rounded-[14px] border border-[#D8E0E6] bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.3)]">
        <header className="flex items-start justify-between gap-4 border-b border-[#D8E0E6] px-5 py-5 sm:px-7">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#007D95]">Solicitud pendiente</p>
            <h2 id="change-request-title" className="mt-1 text-[23px] font-extrabold text-[#061947]">Revisar cambios de {request.personName}</h2>
            {request.personEmail ? <p className="mt-1 break-all text-[12px] font-semibold text-[#5F6B76]">{request.personEmail}</p> : null}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} disabled={loading} aria-label="Cerrar solicitud" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C7D1DA] hover:bg-[#F5F7F8] disabled:opacity-50"><AppIcon name="x" size={21} /></button>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-7">
          <p className="text-[13px] font-semibold leading-relaxed text-[#5F6B76]">Compará los datos actuales con los solicitados antes de tomar una decisión.</p>
          <div className="overflow-hidden rounded-[9px] border border-[#D8E0E6]">
            <div className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] bg-[#F5F7F8] px-4 py-2 text-[11px] font-extrabold uppercase text-[#5F6B76]"><span>Campo</span><span>Actual</span><span>Solicitado</span></div>
            {rows.map((row) => <div key={row.label} className="grid grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-t border-[#E3E8EC] px-4 py-3 text-[13px]"><strong>{row.label}</strong><span className="break-words text-[#5F6B76]">{row.current}</span><span className="break-words font-extrabold text-[#061947]">{row.requested}</span></div>)}
          </div>
          <label className="block text-[12px] font-extrabold">Nota para la persona <span className="font-semibold text-[#5F6B76]">(opcional)</span><textarea value={note} onChange={(event) => setNote(event.target.value)} disabled={loading} rows={3} maxLength={500} className="mt-2 w-full resize-y rounded-[8px] border border-[#C7D1DA] px-3 py-2 text-[13px] outline-none focus:border-[#0072BC] focus:ring-2 focus:ring-[#0072BC]/20" /></label>
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#D8E0E6] px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} disabled={loading} className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-5 text-[13px] font-extrabold disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={() => onReview(false, note)} disabled={loading} className="min-h-11 rounded-[7px] border border-[#D94B4B] px-5 text-[13px] font-extrabold text-[#B52F2F] hover:bg-[#FFF4F4] disabled:opacity-50">Rechazar</button>
          <button type="button" onClick={() => onReview(true, note)} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white hover:bg-[#005F9D] disabled:opacity-50">{loading ? <AppIcon name="loader" size={17} className="animate-spin" /> : <AppIcon name="check" size={17} />} Aprobar cambios</button>
        </footer>
      </div>
    </div>
  );
}

function getChangedRows(current: DirectoryChangeValues, requested: DirectoryChangeValues, options: DirectoryFilterOptions) {
  const linkNames = (ids?: string[]) => ids?.map((id) => options.linkTypes.find((item) => item.value === id)?.label ?? "Tipo no disponible").join(", ") || "Sin especificar";
  const rows: Array<{ label: string; current: string; requested: string }> = [];
  if (Object.hasOwn(requested, "cuit")) rows.push({ label: "CUIT", current: current.cuit || "Sin especificar", requested: requested.cuit || "Sin especificar" });
  if (Object.hasOwn(requested, "area")) rows.push({ label: "Área", current: current.area || "Sin especificar", requested: requested.area || "Sin especificar" });
  if (Object.hasOwn(requested, "building")) rows.push({ label: "Edificio", current: current.building || "Sin especificar", requested: requested.building || "Sin especificar" });
  if (requested.linkTypeIds) rows.push({ label: "Tipo de enlace", current: linkNames(current.linkTypeIds), requested: linkNames(requested.linkTypeIds) });
  return rows;
}
