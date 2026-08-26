import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  createDirectoryPerson,
  permanentlyDeleteDirectoryPerson,
  setDirectoryPersonActive,
  updateDirectoryPerson,
} from "../services/adminService";
import {
  getAdminDirectoryPersonDetail,
  getDirectoryFilterOptions,
  getDirectoryPersonDetail,
  searchDirectory,
} from "../services/directoryService";
import { getErrorMessage } from "../services/serviceError";
import { getPendingChangeRequestForPerson, reviewDirectoryChangeRequest } from "../services/profileChangeService";
import type { AdminPersonInput } from "../types/admin";
import type { DirectoryFilterOptions, DirectoryPersonDetail, DirectoryPersonSummary } from "../types/directory";
import type { DirectoryChangeRequest } from "../types/profile";
import { AppIcon } from "./AppIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { DirectoryFilters } from "./DirectoryFilters";
import { DirectorySearch } from "./DirectorySearch";
import { DirectoryChangeRequestDialog } from "./DirectoryChangeRequestDialog";
import { PersonCard } from "./PersonCard";
import { PersonDetailModal } from "./PersonDetailModal";
import { PersonFormDialog } from "./PersonFormDialog";

const pageSize = 10;
const emptyOptions: DirectoryFilterOptions = { areas: [], linkTypes: [], buildings: [], statuses: [], total: 0 };

type PendingAction =
  | { kind: "save"; person: DirectoryPersonDetail; input: AdminPersonInput }
  | { kind: "toggle"; person: DirectoryPersonSummary }
  | { kind: "delete"; person: DirectoryPersonSummary }
  | null;

export function DirectoryPage() {
  const auth = useAuth();
  const isAdmin = auth.profile?.role === "admin";
  const currentPersonId = auth.profile?.directoryPersonId ?? null;
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [area, setArea] = useState("");
  const [linkTypeId, setLinkTypeId] = useState("");
  const [building, setBuilding] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState(emptyOptions);
  const [people, setPeople] = useState<DirectoryPersonSummary[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [isLoadingResults, setIsLoadingResults] = useState(true);
  const [error, setError] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPersonDetail | null>(null);
  const [editingPerson, setEditingPerson] = useState<DirectoryPersonDetail | null>(null);
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [loadingDetailId, setLoadingDetailId] = useState("");
  const [actionPersonId, setActionPersonId] = useState("");
  const [detailError, setDetailError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isMutating, setIsMutating] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [changeRequest, setChangeRequest] = useState<DirectoryChangeRequest | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ directoryPersonId: string | null; avatarUrl: string | null }>).detail;
      if (!detail?.directoryPersonId) return;
      setPeople((current) => current.map((person) => person.id === detail.directoryPersonId ? { ...person, avatarUrl: detail.avatarUrl } : person));
      setSelectedPerson((current) => current?.id === detail.directoryPersonId ? { ...current, avatarUrl: detail.avatarUrl } : current);
    };
    window.addEventListener("profile-avatar-updated", handleAvatarUpdate);
    return () => window.removeEventListener("profile-avatar-updated", handleAvatarUpdate);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingFilters(true);
    void getDirectoryFilterOptions(isAdmin)
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
  }, [isAdmin, refreshVersion]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setIsLoadingResults(true);
    setError("");

    void searchDirectory({
      search: debouncedSearch,
      area,
      linkTypeId,
      building,
      status: isAdmin ? status : "active",
      includeInactive: isAdmin,
      page: currentPage,
      pageSize,
    })
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setPeople(result.people);
        setFilteredTotal(result.filteredTotal);
        if (result.people.length === 0 && result.filteredTotal > 0 && currentPage > 1) setCurrentPage((page) => page - 1);
      })
      .catch((loadError: unknown) => {
        if (requestIdRef.current === requestId) setError(getErrorMessage(loadError, "No se pudo consultar el Directorio."));
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setIsLoadingResults(false);
      });
  }, [area, building, currentPage, debouncedSearch, isAdmin, linkTypeId, refreshVersion, status]);

  const updateFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setArea("");
    setLinkTypeId("");
    setBuilding("");
    setStatus("");
    setCurrentPage(1);
  };

  const loadPersonDetail = async (personId: string) => {
    const detail = isAdmin ? await getAdminDirectoryPersonDetail(personId) : await getDirectoryPersonDetail(personId);
    if (!detail) throw new Error("El integrante ya no está disponible.");
    return detail;
  };

  const handleViewMore = async (personId: string, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setLoadingDetailId(personId);
    setDetailError("");
    try {
      setSelectedPerson(await loadPersonDetail(personId));
    } catch (loadError) {
      setDetailError(getErrorMessage(loadError, "No se pudo cargar el detalle."));
    } finally {
      setLoadingDetailId("");
    }
  };

  const handleEdit = async (personId: string) => {
    setActionPersonId(personId);
    try {
      const detail = await getAdminDirectoryPersonDetail(personId);
      if (!detail) throw new Error("El integrante ya no está disponible.");
      setEditingPerson(detail);
      setPersonFormOpen(true);
    } catch (loadError) {
      toast.error("No se pudo abrir la edición", { description: getErrorMessage(loadError, "Intentá nuevamente.") });
    } finally {
      setActionPersonId("");
    }
  };

  const handleReviewChanges = async (personId: string) => {
    setActionPersonId(personId);
    try {
      const request = await getPendingChangeRequestForPerson(personId);
      if (!request) throw new Error("La solicitud ya fue revisada.");
      setChangeRequest(request);
    } catch (loadError) {
      toast.error("No se pudo abrir la solicitud", { description: getErrorMessage(loadError, "Intentá nuevamente.") });
      setRefreshVersion((version) => version + 1);
    } finally {
      setActionPersonId("");
    }
  };

  const handleReviewDecision = async (approved: boolean, note: string) => {
    if (!changeRequest) return;
    setIsMutating(true);
    try {
      await reviewDirectoryChangeRequest(changeRequest.id, approved, note);
      toast.success(approved ? "Cambios aprobados" : "Solicitud rechazada", {
        description: approved ? "El Directorio ya muestra la información actualizada." : "La persona podrá enviar una nueva solicitud.",
      });
      setChangeRequest(null);
      setRefreshVersion((version) => version + 1);
    } catch (reviewError) {
      toast.error("No se pudo revisar la solicitud", { description: getErrorMessage(reviewError, "Intentá nuevamente.") });
    } finally {
      setIsMutating(false);
    }
  };

  const handlePersonSubmit = async (input: AdminPersonInput) => {
    if (editingPerson) {
      setPendingAction({ kind: "save", person: editingPerson, input });
      return;
    }
    setIsMutating(true);
    try {
      await createDirectoryPerson(input);
      toast.success("Persona añadida", { description: "El Directorio y el acceso inicial ya fueron creados." });
      setPersonFormOpen(false);
      setRefreshVersion((version) => version + 1);
    } catch (createError) {
      toast.error("No se pudo añadir la persona", { description: getErrorMessage(createError, "Revisá los datos e intentá nuevamente.") });
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmedAction = async () => {
    if (!pendingAction) return;
    setIsMutating(true);
    setActionPersonId(pendingAction.person.id);
    try {
      if (pendingAction.kind === "save") {
        await updateDirectoryPerson(pendingAction.person.id, pendingAction.input);
        toast.success("Usuario actualizado", { description: "Los cambios ya se reflejan en el Directorio." });
        setPersonFormOpen(false);
        setEditingPerson(null);
      } else if (pendingAction.kind === "toggle") {
        await setDirectoryPersonActive(pendingAction.person.id, !pendingAction.person.isActive);
        toast.success(pendingAction.person.isActive ? "Usuario desactivado" : "Usuario reactivado");
      } else {
        await permanentlyDeleteDirectoryPerson(pendingAction.person.id);
        toast.success("Usuario eliminado", { description: "Se quitó el acceso y el registro del Directorio." });
      }
      setPendingAction(null);
      setSelectedPerson(null);
      setRefreshVersion((version) => version + 1);
    } catch (mutationError) {
      toast.error("No se pudo completar la operación", { description: getErrorMessage(mutationError, "Intentá nuevamente.") });
    } finally {
      setActionPersonId("");
      setIsMutating(false);
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
    status,
    showStatus: isAdmin,
    disabled: isLoadingFilters,
    onAreaChange: updateFilter(setArea),
    onLinkTypeChange: updateFilter(setLinkTypeId),
    onBuildingChange: updateFilter(setBuilding),
    onStatusChange: updateFilter(setStatus),
    onClear: handleClear,
  };

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-9 grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-center">
        <div>
          {isAdmin ? <p className="mb-1 text-[11px] font-extrabold uppercase text-[#007D95]">Administración</p> : null}
          <h1 className="text-[31px] font-extrabold leading-none text-[#061947]">Directorio 2026</h1>
          <p className="mt-4 text-[13px] font-semibold text-[#153244]">Buscá y conectá con los integrantes de la Red de Capital Humano del GCBA.</p>
        </div>
        <DirectorySearch value={search} onChange={(value) => { setSearch(value); setCurrentPage(1); }} />
      </div>

      <div className="xl:hidden">
        <details className="mb-4 rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[15px] font-extrabold text-[#153244]">Filtros<AppIcon name="adjustments" size={20} /></summary>
          <div className="mt-4"><DirectoryFilters {...filterProps} /></div>
        </details>
      </div>

      <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)]">
        <div className="hidden xl:block"><DirectoryFilters {...filterProps} /></div>
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#061947]">{filteredTotal} integrantes</h2>
              <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">Mostrando {firstItem}-{lastItem} de {filteredTotal}{filterOptions.total !== filteredTotal ? ` · ${filterOptions.total} en total` : ""}</p>
            </div>
            {isAdmin ? <button type="button" onClick={() => { setEditingPerson(null); setPersonFormOpen(true); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-4 text-[13px] font-extrabold text-white hover:bg-[#005F9D]"><AppIcon name="userPlus" size={18} /> Añadir persona</button> : null}
          </div>

          {error ? <p role="alert" className="mb-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">{error}</p> : null}
          {detailError ? <p role="alert" className="mb-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">{detailError}</p> : null}

          {isLoadingResults ? (
            <div className="space-y-2.5" aria-label="Cargando integrantes">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[86px] animate-pulse rounded-[10px] bg-[#E8EEF2]" />)}</div>
          ) : people.length > 0 ? (
            <div className="space-y-2.5">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  loadingDetail={loadingDetailId === person.id}
                  actionLoading={actionPersonId === person.id}
                  isAdmin={isAdmin}
                  isCurrentUser={currentPersonId === person.id}
                  onViewMore={(id, trigger) => void handleViewMore(id, trigger)}
                  onEdit={(id) => void handleEdit(id)}
                  onToggleActive={(target) => setPendingAction({ kind: "toggle", person: target })}
                  onDelete={(target) => setPendingAction({ kind: "delete", person: target })}
                  onReviewChanges={(id) => void handleReviewChanges(id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[10px] border border-dashed border-[#C9D5DE] bg-white px-5 py-10 text-center text-[14px] font-bold text-[#5F6B76]">No hay integrantes que coincidan con la búsqueda.</div>
          )}

          {filteredTotal > pageSize ? <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /> : null}
          <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[13px] font-semibold text-[#5F6B76]"><AppIcon name="clipboard" size={16} />Información de uso interno. No compartas credenciales ni datos sensibles.</p>
        </section>
      </div>

      {selectedPerson ? <PersonDetailModal person={selectedPerson} onClose={handleCloseModal} /> : null}
      {isAdmin ? <PersonFormDialog open={personFormOpen} person={editingPerson} options={filterOptions} loading={isMutating} onCancel={() => { setPersonFormOpen(false); setEditingPerson(null); }} onSubmitRequest={(input) => void handlePersonSubmit(input)} /> : null}
      {isAdmin ? <DirectoryChangeRequestDialog request={changeRequest} options={filterOptions} loading={isMutating} onClose={() => setChangeRequest(null)} onReview={(approved, note) => void handleReviewDecision(approved, note)} /> : null}
      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={getConfirmTitle(pendingAction)}
        description={getConfirmDescription(pendingAction)}
        details={pendingAction ? <strong>{pendingAction.person.name}</strong> : null}
        confirmLabel={getConfirmLabel(pendingAction)}
        variant={pendingAction?.kind === "save" || (pendingAction?.kind === "toggle" && !pendingAction.person.isActive) ? "primary" : "danger"}
        requireAcknowledgement={pendingAction?.kind === "delete"}
        acknowledgementLabel="Confirmo que deseo eliminar definitivamente este usuario y su acceso."
        loading={isMutating}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void handleConfirmedAction()}
      />
    </main>
  );
}

function getConfirmTitle(action: PendingAction) {
  if (!action) return "Confirmar acción";
  if (action.kind === "save") return "¿Guardar cambios del usuario?";
  if (action.kind === "delete") return `¿Eliminar a ${action.person.name}?`;
  return action.person.isActive ? `¿Desactivar a ${action.person.name}?` : `¿Reactivar a ${action.person.name}?`;
}

function getConfirmDescription(action: PendingAction) {
  if (!action) return "";
  if (action.kind === "save") return "Se actualizarán sus datos del Directorio y, cuando corresponda, su acceso al HUB.";
  if (action.kind === "delete") return "Esta acción eliminará definitivamente el registro y la persona perderá acceso al HUB.";
  return action.person.isActive ? "La persona perderá acceso al HUB hasta que sea reactivada." : "La persona recuperará el acceso al HUB.";
}

function getConfirmLabel(action: PendingAction) {
  if (!action) return "Confirmar";
  if (action.kind === "save") return "Guardar cambios";
  if (action.kind === "delete") return "Eliminar definitivamente";
  return action.person.isActive ? "Desactivar" : "Reactivar";
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
