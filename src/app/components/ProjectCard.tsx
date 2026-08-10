import { AppIcon } from "./AppIcon";

type ProjectCardProps = {
  id: number;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  materials: number;
  imageUrl: string | null;
  onOpen?: () => void;
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
    <article className="flex min-h-[264px] flex-col overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white p-[10px] shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
      <div className="relative h-[112px] overflow-hidden rounded-[8px] bg-[#DDE6EC]">
        {imageUrl ? (
          <img src={imageUrl} alt={`Portada de ${title}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center px-5 text-center text-[17px] font-extrabold uppercase text-[#153244]">
            {title}
          </div>
        )}
        {badge && (
          <span
            className={[
              "absolute bottom-0 left-0 rounded-tr-[6px] px-2 py-1 text-[12px] font-extrabold leading-none",
              darkBadge ? "text-[#153244]" : "text-white",
            ].join(" ")}
            style={{ backgroundColor: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1 pt-3">
        <h3 className="text-[17px] font-extrabold leading-tight text-[#153244]">
          {id}. {title}
        </h3>
        <p className="mt-2 flex-1 text-[13px] font-semibold leading-[1.25] text-[#5F6B76]">{description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#5F6B76]">
            <AppIcon name="fileText" size={15} />
            {materials} {materials === 1 ? "material" : "materiales"}
          </span>
          <button
            type="button"
            onClick={onOpen}
            className="min-h-11 shrink-0 rounded-[4px] border border-[#0072BC] px-4 text-[12px] font-bold text-[#0072BC] transition-colors hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
          >
            Ver sección
          </button>
        </div>
      </div>
    </article>
  );
}
