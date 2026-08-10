import type { DirectoryPersonSummary } from "../types/directory";
import { LinkTypeBadge } from "./LinkTypeBadge";

type PersonCardProps = {
  person: DirectoryPersonSummary;
  loadingDetail: boolean;
  onViewMore: (personId: string, trigger: HTMLButtonElement) => void;
};

const avatarColors = ["#BFEFED", "#FFD957", "#D4C2EF", "#C8F0DF", "#FFD7C9", "#DCEAFF"];

export function PersonCard({ person, loadingDetail, onViewMore }: PersonCardProps) {
  return (
    <article className="grid min-w-0 items-center gap-4 rounded-[10px] border border-[#E3E8EC] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(21,50,68,0.035)] transition hover:border-[#D2DCE4] hover:shadow-[0_6px_18px_rgba(21,50,68,0.055)] sm:px-5 xl:min-h-[86px] xl:grid-cols-[minmax(220px,1.05fr)_minmax(230px,1fr)_minmax(170px,0.8fr)_104px]">
      <div className="flex min-w-0 items-center gap-4">
        <span
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full text-[19px] font-extrabold text-[#153244]"
          style={{ backgroundColor: getAvatarColor(person.id) }}
        >
          {getInitials(person.name)}
        </span>
        <h3 className="min-w-0 truncate text-[18px] font-extrabold leading-tight text-[#061947]">{person.name}</h3>
      </div>

      <div className="min-w-0 border-[#E3E8EC] xl:border-l xl:pl-6">
        <p className="truncate text-[11px] font-extrabold uppercase leading-tight text-[#153244]">{person.area}</p>
        <p className="mt-1 truncate text-[12px] font-semibold leading-tight text-[#5F6B76]">{person.role || "Sin especificar"}</p>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 border-[#E3E8EC] xl:border-l xl:pl-6">
        {person.linkTypes.length ? person.linkTypes.map((type) => <LinkTypeBadge key={type.id} type={type} />) : <span className="text-[12px] font-semibold text-[#5F6B76]">Sin especificar</span>}
      </div>

      <div className="flex justify-start xl:justify-end">
        <button
          type="button"
          disabled={loadingDetail}
          onClick={(event) => onViewMore(person.id, event.currentTarget)}
          className="min-h-11 w-full rounded-[5px] border border-[#005CB9] px-4 text-[12px] font-extrabold text-[#005CB9] transition hover:bg-[#EAF4FF] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:min-w-[92px]"
        >
          {loadingDetail ? "Cargando..." : "Ver más"}
        </button>
      </div>
    </article>
  );
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function getAvatarColor(id: string) {
  const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}
