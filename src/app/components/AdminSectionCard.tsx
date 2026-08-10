import { formatDate } from "../lib/formatters";
import type { HubSection } from "../types/hub";
import { AppIcon } from "./AppIcon";

type AdminSectionCardProps = {
  section: HubSection;
  onOpen: () => void;
};

export function AdminSectionCard({ section, onOpen }: AdminSectionCardProps) {
  return (
    <article className="h-full">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir sección ${section.title}`}
        className="group flex min-h-[306px] w-full flex-col overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white p-[10px] text-left shadow-[0_2px_10px_rgba(21,50,68,0.06)] transition hover:-translate-y-0.5 hover:border-[#9FC7DD] hover:shadow-[0_8px_22px_rgba(21,50,68,0.10)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span className="relative block h-[126px] w-full overflow-hidden rounded-[8px] bg-[#DDE6EC]">
          {section.coverImageUrl || section.bannerUrl ? (
            <img src={section.coverImageUrl || section.bannerUrl || ""} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" />
          ) : (
            <span className="flex h-full items-center justify-center px-5 text-center text-[17px] font-extrabold uppercase text-[#153244]">{section.title}</span>
          )}
          <span className={`absolute left-2 top-2 rounded-[5px] px-2 py-1 text-[11px] font-extrabold ${section.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>
            {section.isActive ? "Publicada" : "Borrador"}
          </span>
        </span>
        <span className="flex flex-1 flex-col px-1 pt-3">
          <span className="text-[11px] font-extrabold uppercase text-[#007D95]">{section.category}</span>
          <span className="mt-1 text-[18px] font-extrabold leading-tight text-[#153244]">{section.title}</span>
          <span className="mt-2 line-clamp-3 flex-1 text-[13px] font-semibold leading-[1.35] text-[#5F6B76]">{section.description}</span>
          <span className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 border-t border-[#E8EDF0] pt-3 text-[11px] font-bold text-[#5F6B76]">
            <span className="inline-flex items-center gap-1.5"><AppIcon name="fileText" size={15} />{section.resourceCount} recursos</span>
            <span>Actualizada {formatDate(section.updatedAt)}</span>
          </span>
        </span>
      </button>
    </article>
  );
}
