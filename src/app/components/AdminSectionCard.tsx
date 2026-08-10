import { formatDate } from "../lib/formatters";
import type { HubSection } from "../types/hub";
import { AppIcon } from "./AppIcon";

type AdminSectionCardProps = {
  section: HubSection;
  onView: () => void;
  onAddContent: () => void;
  onDelete: () => void;
};

export function AdminSectionCard({ section, onView, onAddContent, onDelete }: AdminSectionCardProps) {
  return (
    <article className="flex min-h-[350px] flex-col overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white p-[10px] shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
      <div className="relative h-[126px] overflow-hidden rounded-[8px] bg-[#DDE6EC]">
        {section.coverImageUrl || section.bannerUrl ? (
          <img src={section.coverImageUrl || section.bannerUrl || ""} alt={`Portada de ${section.title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-5 text-center text-[17px] font-extrabold uppercase text-[#153244]">{section.title}</div>
        )}
        <span className={`absolute left-2 top-2 rounded-[5px] px-2 py-1 text-[11px] font-extrabold ${section.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>
          {section.isActive ? "Publicada" : "Borrador"}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <p className="text-[11px] font-extrabold uppercase text-[#007D95]">{section.category}</p>
        <h3 className="mt-1 text-[18px] font-extrabold leading-tight text-[#153244]">{section.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-[13px] font-semibold leading-[1.35] text-[#5F6B76]">{section.description}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8EDF0] pt-3 text-[11px] font-bold text-[#5F6B76]">
          <span className="inline-flex items-center gap-1.5"><AppIcon name="fileText" size={15} />{section.resourceCount} recursos</span>
          <span>Actualizada {formatDate(section.updatedAt)}</span>
        </div>
        <div className="mt-3 grid grid-cols-[1fr_1fr_44px] gap-2">
          <button type="button" onClick={onView} className="min-h-11 rounded-[6px] border border-[#0072BC] px-2 text-[12px] font-extrabold text-[#0072BC] hover:bg-[#EAF4FB]">Ver sección</button>
          <button type="button" onClick={onAddContent} className="min-h-11 rounded-[6px] bg-[#0072BC] px-2 text-[12px] font-extrabold text-white hover:bg-[#005F9D]">Añadir contenido</button>
          <button type="button" onClick={onDelete} aria-label={`Eliminar ${section.title}`} title="Eliminar" className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#E3B0B0] text-[#B52F2F] hover:bg-[#FFF0F0]"><AppIcon name="trash" size={18} /></button>
        </div>
      </div>
    </article>
  );
}
