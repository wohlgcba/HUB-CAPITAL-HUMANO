import { AppIcon } from "./AppIcon";
import { ResourceCard } from "./ResourceCard";
import type { RecentResource } from "../types/resources";

type RecentResourcesProps = {
  embedded?: boolean;
  resources: RecentResource[];
  loading: boolean;
  onOpen: (resourceId: string) => void;
};

export function RecentResources({ embedded = false, resources, loading, onOpen }: RecentResourcesProps) {
  const wrapperClass = embedded
    ? "border-t border-[#E3E8EC] pt-5"
    : "rounded-[14px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]";

  return (
    <section className={wrapperClass}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-[17px] font-extrabold text-[#153244]">
          <AppIcon name="files" size={24} />
          Recursos recientes
        </h2>
        <span className="flex items-center gap-3 text-[12px] font-bold text-[#153244]">
          Ver todos los recursos
          <AppIcon name="chevronRight" size={17} />
        </span>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Cargando recursos recientes">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-[115px] animate-pulse rounded-[8px] bg-[#EEF2F4]" />
          ))}
        </div>
      ) : resources.length > 0 ? (
        <div className="flex min-w-0 snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onOpen={() => onOpen(resource.id)} />
          ))}
        </div>
      ) : (
        <p className="rounded-[8px] border border-dashed border-[#C9D5DE] px-4 py-8 text-center text-[14px] font-bold text-[#5F6B76]">
          No hay recursos recientes.
        </p>
      )}
    </section>
  );
}
