import { useState } from "react";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";
import { FilterChip } from "./FilterChip";

const filters: Array<{ id: string; label: string; icon: AppIconName }> = [
  { id: "todas", label: "Todas", icon: "grid" },
  { id: "programas", label: "Programas", icon: "briefcase" },
  { id: "encuentros", label: "Encuentros", icon: "calendar" },
  { id: "recursos", label: "Recursos", icon: "fileText" },
  { id: "novedades", label: "Novedades", icon: "bell" },
];

export function SearchPanel({ embedded = false }: { embedded?: boolean }) {
  const [activeFilter, setActiveFilter] = useState("todas");
  const [query, setQuery] = useState("");
  const Wrapper = embedded ? "div" : "section";

  return (
    <Wrapper className={embedded ? "" : "rounded-[14px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.06)]"}>
      <div className="flex min-h-[46px] items-center gap-3 rounded-[8px] border border-[#B9C7D1] bg-white px-4">
        <AppIcon name="search" size={23} />
        <input
          type="text"
          placeholder="Buscar recursos, iniciativas o materiales..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#153244] outline-none placeholder:text-[#6B7782]"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            icon={filter.icon}
            active={activeFilter === filter.id}
            onClick={() => setActiveFilter(filter.id)}
          />
        ))}
      </div>
    </Wrapper>
  );
}
