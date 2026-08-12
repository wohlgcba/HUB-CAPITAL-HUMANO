import { AppIcon } from "./AppIcon";

type ProjectCardProps = {
  id: number;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  materials: number;
  imageUrl: string | null;
  onOpen: () => void;
};

export function ProjectCard({
  id,
  title,
  badge,
  badgeColor = "#153244",
  description,
  materials,
  imageUrl,
  onOpen,
}: ProjectCardProps) {
  const darkBadge = badgeColor === "#FFCC00";

  return (
    <article className="h-full">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir sección ${title}`}
        className="group flex min-h-[264px] w-full flex-col overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white p-[10px] text-left shadow-[0_2px_10px_rgba(21,50,68,0.06)] transition hover:-translate-y-0.5 hover:border-[#9FC7DD] hover:shadow-[0_8px_22px_rgba(21,50,68,0.1)] focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC] motion-reduce:transform-none motion-reduce:transition-none"
      >
        <span className="relative block h-[112px] w-full overflow-hidden rounded-[8px] bg-[#DDE6EC]">
          {imageUrl ? (
            <img src={imageUrl} alt={`Portada de ${title}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" />
          ) : (
            <span className="flex h-full items-center justify-center px-5 text-center text-[17px] font-extrabold uppercase text-[#153244]">
              {title}
            </span>
          )}
          {badge ? (
            <span
              className={[
                "absolute bottom-0 left-0 rounded-tr-[6px] px-2 py-1 text-[12px] font-extrabold leading-none",
                darkBadge ? "text-[#153244]" : "text-white",
              ].join(" ")}
              style={{ backgroundColor: badgeColor }}
            >
              {badge}
            </span>
          ) : null}
        </span>
        <span className="flex flex-1 flex-col px-1 pt-3">
          <span className="text-[17px] font-extrabold leading-tight text-[#153244]">
            {id}. {title}
          </span>
          <span className="mt-2 flex-1 text-[13px] font-semibold leading-[1.25] text-[#5F6B76]">{description}</span>
          <span className="mt-auto flex min-w-0 items-center gap-2 pt-4 text-[11px] font-semibold text-[#5F6B76]">
            <AppIcon name="fileText" size={15} />
            {materials} {materials === 1 ? "material" : "materiales"}
          </span>
        </span>
      </button>
    </article>
  );
}
