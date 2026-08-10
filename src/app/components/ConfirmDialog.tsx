import { useEffect, useId, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  details?: React.ReactNode;
  confirmLabel: string;
  loading?: boolean;
  variant?: "danger" | "primary";
  requireAcknowledgement?: boolean;
  acknowledgementLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  details,
  confirmLabel,
  loading = false,
  variant = "danger",
  requireAcknowledgement = false,
  acknowledgementLabel = "Comprendo el alcance de esta acción.",
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAcknowledged(false);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => cancelRef.current?.focus(), 0);
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
  const confirmDisabled = loading || (requireAcknowledgement && !acknowledged);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-[#061947]/60 px-4 py-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-[520px] overflow-hidden rounded-[14px] border border-[#E3E8EC] bg-white shadow-[0_28px_90px_rgba(6,42,67,0.30)]"
      >
        <div className="flex items-start gap-4 px-5 py-5 sm:px-6">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${variant === "danger" ? "bg-[#FFF0F0] text-[#C83232]" : "bg-[#EAF4FB] text-[#0072BC]"}`}>
            <AppIcon name={variant === "danger" ? "alert" : "deviceFloppy"} size={25} />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-[20px] font-extrabold leading-tight text-[#061947]">{title}</h2>
            <p id={descriptionId} className="mt-2 text-[14px] font-semibold leading-[1.5] text-[#5F6B76]">{description}</p>
          </div>
        </div>
        {details ? <div className="mx-5 rounded-[9px] border border-[#E3E8EC] bg-[#F7F9FA] px-4 py-3 text-[13px] font-bold text-[#153244] sm:mx-6">{details}</div> : null}
        {requireAcknowledgement ? (
          <label className="mx-5 mt-4 flex cursor-pointer items-start gap-3 rounded-[9px] border border-[#F2C3C3] bg-[#FFF8F8] px-4 py-3 text-[13px] font-bold text-[#4B5964] sm:mx-6">
            <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#C83232]" />
            <span>{acknowledgementLabel}</span>
          </label>
        ) : null}
        <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#E3E8EC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={loading} className="min-h-11 rounded-[7px] border border-[#C7D1DA] bg-white px-5 text-[13px] font-extrabold text-[#153244] disabled:opacity-55">Cancelar</button>
          <button type="button" onClick={onConfirm} disabled={confirmDisabled} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] px-5 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50 ${variant === "danger" ? "bg-[#C83232]" : "bg-[#0072BC]"}`}>
            {loading ? <AppIcon name="loader" size={18} className="animate-spin" /> : <AppIcon name={variant === "danger" ? "trash" : "deviceFloppy"} size={18} />}
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
