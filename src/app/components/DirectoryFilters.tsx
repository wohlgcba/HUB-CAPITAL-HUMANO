import { useEffect, useRef, useState } from "react";
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

function OrganizationHierarchyFilter({ units, selectedId, exact, disabled, onChange }: { units: DirectoryOrganizationUnit[]; selectedId: string; exact: boolean; disabled: boolean; onChange: (unitId: string, exact: boolean) => void }) {
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const selected = unitsById.get(selectedId) ?? null;
  const root = selected ? findOrganizationAncestor(selected, 1, unitsById) : null;
  const dependency = selected && selected.depth >= 2 ? findOrganizationAncestor(selected, 2, unitsById) : null;
  const roots = units.filter((unit) => unit.depth === 1).map(toOrganizationOption);
  const dependencies = root ? units.filter((unit) => unit.parentId === root.id) : [];
  const areas = dependency ? units.filter((unit) => unit.parentId === dependency.id) : [];

  return (
    <div className="space-y-3">
      <LabeledFilterSelect label="Organismo">
        <StyledFilterSelect value={root?.id ?? ""} options={roots} allLabel="Todos los organismos" onChange={(value) => onChange(value, false)} disabled={disabled} />
      </LabeledFilterSelect>

      {root && dependencies.length ? (
        <LabeledFilterSelect label="Dependencia">
          <StyledFilterSelect
            value={selected?.depth === 1 && exact ? exactUnitValue : dependency?.id ?? ""}
            options={[{ value: exactUnitValue, label: "Nivel central", count: 0 }, ...dependencies.map(toOrganizationOption)]}
            allLabel="Todas las dependencias"
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

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mb-6 last:mb-0"><h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-[#5F6B76]">{title}</h3>{children}</section>;
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
