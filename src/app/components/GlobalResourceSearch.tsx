import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatFileKind } from "../lib/formatters";
import type { ResourceSearchItem } from "../types/resources";
import { AppIcon } from "./AppIcon";

type GlobalResourceSearchProps = {
  resources: ResourceSearchItem[];
  loading: boolean;
  onSelect: (resourceId: string) => void;
};

export function GlobalResourceSearch({ resources, loading, onSelect }: GlobalResourceSearchProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const visibleResources = useMemo(() => {
    const term = normalizeText(query);
    if (!term) return resources;
    return resources.filter((resource) => normalizeText([
      resource.title,
      resource.description,
      resource.sectionTitle,
      resource.fileName,
      resource.fileKind,
    ].filter(Boolean).join(" ")).includes(term));
  }, [query, resources]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= visibleResources.length) setActiveIndex(Math.max(0, visibleResources.length - 1));
  }, [activeIndex, visibleResources.length]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const selectResource = (resourceId: string) => {
    setIsOpen(false);
    onSelect(resourceId);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.min(current + 1, Math.max(0, visibleResources.length - 1)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => Math.max(0, current - 1));
      return;
    }
    if (event.key === "Enter" && isOpen && visibleResources[activeIndex]) {
      event.preventDefault();
      selectResource(visibleResources[activeIndex].id);
    }
  };

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[980px]">
      <label htmlFor="hub-resource-search" className="mb-2 block text-[13px] font-extrabold text-[#153244]">Buscar en todos los recursos</label>
      <div className={`flex min-h-14 items-center gap-3 rounded-[10px] border bg-white px-4 shadow-[0_2px_10px_rgba(21,50,68,0.05)] transition ${isOpen ? "border-[#21AFC0] ring-4 ring-[#8DE2D6]/25" : "border-[#C7D1DA]"}`}>
        <AppIcon name="search" size={22} className="shrink-0 text-[#153244]" />
        <input
          id="hub-resource-search"
          type="search"
          role="combobox"
          value={query}
          onChange={(event) => { setQuery(event.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && visibleResources[activeIndex] ? `${listboxId}-${visibleResources[activeIndex].id}` : undefined}
          placeholder="Buscar recursos por título, descripción o sección..."
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#153244] outline-none placeholder:text-[#7A8792]"
          autoComplete="off"
        />
        {query ? (
          <button type="button" onClick={() => { setQuery(""); setIsOpen(true); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] text-[#5F6B76] hover:bg-[#F0F3F5]" aria-label="Limpiar búsqueda">
            <AppIcon name="x" size={19} />
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div id={listboxId} role="listbox" aria-label="Recursos disponibles" className="absolute left-0 right-0 top-[calc(100%+8px)] z-40 max-h-[420px] overflow-y-auto overscroll-contain rounded-[10px] border border-[#D5DEE5] bg-white py-1 shadow-[0_18px_45px_rgba(6,42,67,0.18)]">
          {loading ? (
            <div className="space-y-px p-2" aria-label="Cargando recursos">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-[74px] animate-pulse rounded-[7px] bg-[#E8EEF2]" />)}</div>
          ) : visibleResources.length > 0 ? (
            <>
              <p className="border-b border-[#E8EDF0] px-4 py-2 text-[11px] font-bold text-[#6F7D88]">{visibleResources.length} {visibleResources.length === 1 ? "recurso" : "recursos"}</p>
              {visibleResources.map((resource, index) => (
                <button
                  key={resource.id}
                  id={`${listboxId}-${resource.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectResource(resource.id)}
                  className={`flex min-h-[76px] w-full items-center gap-3 border-b border-[#EEF1F3] px-4 py-3 text-left last:border-b-0 ${index === activeIndex ? "bg-[#EAF7FA]" : "hover:bg-[#F7F9FA]"}`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[8px] bg-[#DDF8F5] text-[#153244]"><AppIcon name="fileDescription" size={22} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-extrabold text-[#153244]">{resource.title}</span>
                    <span className="mt-1 block truncate text-[12px] font-semibold text-[#5F6B76]">{resource.sectionTitle}</span>
                  </span>
                  <span className="shrink-0 rounded-[5px] bg-[#EEF1F3] px-2 py-1 text-[10px] font-extrabold text-[#3C3C3B]">{resource.fileKind ? formatFileKind(resource.fileKind) : "RECURSO"}</span>
                  <AppIcon name="chevronRight" size={18} className="shrink-0 text-[#0072BC]" />
                </button>
              ))}
            </>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-[14px] font-extrabold text-[#153244]">No se encontraron recursos.</p>
              <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">Probá con otro título o sección.</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
}
