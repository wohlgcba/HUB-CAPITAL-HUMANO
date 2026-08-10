import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast as notify } from "sonner";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatFileKind, formatFileSize } from "../lib/formatters";
import { logAuditEvent } from "../services/auditService";
import { deleteResource, getResourceDownloadUrl, listAdminSectionResources, listSectionResources } from "../services/resourceService";
import { getErrorMessage } from "../services/serviceError";
import { getAdminSectionBySlug, getSectionBySlug, listAdminSections } from "../services/sectionService";
import type { HubSection } from "../types/hub";
import type { ResourceFileKind, SectionResource } from "../types/resources";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { ResourceFormDialog } from "./ResourceFormDialog";
import { SectionFormDialog } from "./SectionFormDialog";

const bannerStyles = {
  cyan: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(0,114,188,0.24),transparent_34%),linear-gradient(115deg,#062A43_0%,#073653_58%,#06304A_100%)]",
    accentLarge: "bg-[#35C8D0]/85",
    accentMain: "bg-[#35C8D0]/95",
    halo: "shadow-[0_0_0_34px_rgba(53,200,208,0.18)]",
  },
  yellow: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(255,204,0,0.18),transparent_34%),linear-gradient(115deg,#062A43_0%,#073653_58%,#102F3F_100%)]",
    accentLarge: "bg-[#FFCC00]/80",
    accentMain: "bg-[#FFCC00]/95",
    halo: "shadow-[0_0_0_34px_rgba(255,204,0,0.12)]",
  },
};

const formatStyles: Record<
  ResourceFileKind,
  { icon: AppIconName; iconClass: string; bgClass: string; labelClass: string }
> = {
  pdf: { icon: "fileText", iconClass: "text-[#C7352D]", bgClass: "bg-[#FDECEC]", labelClass: "bg-[#FDECEC] text-[#A62923]" },
  powerpoint: { icon: "presentation", iconClass: "text-[#D76F18]", bgClass: "bg-[#FFF1E3]", labelClass: "bg-[#FFF1E3] text-[#A95110]" },
  spreadsheet: { icon: "files", iconClass: "text-[#15824B]", bgClass: "bg-[#E8F7EF]", labelClass: "bg-[#E8F7EF] text-[#116A3E]" },
  word: { icon: "fileDescription", iconClass: "text-[#0072BC]", bgClass: "bg-[#EAF4FB]", labelClass: "bg-[#EAF4FB] text-[#005A95]" },
  image: { icon: "files", iconClass: "text-[#007D95]", bgClass: "bg-[#E5F7F5]", labelClass: "bg-[#E5F7F5] text-[#006477]" },
  other: { icon: "fileText", iconClass: "text-[#5F6B76]", bgClass: "bg-[#EEF1F3]", labelClass: "bg-[#EEF1F3] text-[#3C3C3B]" },
};

export function SectionDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = auth.profile?.role === "admin";
  const [section, setSection] = useState<HubSection | null>(null);
  const [resources, setResources] = useState<SectionResource[]>([]);
  const [adminSections, setAdminSections] = useState<HubSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [sectionFormOpen, setSectionFormOpen] = useState(false);
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<SectionResource | null>(null);
  const [deletingResource, setDeletingResource] = useState<SectionResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsLoading(true);
    setError("");
    setNotFound(false);

    if (!slug) {
      setNotFound(true);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const sectionRequest = isAdmin ? getAdminSectionBySlug(slug) : getSectionBySlug(slug);
    void sectionRequest
      .then(async (nextSection) => {
        if (!nextSection) {
          if (!cancelled) setNotFound(true);
          return;
        }
        const [nextResources, nextAdminSections] = await Promise.all([
          isAdmin ? listAdminSectionResources(nextSection.id) : listSectionResources(nextSection.id),
          isAdmin ? listAdminSections() : Promise.resolve([]),
        ]);
        if (cancelled) return;
        setSection(nextSection);
        setResources(nextResources);
        setAdminSections(nextAdminSections);
        void logAuditEvent("section_view", "section", nextSection.id);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, "No se pudo cargar la sección."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, refreshVersion, slug]);

  const handleDeleteResource = async () => {
    if (!deletingResource) return;
    setIsDeleting(true);
    try {
      const result = await deleteResource(deletingResource);
      void logAuditEvent("resource_deleted", "resource", deletingResource.id);
      notify.success("Recurso eliminado", {
        description: result.storageCleanupFailed ? "El registro se eliminó; quedó una limpieza de Storage pendiente." : "El recurso ya no está visible para los usuarios.",
      });
      setDeletingResource(null);
      setRefreshVersion((version) => version + 1);
    } catch (deleteError) {
      notify.error("No se pudo eliminar el recurso", { description: getErrorMessage(deleteError, "Intentá nuevamente.") });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (resource: SectionResource) => {
    const file = resource.files.find((candidate) => candidate.allowDownload);
    if (!file) return;

    try {
      const url = await getResourceDownloadUrl(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.fileName;
      anchor.click();
      void logAuditEvent("resource_download", "resource", resource.id);
    } catch (downloadError) {
      setToast(getErrorMessage(downloadError, "No se pudo descargar el archivo."));
      window.setTimeout(() => setToast(""), 2800);
    }
  };

  if (isLoading) return <SectionLoading />;
  if (notFound) return <SectionMessage title="Sección no encontrada" message="La sección solicitada no está publicada dentro del HUB." />;
  if (error || !section) return <SectionMessage title="No pudimos cargar la sección" message={error || "Ocurrió un error inesperado."} />;

  return (
    <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Breadcrumb" className="text-[13px] font-bold text-[#5F6B76]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>HUB</li>
              <li className="text-[#9AA6B2]">/</li>
              <li className="text-[#153244]">{section.title}</li>
            </ol>
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <>
                <button type="button" onClick={() => setSectionFormOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#0072BC] bg-white px-4 text-[13px] font-extrabold text-[#0072BC]"><AppIcon name="edit" size={17} /> Editar sección</button>
                <button type="button" onClick={() => { setEditingResource(null); setResourceFormOpen(true); }} className="inline-flex min-h-11 items-center gap-2 rounded-[6px] bg-[#0072BC] px-4 text-[13px] font-extrabold text-white"><AppIcon name="plus" size={18} /> Añadir recurso</button>
              </>
            ) : null}
            <BackButton onBack={() => navigate("/")} />
          </div>
        </div>

        <SectionBanner section={section} />

        <section className="flex flex-col gap-4" aria-labelledby="section-resources-title">
          <h2 id="section-resources-title" className="text-[clamp(22px,2vw,30px)] font-extrabold text-[#153244]">
            Recursos de la sección
          </h2>
          {resources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {resources.map((resource) => (
                <SectionResourceCard
                  key={resource.id}
                  resource={resource}
                  onOpen={() => navigate(`/recursos/${resource.id}`)}
                  onDownload={() => void handleDownload(resource)}
                  isAdmin={isAdmin}
                  onEdit={() => { setEditingResource(resource); setResourceFormOpen(true); }}
                  onDelete={() => setDeletingResource(resource)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#C9D5DE] bg-white px-5 py-10 text-center text-[15px] font-bold text-[#5F6B76]">
              No hay recursos publicados en esta sección.
            </div>
          )}
        </section>

        <p className="rounded-[10px] border border-[#E3E8EC] bg-white px-5 py-4 text-[13px] font-semibold leading-relaxed text-[#5F6B76] shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
          Uso interno exclusivo del Gobierno de la Ciudad de Buenos Aires. La información de este portal es confidencial y de uso restringido.
        </p>
      </div>

      {toast ? (
        <div role="status" aria-live="polite" className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 rounded-[10px] border border-[#8DE2D6] bg-[#153244] px-5 py-4 text-center text-[14px] font-bold text-white">
          {toast}
        </div>
      ) : null}
      {isAdmin && section ? (
        <>
          <SectionFormDialog
            open={sectionFormOpen}
            section={section}
            onCancel={() => setSectionFormOpen(false)}
            onSaved={(savedSection) => {
              setSectionFormOpen(false);
              if (savedSection.slug !== slug) navigate(`/secciones/${savedSection.slug}`, { replace: true });
              else setRefreshVersion((version) => version + 1);
            }}
          />
          <ResourceFormDialog
            open={resourceFormOpen}
            sections={adminSections.length > 0 ? adminSections : [section]}
            initialSectionId={section.id}
            resource={editingResource}
            onCancel={() => { setResourceFormOpen(false); setEditingResource(null); }}
            onSaved={() => { setResourceFormOpen(false); setEditingResource(null); setRefreshVersion((version) => version + 1); }}
          />
          <ConfirmDialog
            open={Boolean(deletingResource)}
            title="¿Eliminar este recurso?"
            description="Esta acción quitará el recurso de la sección visible para los usuarios."
            details={deletingResource ? <><strong>{deletingResource.title}</strong><span className="mt-1 block text-[#5F6B76]">Sección: {section.title} · Archivo: {deletingResource.files[0]?.fileName || "Sin archivo"}</span></> : null}
            confirmLabel="Eliminar recurso"
            loading={isDeleting}
            onCancel={() => setDeletingResource(null)}
            onConfirm={() => void handleDeleteResource()}
          />
        </>
      ) : null}
    </main>
  );
}

function SectionLoading() {
  return (
    <main className="mx-auto w-screen max-w-[1400px] animate-pulse px-4 py-[18px] sm:px-6 lg:px-8" aria-label="Cargando sección">
      <div className="h-[44px] w-40 rounded bg-[#E5EAEE]" />
      <div className="mt-5 h-[380px] rounded-[14px] bg-[#D9E2E8]" />
      <div className="mt-5 h-40 rounded-[12px] bg-[#E9EEF1]" />
    </main>
  );
}

function SectionMessage({ title, message }: { title: string; message: string }) {
  const navigate = useNavigate();
  return (
    <main className="mx-auto flex w-screen max-w-[1400px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
      <BackButton onBack={() => navigate("/")} />
      <section className="rounded-[14px] border border-[#E3E8EC] bg-white p-8 text-center shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF8F5]">
          <AppIcon name="help" size={34} />
        </span>
        <h1 className="mt-5 text-[clamp(28px,3vw,42px)] font-extrabold text-[#153244]">{title}</h1>
        <p className="mx-auto mt-3 max-w-[560px] text-[15px] font-semibold leading-relaxed text-[#5F6B76]">{message}</p>
      </section>
    </main>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button type="button" onClick={onBack} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[6px] border border-[#C9D5DE] bg-white px-4 text-[13px] font-extrabold text-[#153244] shadow-[0_2px_8px_rgba(21,50,68,0.05)]">
      <AppIcon name="chevronLeft" size={18} />
      Volver al HUB
    </button>
  );
}

function SectionBanner({ section }: { section: HubSection }) {
  const useYellow = section.category.toLocaleLowerCase("es-AR").includes("programa");
  const variant = useYellow ? bannerStyles.yellow : bannerStyles.cyan;
  return (
    <section className="relative min-h-[350px] overflow-hidden rounded-[14px] bg-[#062A43] px-7 py-8 text-white shadow-[0_4px_16px_rgba(21,50,68,0.12)] sm:px-10 lg:min-h-[380px] lg:px-12 lg:py-10">
      {section.bannerUrl ? <img src={section.bannerUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" /> : null}
      <div className={`absolute inset-0 ${variant.glow}`} />
      <div className={`absolute -right-16 bottom-[-88px] h-[250px] w-[250px] rounded-full ${variant.accentLarge}`} />
      <div className={`absolute right-[12%] top-[78px] hidden h-[160px] w-[160px] rounded-full md:block ${variant.accentMain} ${variant.halo}`} />
      <div className="absolute right-[16%] top-[116px] hidden h-[84px] w-[84px] items-center justify-center rounded-full bg-[#FFCC00] text-[#062A43] md:flex">
        <AppIcon name={getSectionIcon(section)} size={44} />
      </div>
      <div className="relative z-10 flex min-h-[286px] max-w-[660px] flex-col justify-between gap-8">
        <div>
          <h1 className="text-[clamp(34px,4vw,56px)] font-extrabold leading-[1.03]">{section.title}</h1>
          <p className="mt-5 max-w-[600px] text-[clamp(16px,1.5vw,20px)] font-semibold leading-[1.45]">{section.description}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-[#153244]">
          <span className="inline-flex min-h-11 items-center rounded-[7px] bg-[#8DE2D6] px-4 text-[14px] font-extrabold">{section.resourceCount} recursos</span>
          <span className="inline-flex min-h-11 items-center rounded-[7px] bg-white px-4 text-[14px] font-extrabold">Actualizado el {formatDate(section.updatedAt)}</span>
        </div>
      </div>
    </section>
  );
}

function SectionResourceCard({ resource, onOpen, onDownload, isAdmin, onEdit, onDelete }: { resource: SectionResource; onOpen: () => void; onDownload: () => void; isAdmin: boolean; onEdit: () => void; onDelete: () => void }) {
  const file = resource.files[0];
  const kind = file?.fileKind ?? "other";
  const style = formatStyles[kind];
  return (
    <article className="flex h-full min-h-[245px] flex-col rounded-[12px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
      <div className="flex items-start gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ${style.bgClass}`}>
          <AppIcon name={style.icon} size={30} className={style.iconClass} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-[5px] px-2 py-1 text-[12px] font-extrabold leading-none ${style.labelClass}`}>{file ? formatFileKind(kind) : "SIN ARCHIVO"}</span>
            {file ? <span className="text-[12px] font-bold text-[#5F6B76]">{formatFileSize(file.fileSizeBytes)}</span> : null}
            {resource.isFeatured ? <span className="rounded-[5px] bg-[#FFCC00] px-2 py-1 text-[12px] font-extrabold">Destacado</span> : null}
            {isAdmin ? <span className={`rounded-[5px] px-2 py-1 text-[12px] font-extrabold ${resource.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>{resource.isActive ? "Publicado" : "Borrador"}</span> : null}
          </div>
          <h3 className="mt-3 text-[20px] font-extrabold leading-tight text-[#153244]">{resource.title}</h3>
        </div>
      </div>
      <p className="mt-4 flex-1 text-[14px] font-semibold leading-[1.45] text-[#5F6B76]">{resource.description || "Sin descripción."}</p>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onOpen} className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white">Abrir recurso</button>
        {resource.files.some((candidate) => candidate.allowDownload) ? <button type="button" onClick={onDownload} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-[13px] font-extrabold text-[#0072BC]"><AppIcon name="download" size={18} /> Descargar</button> : null}
        {isAdmin ? <><button type="button" onClick={onEdit} className="ml-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#0072BC] px-4 text-[13px] font-extrabold text-[#0072BC]"><AppIcon name="edit" size={17} /> Editar</button><button type="button" onClick={onDelete} aria-label={`Eliminar ${resource.title}`} className="flex h-11 w-11 items-center justify-center rounded-[6px] border border-[#E3B0B0] text-[#B52F2F]"><AppIcon name="trash" size={18} /></button></> : null}
      </div>
    </article>
  );
}

function getSectionIcon(section: HubSection): AppIconName {
  const value = `${section.title} ${section.category}`.toLocaleLowerCase("es-AR");
  if (value.includes("encuentro")) return "calendar";
  if (value.includes("reconocimiento")) return "certificate";
  if (value.includes("guía") || value.includes("guia")) return "clipboard";
  if (value.includes("salud")) return "bulb";
  return "target";
}
