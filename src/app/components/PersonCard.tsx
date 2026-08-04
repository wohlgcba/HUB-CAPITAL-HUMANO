import { LinkTypeBadge, type DirectoryLinkType } from "./LinkTypeBadge";

export interface DirectoryPerson {
  id: string;
  initials: string;
  name: string;
  area: string;
  role: string;
  phone: string;
  email: string;
  building: string;
  linkTypes: DirectoryLinkType[];
  avatar: string;
}

type PersonCardProps = {
  person: DirectoryPerson;
  onViewMore: (person: DirectoryPerson, trigger: HTMLButtonElement) => void;
};

export function PersonCard({ person, onViewMore }: PersonCardProps) {
  return (
    <article className="grid min-w-0 items-center gap-4 rounded-[10px] border border-[#E3E8EC] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(21,50,68,0.035)] transition hover:border-[#D2DCE4] hover:shadow-[0_6px_18px_rgba(21,50,68,0.055)] sm:px-5 xl:min-h-[86px] xl:grid-cols-[minmax(220px,1.05fr)_minmax(230px,1fr)_minmax(170px,0.8fr)_104px]">
      <div className="flex min-w-0 items-center gap-4">
        <span className={`flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full text-[19px] font-extrabold text-[#153244] ${person.avatar}`}>
          {person.initials}
        </span>
        <h3 className="min-w-0 truncate text-[18px] font-extrabold leading-tight text-[#061947]">{person.name}</h3>
      </div>

      <div className="min-w-0 border-[#E3E8EC] xl:border-l xl:pl-6">
        <p className="truncate text-[11px] font-extrabold uppercase leading-tight text-[#153244]">{person.area}</p>
        <p className="mt-1 truncate text-[12px] font-semibold leading-tight text-[#5F6B76]">{person.role}</p>
      </div>

      <div className="flex min-w-0 flex-wrap gap-1.5 border-[#E3E8EC] xl:border-l xl:pl-6">
        {person.linkTypes.map((type) => (
          <LinkTypeBadge key={type} type={type} />
        ))}
      </div>

      <div className="flex justify-start xl:justify-end">
        <button
          type="button"
          onClick={(event) => onViewMore(person, event.currentTarget)}
          className="min-h-11 w-full rounded-[5px] border border-[#005CB9] px-4 text-[12px] font-extrabold text-[#005CB9] transition hover:bg-[#EAF4FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9] sm:w-auto sm:min-w-[92px]"
        >
          Ver más
        </button>
      </div>
    </article>
  );
}
