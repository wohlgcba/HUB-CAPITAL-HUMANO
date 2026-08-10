import { useEffect, useRef, useState } from "react";
import type { DirectoryFilterOption, DirectoryFilterOptions } from "../types/directory";
import { AppIcon } from "./AppIcon";

type DirectoryFiltersProps = {
  options: DirectoryFilterOptions;
  area: string;
  linkTypeId: string;
  building: string;
  disabled?: boolean;
  onAreaChange: (value: string) => void;
  onLinkTypeChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onClear: () => void;
};

export function DirectoryFilters({
  options,
  area,
  linkTypeId,
  building,
  disabled = false,
  onAreaChange,
  onLinkTypeChange,
  onBuildingChange,
  onClear,
}: DirectoryFiltersProps) {
  const [showAllAreas, setShowAllAreas] = useState(false);
  const visibleAreas = showAllAreas ? options.areas : options.areas.slice(0, 8);

  return (
    <aside className="rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-[#153244]">Filtros</h2>
        <button type="button" disabled={disabled} onClick={onClear} className="flex min-h-11 items-center gap-2 text-[12px] font-bold text-[#005CB9] disabled:opacity-50">
          <AppIcon name="refresh" size={16} /> Limpiar todo
        </button>
      </div>

      <FilterBlock title="Área">
        <StyledFilterSelect value={area} options={options.areas} allLabel="Todas" onChange={onAreaChange} disabled={disabled} />
        <div className="mt-3 space-y-2">
          {visibleAreas.map((option) => (
            <FilterOptionButton key={option.value} option={option} selected={area === option.value} onSelect={onAreaChange} />
          ))}
        </div>
        {options.areas.length > 8 ? (
          <button type="button" onClick={() => setShowAllAreas((current) => !current)} className="mt-3 flex min-h-11 items-center gap-1 text-[12px] font-bold text-[#005CB9]">
            <AppIcon name="chevronDown" size={15} className={showAllAreas ? "rotate-180" : ""} />
            {showAllAreas ? "Ver menos" : "Ver más"}
          </button>
        ) : null}
      </FilterBlock>

      <FilterBlock title="Tipo de enlace">
        <StyledFilterSelect value={linkTypeId} options={options.linkTypes} allLabel="Todos" onChange={onLinkTypeChange} disabled={disabled} />
        <div className="mt-3 space-y-2">
          {options.linkTypes.map((option) => (
            <button key={option.value} type="button" aria-pressed={linkTypeId === option.value} onClick={() => onLinkTypeChange(linkTypeId === option.value ? "" : option.value)} className="flex min-h-8 w-full items-center gap-2 text-left">
              <SelectionBox selected={linkTypeId === option.value} />
              <span className="rounded-[4px] px-3 py-[2px] text-[11px] font-extrabold text-[#153244]" style={{ backgroundColor: option.color }}>{option.label}</span>
              <span className="ml-auto text-[11px] font-semibold text-[#5F6B76]">{option.count}</span>
            </button>
          ))}
        </div>
      </FilterBlock>

      <FilterBlock title="Edificio GCBA">
        <StyledFilterSelect value={building} options={options.buildings} allLabel="Todos" onChange={onBuildingChange} disabled={disabled} />
      </FilterBlock>
    </aside>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-6 last:mb-0"><h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-[#5F6B76]">{title}</h3>{children}</section>;
}

function FilterOptionButton({ option, selected, onSelect }: { option: DirectoryFilterOption; selected: boolean; onSelect: (value: string) => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={() => onSelect(selected ? "" : option.value)} className="flex min-h-8 w-full items-center gap-2 text-left text-[12px] font-semibold text-[#153244]">
      <SelectionBox selected={selected} />
      <span className="min-w-0 flex-1">{option.label}</span>
      <span className="text-[#5F6B76]">{option.count}</span>
    </button>
  );
}

function SelectionBox({ selected }: { selected: boolean }) {
  return <span className={`h-[14px] w-[14px] shrink-0 rounded-[3px] border ${selected ? "border-[#005CB9] bg-[#005CB9] shadow-[inset_0_0_0_3px_white]" : "border-[#A9B7C4] bg-white"}`} />;
}

function StyledFilterSelect({ value, options, allLabel, onChange, disabled }: { value: string; options: DirectoryFilterOption[]; allLabel: string; onChange: (value: string) => void; disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? allLabel;

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button type="button" disabled={disabled} onClick={() => setIsOpen((current) => !current)} className={`flex min-h-11 w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left text-[13px] font-extrabold text-[#153244] ${isOpen ? "border-[#21AFC0] ring-4 ring-[#8DE2D6]/30" : "border-[#C7D1DA]"}`} aria-haspopup="listbox" aria-expanded={isOpen}>
        <span className="min-w-0 truncate">{selectedLabel}</span><AppIcon name="chevronDown" size={16} className={isOpen ? "rotate-180" : ""} />
      </button>
      {isOpen ? (
        <div role="listbox" className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto rounded-[10px] border border-[#D7E0E7] bg-white py-1 shadow-[0_14px_35px_rgba(21,50,68,0.16)]">
          {[{ value: "", label: allLabel, count: 0 }, ...options].map((option) => (
            <button key={option.value || "all"} type="button" role="option" aria-selected={value === option.value} onClick={() => { onChange(option.value); setIsOpen(false); }} className={`flex min-h-10 w-full items-center px-4 text-left text-[13px] font-bold ${value === option.value ? "bg-[#153244] text-white" : "text-[#153244] hover:bg-[#DDF8F5]"}`}>{option.label}</button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
