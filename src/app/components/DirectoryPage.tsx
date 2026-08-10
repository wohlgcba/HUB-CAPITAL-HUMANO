import { useCallback, useEffect, useRef, useState } from "react";
import { getDirectoryFilterOptions, getDirectoryPersonDetail, searchDirectory } from "../services/directoryService";
import { getErrorMessage } from "../services/serviceError";
import type { DirectoryFilterOptions, DirectoryPersonDetail, DirectoryPersonSummary } from "../types/directory";
import { AppIcon } from "./AppIcon";
import { DirectoryFilters } from "./DirectoryFilters";
import { DirectoryInfoPanel } from "./DirectoryInfoPanel";
import { DirectorySearch } from "./DirectorySearch";
import { PersonCard } from "./PersonCard";
import { PersonDetailModal } from "./PersonDetailModal";

const pageSize = 10;
const emptyOptions: DirectoryFilterOptions = { areas: [], linkTypes: [], buildings: [], total: 0 };

export function DirectoryPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [area, setArea] = useState("");
  const [linkTypeId, setLinkTypeId] = useState("");
  const [building, setBuilding] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState(emptyOptions);
  const [people, setPeople] = useState<DirectoryPersonSummary[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [error, setError] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPersonDetail | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState("");
  const [detailError, setDetailError] = useState("");
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingFilters(true);
    void getDirectoryFilterOptions()
      .then((options) => {
        if (!cancelled) setFilterOptions(options);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, "No se pudieron cargar los filtros."));
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFilters(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingResults(true);
    setError("");

    void searchDirectory({ search: debouncedSearch, area, linkTypeId, building, page: currentPage, pageSize })
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setPeople(result.people);
        setFilteredTotal(result.filteredTotal);
      })
      .catch((loadError: unknown) => {
        if (requestIdRef.current === requestId) setError(getErrorMessage(loadError, "No se pudo consultar el Directorio."));
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoadingResults(false);
      });
  }, [area, building, currentPage, debouncedSearch, linkTypeId]);

  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };
  const handleClear = () => {
    setSearch("");
    setArea("");
    setLinkTypeId("");
    setBuilding("");
    setCurrentPage(1);
  };

  const handleViewMore = async (personId: string, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setLoadingDetailId(personId);
    setDetailError("");
    try {
      const detail = await getDirectoryPersonDetail(personId);
      if (!detail) throw new Error("El integrante ya no está disponible.");
      setSelectedPerson(detail);
    } catch (loadError) {
      setDetailError(getErrorMessage(loadError, "No se pudo cargar el detalle."));
    } finally {
      setLoadingDetailId("");
    }
  };

  const handleCloseModal = useCallback(() => {
    setSelectedPerson(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }, []);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize));
  const firstItem = filteredTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, filteredTotal);
  const filterProps = {
    options: filterOptions,
    area,
    linkTypeId,
    building,
    disabled: isLoadingFilters,
    onAreaChange: updateFilter(setArea),
    onLinkTypeChange: updateFilter(setLinkTypeId),
    onBuildingChange: updateFilter(setBuilding),
    onClear: handleClear,
  };

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-9 grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-center">
        <div>
          <h1 className="text-[31px] font-extrabold leading-none text-[#061947]">Directorio 2026</h1>
          <p className="mt-4 text-[13px] font-semibold text-[#153244]">Buscá y conectá con los integrantes de la Red de Capital Humano del GCBA.</p>
        </div>
        <DirectorySearch value={search} onChange={handleSearchChange} />
      </div>

      <div className="xl:hidden">
        <details className="mb-4 rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[15px] font-extrabold text-[#153244]">Filtros<AppIcon name="adjustments" size={20} /></summary>
          <div className="mt-4"><DirectoryFilters {...filterProps} /></div>
        </details>
      </div>

      <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)_270px]">
        <div className="hidden xl:block"><DirectoryFilters {...filterProps} /></div>
        <section className="min-w-0">
          <div className="mb-4">
            <h2 className="text-[16px] font-extrabold text-[#061947]">{filteredTotal} integrantes</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">
              Mostrando {firstItem}-{lastItem} de {filteredTotal}{filterOptions.total !== filteredTotal ? ` · ${filterOptions.total} en total` : ""}
            </p>
          </div>

          {error ? <p role="alert" className="mb-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">{error}</p> : null}
          {detailError ? <p role="alert" className="mb-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">{detailError}</p> : null}

          {isLoadingResults ? (
            <div className="space-y-2.5" aria-label="Cargando integrantes">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[86px] animate-pulse rounded-[10px] bg-[#E8EEF2]" />)}</div>
          ) : people.length > 0 ? (
            <div className="space-y-2.5">
              {people.map((person) => <PersonCard key={person.id} person={person} loadingDetail={loadingDetailId === person.id} onViewMore={(id, trigger) => void handleViewMore(id, trigger)} />)}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#C9D5DE] bg-white px-5 py-10 text-center text-[14px] font-bold text-[#5F6B76]">No hay integrantes que coincidan con la búsqueda.</div>
          )}

          {filteredTotal > pageSize ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> : null}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[13px] font-semibold text-[#5F6B76]"><AppIcon name="clipboard" size={16} />Información de uso interno. No compartas credenciales ni datos sensibles.</p>
        </section>
        <DirectoryInfoPanel />
      </div>

      {selectedPerson ? <PersonDetailModal person={selectedPerson} onClose={handleCloseModal} /> : null}
    </main>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1);
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación del Directorio">
      <PageButton disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} label="Página anterior"><AppIcon name="chevronLeft" size={18} /></PageButton>
      {pages.map((page) => <PageButton key={page} active={page === currentPage} onClick={() => onPageChange(page)} label={`Página ${page}`}>{page}</PageButton>)}
      <PageButton disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} label="Página siguiente"><AppIcon name="chevronRight" size={18} /></PageButton>
    </nav>
  );
}

function PageButton({ children, active, disabled, label, onClick }: { children: React.ReactNode; active?: boolean; disabled?: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} className={`flex h-11 min-w-11 items-center justify-center rounded-[8px] border px-3 text-[13px] font-extrabold ${active ? "border-[#153244] bg-[#153244] text-white" : "border-[#C7D1DA] bg-white text-[#153244]"} disabled:opacity-45`}>{children}</button>;
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);
  return debouncedValue;
}
