import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { formatDate, formatFileKind } from "../lib/formatters";
import { getAdminDashboardStats } from "../services/adminService";
import { logAuditEvent } from "../services/auditService";
import { deleteResource, getAdminRecentResources } from "../services/resourceService";
import { getErrorMessage } from "../services/serviceError";
import { listAdminSections } from "../services/sectionService";
import type { AdminDashboardStats } from "../types/admin";
import type { HubSection } from "../types/hub";
import type { RecentResource, SectionResource } from "../types/resources";
import { AdminSectionCard } from "./AdminSectionCard";
import { AppIcon, type AppIconName } from "./AppIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { ResourceFormDialog } from "./ResourceFormDialog";
import { SectionFormDialog } from "./SectionFormDialog";

export function AdminHubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [sections, setSections] = useState<HubSection[]>([]);
  const [recentResources, setRecentResources] = useState<RecentResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [resourceSectionId, setResourceSectionId] = useState("");
  const [editingResource, setEditingResource] = useState<SectionResource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecentResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDashboard = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true);
    setError("");
    try {
      const [nextStats, nextSections, nextResources] = await Promise.all([
        getAdminDashboardStats(),
        listAdminSections(),
        getAdminRecentResources(8),
      ]);
      setStats(nextStats);
      setSections(nextSections);
      setRecentResources(nextResources);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudo cargar la administración del HUB."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(true);
  }, [loadDashboard]);

  const openResourceForm = (sectionId: string, resource: SectionResource | null = null) => {
    setResourceSectionId(sectionId);
    setEditingResource(resource);
    setResourceFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteResource(deleteTarget);
      void logAuditEvent("resource_deleted", "resource", deleteTarget.id);
      toast.success("Recurso eliminado", {
        description: result.storageCleanupFailed ? "El registro se eliminó; quedó una limpieza de Storage pendiente." : "El recurso ya no está visible para los usuarios.",
      });
      setDeleteTarget(null);
      await loadDashboard();
    } catch (deleteError) {
      toast.error("No se pudo eliminar", { description: getErrorMessage(deleteError, "Intentá nuevamente.") });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12px] font-extrabold uppercase text-[#007D95]">Administración</p>
          <h1 className="mt-1 text-[clamp(28px,3vw,38px)] font-extrabold leading-tight text-[#061947]">Gestión del HUB</h1>
          <p className="mt-2 text-[14px] font-semibold text-[#5F6B76]">Administrá secciones, recursos y publicaciones desde un único espacio.</p>
        </div>
        <button type="button" onClick={() => setSectionFormOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white shadow-[0_3px_10px_rgba(0,114,188,0.18)] hover:bg-[#005F9D]">
          <AppIcon name="plus" size={19} /> Crear sección
        </button>
      </div>

      {error ? <div role="alert" className="mt-5 rounded-[10px] border border-[#F0B8B8] bg-[#FFF4F4] px-5 py-4 text-[14px] font-bold text-[#C93B3B]">{error}</div> : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores administrativos">
        <AdminStatCard title="Secciones" value={stats?.sections} detail={`${stats?.publishedSections ?? 0} publicadas`} icon="grid" color="cyan" loading={isLoading} />
        <AdminStatCard title="Recursos" value={stats?.resources} detail={`${stats?.publishedResources ?? 0} publicados`} icon="fileText" color="blue" loading={isLoading} />
        <AdminStatCard title="Usuarios" value={stats?.users} detail={`${stats?.activeUsers ?? 0} activos`} icon="usersGroup" color="yellow" loading={isLoading} />
        <AdminStatCard title="Pendientes" value={stats?.pending} detail="Borradores o inactivos" icon="alert" color="gray" loading={isLoading} />
      </section>

      <section className="mt-8" aria-labelledby="admin-sections-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#5F6B76]">HUB</p>
            <h2 id="admin-sections-title" className="mt-1 text-[23px] font-extrabold text-[#061947]">Gestión de recursos por sección</h2>
          </div>
          <span className="text-[12px] font-bold text-[#5F6B76]">{sections.length} secciones</span>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[350px] animate-pulse rounded-[12px] bg-[#E5EAEE]" />)}</div>
        ) : sections.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sections.map((section) => (
              <AdminSectionCard
                key={section.id}
                section={section}
                onOpen={() => navigate(`/secciones/${section.slug}`)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[12px] border border-dashed border-[#C9D5DE] bg-white px-5 py-12 text-center text-[14px] font-bold text-[#5F6B76]">No hay secciones creadas.</div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white shadow-[0_2px_10px_rgba(21,50,68,0.05)]" aria-labelledby="recent-changes-title">
        <div className="flex items-center justify-between border-b border-[#E3E8EC] px-5 py-4">
          <h2 id="recent-changes-title" className="text-[18px] font-extrabold text-[#061947]">Últimos cambios en recursos</h2>
          <span className="text-[12px] font-bold text-[#5F6B76]">{recentResources.length} registros</span>
        </div>
        {isLoading ? <div className="h-[180px] animate-pulse bg-[#F0F3F5]" /> : recentResources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-[#F7F9FA] text-[11px] font-extrabold uppercase text-[#5F6B76]"><tr><th className="px-5 py-3">Recurso</th><th className="px-4 py-3">Sección</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Actualización</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
              <tbody>
                {recentResources.map((resource) => (
                  <tr key={resource.id} className="border-t border-[#E8EDF0] text-[13px] font-semibold text-[#153244]">
                    <td className="max-w-[280px] px-5 py-3"><span className="block truncate font-extrabold">{resource.title}</span></td>
                    <td className="px-4 py-3">{resource.sectionTitle || "Sin sección"}</td>
                    <td className="px-4 py-3">{resource.files[0] ? formatFileKind(resource.files[0].fileKind) : "Sin archivo"}</td>
                    <td className="px-4 py-3"><StatusPill active={resource.isActive} /></td>
                    <td className="px-4 py-3 text-[#5F6B76]">{formatDate(resource.updatedAt)}</td>
                    <td className="px-5 py-3"><div className="flex justify-end gap-2"><button type="button" onClick={() => openResourceForm(resource.sectionId, resource)} className="inline-flex min-h-10 items-center gap-1.5 rounded-[6px] border border-[#0072BC] px-3 text-[12px] font-extrabold text-[#0072BC]"><AppIcon name="edit" size={16} />Editar contenido</button><button type="button" onClick={() => setDeleteTarget(resource)} aria-label={`Eliminar ${resource.title}`} className="flex h-10 w-10 items-center justify-center rounded-[6px] border border-[#E3B0B0] text-[#B52F2F]"><AppIcon name="trash" size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="px-5 py-12 text-center text-[14px] font-bold text-[#5F6B76]">No hay cambios en recursos todavía.</div>}
      </section>

      <SectionFormDialog open={sectionFormOpen} onCancel={() => setSectionFormOpen(false)} onSaved={() => { setSectionFormOpen(false); void loadDashboard(); }} />
      <ResourceFormDialog open={resourceFormOpen} sections={sections} initialSectionId={resourceSectionId} resource={editingResource} onCancel={() => { setResourceFormOpen(false); setEditingResource(null); }} onSaved={() => { setResourceFormOpen(false); setEditingResource(null); void loadDashboard(); }} />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="¿Eliminar este recurso?"
        description="Esta acción quitará el recurso de la sección visible para los usuarios."
        details={deleteTarget ? <><strong>{deleteTarget.title}</strong><span className="mt-1 block text-[#5F6B76]">Sección: {deleteTarget.sectionTitle || "Sin especificar"} · Archivo: {deleteTarget.files[0]?.fileName || "Sin archivo"}</span></> : null}
        confirmLabel="Eliminar recurso"
        loading={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </main>
  );
}

function AdminStatCard({ title, value, detail, icon, color, loading }: { title: string; value: number | undefined; detail: string; icon: AppIconName; color: "cyan" | "blue" | "yellow" | "gray"; loading: boolean }) {
  const styles = { cyan: "bg-[#DDF8F5] text-[#007D85]", blue: "bg-[#EAF4FB] text-[#0072BC]", yellow: "bg-[#FFF4C7] text-[#725B00]", gray: "bg-[#EEF1F3] text-[#5F6B76]" }[color];
  return <article className="flex min-h-[112px] items-center gap-4 rounded-[11px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.05)]"><span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[9px] ${styles}`}><AppIcon name={icon} size={25} /></span><div>{loading ? <div className="h-8 w-16 animate-pulse rounded bg-[#E5EAEE]" /> : <p className="text-[27px] font-extrabold leading-none text-[#061947]">{value ?? 0}</p>}<h2 className="mt-1.5 text-[13px] font-extrabold text-[#153244]">{title}</h2><p className="mt-0.5 text-[11px] font-semibold text-[#6F7D88]">{detail}</p></div></article>;
}

function StatusPill({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-[5px] px-2 py-1 text-[11px] font-extrabold ${active ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>{active ? "Publicado" : "Borrador"}</span>;
}
