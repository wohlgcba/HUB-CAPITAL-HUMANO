import type { HubSection } from "../types/hub";
import { ProjectCard } from "./ProjectCard";

type ProjectsRowProps = {
  sections: HubSection[];
  loading: boolean;
  totalCount: number;
  onOpenSection: (slug: string) => void;
};

export function ProjectsRow({ sections, loading, totalCount, onOpenSection }: ProjectsRowProps) {
  if (loading) {
    return (
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Cargando secciones">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[264px] animate-pulse rounded-[12px] border border-[#E3E8EC] bg-white p-[10px]">
            <div className="h-[112px] rounded-[8px] bg-[#E8EEF2]" />
            <div className="mt-4 h-5 w-2/3 rounded bg-[#E8EEF2]" />
            <div className="mt-3 h-12 rounded bg-[#F0F3F5]" />
          </div>
        ))}
      </section>
    );
  }

  if (sections.length === 0) {
    return (
      <section className="rounded-[12px] border border-dashed border-[#C9D5DE] bg-white px-5 py-10 text-center text-[15px] font-bold text-[#5F6B76]">
        {totalCount === 0 ? "No hay secciones publicadas." : "No hay secciones que coincidan con la búsqueda."}
      </section>
    );
  }

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {sections.map((section, index) => (
        <ProjectCard
          key={section.id}
          id={index + 1}
          title={section.title}
          badge={section.category}
          badgeColor={getCategoryColor(section.category)}
          description={section.description}
          materials={section.resourceCount}
          imageUrl={section.coverImageUrl ?? section.bannerUrl}
          onOpen={() => onOpenSection(section.slug)}
        />
      ))}
    </section>
  );
}

function getCategoryColor(category: string) {
  const normalized = category.toLocaleLowerCase("es-AR");
  if (normalized.includes("encuentro")) return "#007D95";
  if (normalized.includes("recurso")) return "#2CA6B6";
  if (normalized.includes("novedad")) return "#FFCC00";
  return "#1B89B4";
}
