import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";
import { FilterChip } from "./FilterChip";

type SearchPanelProps = {
  embedded?: boolean;
  query: string;
  activeCategory: string;
  categories: string[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
};

export function SearchPanel({
  embedded = false,
  query,
  activeCategory,
  categories,
  onQueryChange,
  onCategoryChange,
}: SearchPanelProps) {
  const Wrapper = embedded ? "div" : "section";
  const filters: Array<{ id: string; label: string; icon: AppIconName }> = [
    { id: "", label: "Todas", icon: "grid" },
    ...categories.map((category) => ({ id: category, label: category, icon: getCategoryIcon(category) })),
  ];

  return (
    <Wrapper className={embedded ? "" : "rounded-[14px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.06)]"}>
      <div className="flex min-h-[46px] items-center gap-3 rounded-[8px] border border-[#B9C7D1] bg-white px-4">
        <AppIcon name="search" size={23} />
        <input
          type="text"
          placeholder="Buscar recursos, iniciativas o materiales..."
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#153244] outline-none placeholder:text-[#6B7782]"
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <FilterChip
            key={filter.id}
            label={filter.label}
            icon={filter.icon}
            active={activeCategory === filter.id}
            onClick={() => onCategoryChange(filter.id)}
          />
        ))}
      </div>
    </Wrapper>
  );
}

function getCategoryIcon(category: string): AppIconName {
  const normalized = category.toLocaleLowerCase("es-AR");
  if (normalized.includes("encuentro")) return "calendar";
  if (normalized.includes("recurso")) return "fileText";
  if (normalized.includes("novedad")) return "bell";
  return "briefcase";
}
