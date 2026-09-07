import { useEffect, useId, useRef, useState } from "react";
import type { DirectoryFilterOption, DirectoryFilterOptions, DirectoryOrganizationUnit } from "../types/directory";
import { AppIcon } from "./AppIcon";

type DirectoryFiltersProps = {
  options: DirectoryFilterOptions;
  organizationUnitId: string;
  organizationExact: boolean;
  linkTypeId: string;
  building: string;
  status?: string;
  showStatus?: boolean;
  disabled?: boolean;
  onOrganizationChange: (unitId: string, exact: boolean) => void;
  onLinkTypeChange: (value: string) => void;
  onBuildingChange: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onClear: () => void;
};

export function DirectoryFilters({
  options,
  organizationUnitId,
  organizationExact,
  linkTypeId,
  building,
  status = "",
  showStatus = false,
  disabled = false,
  onOrganizationChange,
  onLinkTypeChange,
  onBuildingChange,
  onStatusChange,
  onClear,
}: DirectoryFiltersProps) {
  return (
    <aside className="rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-[#153244]">Filtros</h2>
        <button type="button" disabled={disabled} onClick={onClear} className="flex min-h-11 items-center gap-2 text-[12px] font-bold text-[#005CB9] disabled:opacity-50">
          <AppIcon name="refresh" size={16} /> Limpiar todo
        </button>
      </div>

      <FilterBlock title="Organización">
        <OrganizationHierarchyFilter
          units={options.organizationUnits}
          selectedId={organizationUnitId}
          exact={organizationExact}
          disabled={disabled}
          onChange={onOrganizationChange}
        />
      </FilterBlock>

      <FilterBlock title="Tipo de enlace">
        <div className="space-y-2">
          {options.linkTypes.map((option) => (
            <button key={option.value} type="button" disabled={disabled} aria-pressed={linkTypeId === option.value} onClick={() => onLinkTypeChange(linkTypeId === option.value ? "" : option.value)} className="flex min-h-8 w-full items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50">
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

      {showStatus && onStatusChange ? (
        <FilterBlock title="Estado">
          <StyledFilterSelect value={status} options={options.statuses} allLabel="Todos" onChange={onStatusChange} disabled={disabled} />
        </FilterBlock>
      ) : null}
    </aside>
  );
}

const exactUnitValue = "__exact__";
type FilterSelectOptionData = DirectoryFilterOption & { description?: string; searchText?: string };

function OrganizationHierarchyFilter({ units, selectedId, exact, disabled, onChange }: { units: DirectoryOrganizationUnit[]; selectedId: string; exact: boolean; disabled: boolean; onChange: (unitId: string, exact: boolean) => void }) {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const selected = unitsById.get(selectedId) ?? null;
  const root = selected ? findOrganizationAncestor(selected, 1, unitsById) : null;
  const dependency = selected && selected.depth >= 2 ? findOrganizationAncestor(selected, 2, unitsById) : null;
  const roots = units.filter((unit) => unit.depth === 1).map(toOrganizationOption);
  const organizationSearchOptions = units.map((unit) => toOrganizationSearchOption(unit, unitsById));
  const dependencies = root ? units.filter((unit) => unit.parentId === root.id) : [];
  const areas = dependency ? units.filter((unit) => unit.parentId === dependency.id) : [];

  return (
    <div className="space-y-3">
      <LabeledFilterSelect label="Organismo">
        <StyledFilterSelect value={root?.id ?? ""} options={roots} searchOptions={organizationSearchOptions} allLabel="Todos los organismos" searchPlaceholder="Buscar organismo, dependencia o área..." onChange={(value) => onChange(value, false)} disabled={disabled} />
      </LabeledFilterSelect>

      {root && dependencies.length ? (
        <LabeledFilterSelect label="Dependencia">
          <StyledFilterSelect
            value={selected?.depth === 1 && exact ? exactUnitValue : dependency?.id ?? ""}
            options={[{ value: exactUnitValue, label: "Nivel central", count: 0 }, ...dependencies.map(toOrganizationOption)]}
            allLabel="Todas las dependencias"
            searchPlaceholder="Buscar dependencia..."
            onChange={(value) => value === "" ? onChange(root.id, false) : value === exactUnitValue ? onChange(root.id, true) : onChange(value, false)}
            disabled={disabled}
          />
        </LabeledFilterSelect>
      ) : null}

      {dependency && areas.length ? (
        <LabeledFilterSelect label="Área">
          <StyledFilterSelect
            value={selected?.depth === 2 && exact ? exactUnitValue : selected?.depth === 3 ? selected.id : ""}
            options={[{ value: exactUnitValue, label: "Nivel central", count: 0 }, ...areas.map(toOrganizationOption)]}
            allLabel="Todas las áreas"
            searchPlaceholder="Buscar área..."
            onChange={(value) => value === "" ? onChange(dependency.id, false) : value === exactUnitValue ? onChange(dependency.id, true) : onChange(value, false)}
            disabled={disabled}
          />
        </LabeledFilterSelect>
      ) : null}
    </div>
  );
}

function LabeledFilterSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><p className="mb-1.5 text-[11px] font-bold text-[#536779]">{label}</p>{children}</div>;
}

function findOrganizationAncestor(unit: DirectoryOrganizationUnit, depth: number, unitsById: Map<string, DirectoryOrganizationUnit>) {
  let current: DirectoryOrganizationUnit | undefined = unit;
  while (current && current.depth > depth) current = current.parentId ? unitsById.get(current.parentId) : undefined;
  return current?.depth === depth ? current : null;
}

function toOrganizationOption(unit: DirectoryOrganizationUnit): DirectoryFilterOption {
  return { value: unit.id, label: unit.name, count: unit.count };
}

function toOrganizationSearchOption(unit: DirectoryOrganizationUnit, unitsById: Map<string, DirectoryOrganizationUnit>): FilterSelectOptionData {
  const ancestors: string[] = [];
  let parent = unit.parentId ? unitsById.get(unit.parentId) : undefined;
  while (parent) {
    ancestors.push(parent.name);
    parent = parent.parentId ? unitsById.get(parent.parentId) : undefined;
  }
  const description = ancestors.join(" · ");
  return { ...toOrganizationOption(unit), description: description || undefined, searchText: `${unit.name} ${description}` };
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-6 last:mb-0"><h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-[#5F6B76]">{title}</h3>{children}</section>;
}

function SelectionBox({ selected }: { selected: boolean }) {
  return <span className={`h-[14px] w-[14px] shrink-0 rounded-[3px] border ${selected ? "border-[#005CB9] bg-[#005CB9] shadow-[inset_0_0_0_3px_white]" : "border-[#A9B7C4] bg-white"}`} />;
}

function StyledFilterSelect({ value, options, searchOptions, allLabel, searchPlaceholder, onChange, disabled }: { value: string; options: FilterSelectOptionData[]; searchOptions?: FilterSelectOptionData[]; allLabel: string; searchPlaceholder?: string; onChange: (value: string) => void; disabled: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const selectedLabel = options.find((option) => option.value === value)?.label ?? allLabel;
  const normalizedSearch = normalizeForSearch(search);
  const searchableOptions = searchOptions ?? options;
  const visibleOptions = normalizedSearch
    ? searchableOptions.filter((option) => normalizeForSearch(option.searchText ?? `${option.label} ${option.description ?? ""}`).includes(normalizedSearch))
    : options;

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      return;
    }
    if (searchPlaceholder) requestAnimationFrame(() => searchRef.current?.focus());
  }, [isOpen, searchPlaceholder]);

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
      <button type="button" disabled={disabled} onClick={() => setIsOpen((current) => !current)} className={`flex min-h-11 w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left text-[13px] font-extrabold text-[#153244] ${isOpen ? "border-[#21AFC0] ring-4 ring-[#8DE2D6]/30" : "border-[#C7D1DA]"}`} aria-haspopup="listbox" aria-expanded={isOpen} aria-controls={listboxId}>
        <span className="min-w-0 truncate">{selectedLabel}</span><AppIcon name="chevronDown" size={16} className={isOpen ? "rotate-180" : ""} />
      </button>
      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-[#D7E0E7] bg-white shadow-[0_14px_35px_rgba(21,50,68,0.16)]">
          {searchPlaceholder ? (
            <label className="relative block border-b border-[#E3E8EC] p-2">
              <span className="sr-only">{searchPlaceholder}</span>
              <AppIcon name="search" size={16} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#536779]" />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && visibleOptions.length === 1) {
                    event.preventDefault();
                    onChange(visibleOptions[0].value);
                    setIsOpen(false);
                  }
                }}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-controls={listboxId}
                className="h-10 w-full rounded-[7px] border border-[#C7D1DA] bg-[#F8FAFB] pl-9 pr-3 text-[13px] font-semibold text-[#153244] outline-none placeholder:text-[#7B8995] focus:border-[#21AFC0] focus:ring-2 focus:ring-[#8DE2D6]/35"
              />
            </label>
          ) : null}
          <div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {!normalizedSearch ? <FilterSelectOption option={{ value: "", label: allLabel, count: 0 }} selectedValue={value} onSelect={(nextValue) => { onChange(nextValue); setIsOpen(false); }} /> : null}
            {visibleOptions.map((option) => <FilterSelectOption key={option.value} option={option} selectedValue={value} onSelect={(nextValue) => { onChange(nextValue); setIsOpen(false); }} />)}
            {normalizedSearch && visibleOptions.length === 0 ? <p className="px-4 py-5 text-center text-[12px] font-semibold text-[#5F6B76]">No hay coincidencias.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterSelectOption({ option, selectedValue, onSelect }: { option: FilterSelectOptionData; selectedValue: string; onSelect: (value: string) => void }) {
  return <button type="button" role="option" aria-selected={selectedValue === option.value} onClick={() => onSelect(option.value)} className={`flex min-h-10 w-full flex-col items-start justify-center px-4 py-2 text-left ${selectedValue === option.value ? "bg-[#153244] text-white" : "text-[#153244] hover:bg-[#DDF8F5]"}`}><span className="text-[13px] font-bold leading-4">{option.label}</span>{option.description ? <span className={`mt-0.5 text-[10px] font-semibold leading-4 ${selectedValue === option.value ? "text-white/75" : "text-[#667886]"}`}>{option.description}</span> : null}</button>;
}

function normalizeForSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
}
