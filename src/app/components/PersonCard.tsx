import type { DirectoryPersonSummary } from "../types/directory";
import { AppIcon } from "./AppIcon";
import { AvatarImage } from "./AvatarImage";
import { LinkTypeBadge } from "./LinkTypeBadge";

type PersonCardProps = {
  person: DirectoryPersonSummary;
  loadingDetail: boolean;
  onViewMore: (personId: string, trigger: HTMLButtonElement) => void;
  isAdmin?: boolean;
  isCurrentUser?: boolean;
  actionLoading?: boolean;
  onEdit?: (personId: string) => void;
  onToggleActive?: (person: DirectoryPersonSummary) => void;
  onDelete?: (person: DirectoryPersonSummary) => void;
};

const avatarColors = ["#BFEFED", "#FFD957", "#D4C2EF", "#C8F0DF", "#FFD7C9", "#DCEAFF"];

export function PersonCard({
  person,
  loadingDetail,
  onViewMore,
  isAdmin = false,
  isCurrentUser = false,
  actionLoading = false,
  onEdit,
  onToggleActive,
  onDelete,
}: PersonCardProps) {
  const columns = isAdmin
    ? "xl:grid-cols-[minmax(180px,1.1fr)_minmax(145px,0.9fr)_minmax(120px,0.75fr)_auto]"
    : "xl:grid-cols-[minmax(220px,1.05fr)_minmax(230px,1fr)_minmax(170px,0.8fr)_104px]";

  return (
    <article className={`grid min-w-0 items-center gap-4 rounded-[10px] border bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(21,50,68,0.035)] transition hover:shadow-[0_6px_18px_rgba(21,50,68,0.055)] sm:px-5 xl:min-h-[86px] ${person.isActive ? "border-[#E3E8EC] hover:border-[#D2DCE4]" : "border-[#E9D9A3] bg-[#FFFDF6]"} ${columns}`}>
      <div className="flex min-w-0 items-center gap-4">
        <span className="relative flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[19px] font-extrabold text-[#153244]" style={{ backgroundColor: getAvatarColor(person.id) }}>
          {getInitials(person.name)}
          <AvatarImage src={person.avatarUrl} alt={`Foto de perfil de ${person.name}`} />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-[18px] font-extrabold leading-tight text-[#061947]">{person.name}</h3>
          {isAdmin ? <span className={`mt-1 inline-flex rounded-[4px] px-2 py-0.5 text-[10px] font-extrabold ${person.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>{person.isActive ? "Activo" : "Inactivo"}</span> : null}
        </div>
      </div>

      <div className="min-w-0 border-[#E3E8EC] xl:border-l xl:pl-6">
        <p className="truncate text-[11px] font-extrabold uppercase leading-tight text-[#153244]">{person.area}</p>
        <p className="mt-1 truncate text-[12px] font-semibold leading-tight text-[#5F6B76]">{person.role || "Sin especificar"}</p>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 border-[#E3E8EC] xl:border-l xl:pl-6">
        {person.linkTypes.length ? person.linkTypes.map((type) => <LinkTypeBadge key={type.id} type={type} />) : <span className="text-[12px] font-semibold text-[#5F6B76]">Sin especificar</span>}
      </div>

      <div className="flex flex-wrap justify-start gap-2 xl:justify-end">
        <button type="button" disabled={loadingDetail} onClick={(event) => onViewMore(person.id, event.currentTarget)} className="min-h-11 rounded-[5px] border border-[#005CB9] px-4 text-[12px] font-extrabold text-[#005CB9] transition hover:bg-[#EAF4FF] disabled:cursor-wait disabled:opacity-60 sm:min-w-[92px]">
          {loadingDetail ? "Cargando..." : "Ver más"}
        </button>
        {isAdmin ? (
          <>
            <button type="button" disabled={actionLoading} onClick={() => onEdit?.(person.id)} aria-label={`Editar ${person.name}`} title="Editar" className="inline-flex h-11 w-11 items-center justify-center gap-1.5 rounded-[5px] border border-[#C7D1DA] text-[12px] font-extrabold text-[#153244] hover:bg-[#F5F7F8] disabled:opacity-50 2xl:w-auto 2xl:px-3"><AppIcon name="edit" size={16} /><span className="hidden 2xl:inline">Editar</span></button>
            <details className="group relative">
              <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-[5px] border border-[#C7D1DA] text-[#153244] hover:bg-[#F5F7F8] [&::-webkit-details-marker]:hidden" aria-label={`Acciones para ${person.name}`}><AppIcon name="dots" size={20} /></summary>
              <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-52 overflow-hidden rounded-[8px] border border-[#D7E0E7] bg-white py-1 shadow-[0_12px_32px_rgba(21,50,68,0.18)]">
                <button type="button" disabled={actionLoading || isCurrentUser} onClick={() => onToggleActive?.(person)} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[12px] font-extrabold text-[#153244] hover:bg-[#F5F7F8] disabled:cursor-not-allowed disabled:opacity-45"><AppIcon name="power" size={17} />{person.isActive ? "Desactivar" : "Reactivar"}</button>
                <button type="button" disabled={actionLoading || isCurrentUser} onClick={() => onDelete?.(person)} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-[12px] font-extrabold text-[#B52F2F] hover:bg-[#FFF4F4] disabled:cursor-not-allowed disabled:opacity-45"><AppIcon name="trash" size={17} />Eliminar definitivamente</button>
                {isCurrentUser ? <p className="border-t border-[#E3E8EC] px-4 py-2 text-[10px] font-semibold leading-tight text-[#5F6B76]">No podés desactivar ni eliminar tu propia cuenta.</p> : null}
              </div>
            </details>
          </>
        ) : null}
      </div>
    </article>
  );
}

export function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function getAvatarColor(id: string) {
  const hash = [...id].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length];
}
