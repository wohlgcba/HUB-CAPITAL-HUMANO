import { useEffect, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";

const areas = [
  ["Jefatura de Gabinete", "4"],
  ["Secretaría de Comunicación", "3"],
  ["Secretaría de Hacienda", "3"],
  ["Ministerio de Salud", "3"],
  ["Ministerio de Educación", "3"],
  ["Ministerio de Desarrollo Humano", "2"],
  ["Secretaría de Ambiente", "2"],
  ["Secretaría de Transporte", "1"],
];

const linkTypes = [
  ["Capital Humano", "bg-[#BFEFED] text-[#153244]"],
  ["Comunicación Interna", "bg-[#FFD957] text-[#153244]"],
  ["Discapacidad", "bg-[#D4B9EA] text-[#153244]"],
];

export function DirectoryFilters() {
  return (
    <aside className="rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] xl:border xl:shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold text-[#153244]">Filtros</h2>
        <button className="flex min-h-11 items-center gap-2 text-[12px] font-bold text-[#005CB9]">
          <AppIcon name="refresh" size={16} />
          Limpiar todo
        </button>
      </div>

      <FilterBlock title="Área">
        <StyledFilterSelect options={["Todas", ...areas.map(([label]) => label)]} />
        <div className="mt-3 space-y-2">
          {areas.map(([label, count]) => (
            <label key={label} className="flex items-center gap-2 text-[12px] font-semibold text-[#153244]">
              <span className="h-[14px] w-[14px] rounded-[3px] border border-[#A9B7C4] bg-white" />
              <span className="min-w-0 flex-1">{label}</span>
              <span className="text-[#5F6B76]">{count}</span>
            </label>
          ))}
        </div>
        <button className="mt-3 flex min-h-11 items-center gap-1 text-[12px] font-bold text-[#005CB9]">
          <AppIcon name="chevronDown" size={15} />
          Ver más
        </button>
      </FilterBlock>

      <FilterBlock title="Tipo de enlace">
        <StyledFilterSelect options={["Todas", ...linkTypes.map(([label]) => label)]} />
        <div className="mt-3 space-y-2">
          {linkTypes.map(([label, style]) => (
            <label key={label} className="flex items-center gap-2">
              <span className="h-[14px] w-[14px] rounded-[3px] border border-[#A9B7C4] bg-white" />
              <span className={`rounded-[4px] px-3 py-[2px] text-[11px] font-extrabold ${style}`}>{label}</span>
            </label>
          ))}
        </div>
      </FilterBlock>
    </aside>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6 last:mb-0">
      <h3 className="mb-2 text-[12px] font-extrabold uppercase tracking-[0.03em] text-[#5F6B76]">{title}</h3>
      {children}
    </section>
  );
}

function StyledFilterSelect({ options }: { options: string[] }) {
  const [selected, setSelected] = useState(options[0]);
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
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
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={`flex min-h-11 w-full items-center justify-between rounded-[10px] border bg-white px-4 text-left text-[13px] font-extrabold text-[#153244] shadow-[0_1px_4px_rgba(21,50,68,0.03)] transition hover:border-[#21AFC0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21AFC0] ${
          isOpen ? "border-[#21AFC0] ring-4 ring-[#8DE2D6]/30" : "border-[#C7D1DA]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="min-w-0 truncate">{selected}</span>
        <AppIcon name="chevronDown" size={16} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[10px] border border-[#D7E0E7] bg-white py-1 shadow-[0_14px_35px_rgba(21,50,68,0.16)]"
        >
          {options.map((option) => {
            const isSelected = option === selected;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setSelected(option);
                  setIsOpen(false);
                }}
                className={`flex min-h-10 w-full items-center px-4 text-left text-[13px] font-bold transition ${
                  isSelected ? "bg-[#153244] text-white" : "text-[#153244] hover:bg-[#DDF8F5]"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
