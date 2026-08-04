import { useEffect, useRef } from "react";
import { AppIcon } from "./AppIcon";
import { LinkTypeBadge } from "./LinkTypeBadge";
import type { DirectoryPerson } from "./PersonCard";

type PersonDetailModalProps = {
  person: DirectoryPerson;
  onClose: () => void;
};

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function PersonDetailModal({ person, onClose }: PersonDetailModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleTrapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;

    const focusableElements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061947]/55 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="person-detail-title"
        onKeyDown={handleTrapFocus}
        className="max-h-[calc(100dvh-48px)] w-full max-w-[640px] overflow-y-auto rounded-[14px] border border-[#E3E8EC] bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.28)]"
      >
        <div className="flex items-center justify-between border-b border-[#E3E8EC] px-5 py-4 sm:px-6">
          <h2 id="person-detail-title" className="text-[20px] font-extrabold text-[#061947]">
            Detalle del integrante
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[#153244] transition hover:bg-[#F5F7F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
            aria-label="Cerrar detalle"
          >
            <AppIcon name="x" size={22} />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className={`flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-full text-[24px] font-extrabold text-[#153244] ${person.avatar}`}>
              {person.initials}
            </span>
            <div className="min-w-0">
              <h3 className="text-[24px] font-extrabold leading-tight text-[#061947]">{person.name}</h3>
              <p className="mt-2 text-[12px] font-extrabold uppercase leading-tight text-[#153244]">{person.area}</p>
              <p className="mt-1 text-[13px] font-semibold text-[#5F6B76]">{person.role}</p>
            </div>
          </div>

          <DetailSection title="Tipo de enlace">
            <div className="flex flex-wrap gap-2">
              {person.linkTypes.map((type) => (
                <LinkTypeBadge key={type} type={type} />
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Información de contacto">
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem icon="phone" label="Celular" value={person.phone} />
              <InfoItem icon="mail" label="Mail" value={person.email} />
            </div>
          </DetailSection>

          <DetailSection title="Ubicación">
            <InfoItem icon="building" label="Edificio GCBA" value={person.building} />
          </DetailSection>

          <div className="mt-5 flex gap-3 rounded-[10px] border border-[#BFEFED] bg-[#DDF8F5] px-4 py-3 text-[13px] font-bold leading-[1.4] text-[#153244]">
            <AppIcon name="clipboard" size={18} className="mt-0.5 shrink-0" />
            Información de uso interno. No compartas credenciales ni datos sensibles.
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#E3E8EC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-5 text-[13px] font-extrabold text-[#153244] transition hover:bg-[#F5F7F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
          >
            Cerrar
          </button>
          <a
            href={`mailto:${person.email}`}
            className="flex min-h-11 items-center justify-center rounded-[7px] bg-[#153244] px-5 text-[13px] font-extrabold text-white transition hover:bg-[#062A43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
          >
            Enviar correo
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h4 className="mb-3 text-[13px] font-extrabold uppercase tracking-[0.03em] text-[#153244]">{title}</h4>
      {children}
    </section>
  );
}

function InfoItem({ icon, label, value }: { icon: "phone" | "mail" | "building"; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[20px_1fr] gap-3 rounded-[9px] border border-[#E3E8EC] bg-[#FCFCFC] px-4 py-3">
      <AppIcon name={icon} size={18} className="mt-0.5 text-[#005CB9]" />
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-[#5F6B76]">{label}</p>
        <p className="mt-1 break-words text-[13px] font-extrabold leading-tight text-[#153244]">{value}</p>
      </div>
    </div>
  );
}
