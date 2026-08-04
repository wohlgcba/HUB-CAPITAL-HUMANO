import { hubSections } from "../data/hubSections";
import { ProjectCard } from "./ProjectCard";

type ProjectsRowProps = {
  onOpenSection: (slug: string) => void;
};

export function ProjectsRow({ onOpenSection }: ProjectsRowProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {hubSections.map((section) => (
        <ProjectCard
          key={section.id}
          id={section.card.id}
          title={section.title}
          badge={section.card.badge}
          badgeColor={section.card.badgeColor}
          description={section.description}
          materials={section.card.materials}
          buttonLabel={section.card.buttonLabel}
          imageUrl={section.card.imageUrl}
          imageAlt={section.card.imageAlt}
          onOpen={() => onOpenSection(section.slug)}
        />
      ))}
    </section>
  );
}
