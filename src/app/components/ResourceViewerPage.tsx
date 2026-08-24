import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatFileKind, formatFileSize } from "../lib/formatters";
import { logAuditEvent } from "../services/auditService";
import { getResourceReactions, setResourceReaction } from "../services/communityService";
import { getAdminResourceById, getResourceById, getResourceDownloadUrl } from "../services/resourceService";
import { getErrorMessage } from "../services/serviceError";
import type { ResourceFile, ResourceReaction, ResourceReactionSummary, SectionResource } from "../types/resources";
import { AppIcon } from "./AppIcon";
import { ResourceReactions } from "./ResourceReactions";

export function ResourceViewerPage() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = auth.profile?.role === "admin";
  const [resource, setResource] = useState<SectionResource | null>(null);
  const [selectedFileId, setSelectedFileId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reactionSummary, setReactionSummary] = useState<ResourceReactionSummary>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setNotFound(false);
    setError("");
    setReactionSummary(undefined);

    if (!resourceId) {
      setNotFound(true);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void (isAdmin ? getAdminResourceById(resourceId) : getResourceById(resourceId))
      .then((nextResource) => {
        if (cancelled) return;
        if (!nextResource) {
          setNotFound(true);
          return;
        }
        setResource(nextResource);
        setSelectedFileId(nextResource.files[0]?.id ?? "");
        if (nextResource.isActive) {
          void getResourceReactions([nextResource.id]).then((summaries) => {
            if (!cancelled) setReactionSummary(summaries[nextResource.id]);
          }).catch(() => undefined);
        }
        void logAuditEvent("resource_view", "resource", nextResource.id);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, "No se pudo cargar el recurso."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin, resourceId]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === viewerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const selectedFile = useMemo(
    () => resource?.files.find((file) => file.id === selectedFileId) ?? resource?.files[0] ?? null,
    [resource, selectedFileId],
  );

  const handleDownload = async (file: ResourceFile) => {
    setActionError("");
    try {
      const url = await getResourceDownloadUrl(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = file.fileName;
      anchor.click();
      if (resource) void logAuditEvent("resource_download", "resource", resource.id);
    } catch (downloadError) {
      setActionError(getErrorMessage(downloadError, "No se pudo descargar el archivo."));
    }
  };

  const handleToggleFullscreen = async () => {
    setActionError("");

    try {
      if (document.fullscreenElement === viewerRef.current) {
        await document.exitFullscreen();
        return;
      }

      if (!viewerRef.current?.requestFullscreen) {
        throw new Error("Este navegador no permite usar el modo de pantalla completa.");
      }

      await viewerRef.current.requestFullscreen();
    } catch (fullscreenError) {
      setActionError(getErrorMessage(fullscreenError, "No se pudo activar la pantalla completa."));
    }
  };

  const handleReaction = async (reaction: ResourceReaction | null) => {
    if (!resource) return;
    setActionError("");
    try {
      setReactionSummary(await setResourceReaction(resource.id, reaction));
    } catch (reactionError) {
      setActionError(getErrorMessage(reactionError, "No se pudo guardar la reacción."));
    }
  };

  if (isLoading) {
    return <div className="mx-auto h-[560px] w-full max-w-[1400px] animate-pulse bg-[#E8EEF2]" aria-label="Cargando recurso" />;
  }

  if (notFound || error || !resource) {
    return (
      <main className="mx-auto w-screen max-w-[1400px] px-4 py-8 sm:px-6">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-2 font-extrabold text-[#153244]">
          <AppIcon name="chevronLeft" /> Volver
        </button>
        <section className="mt-5 rounded-[14px] border border-[#E3E8EC] bg-white p-8 text-center">
          <h1 className="text-[28px] font-extrabold">{notFound ? "Recurso no encontrado" : "No pudimos cargar el recurso"}</h1>
          <p className="mt-3 text-[14px] font-semibold text-[#5F6B76]">{error || "El recurso solicitado no está publicado."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-screen max-w-[1400px] px-4 py-[18px] sm:px-6 lg:px-8">
      <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#C9D5DE] bg-white px-4 text-[13px] font-extrabold text-[#153244]">
        <AppIcon name="chevronLeft" size={18} /> Volver a la sección
      </button>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[12px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.05)]">
          <p className="text-[11px] font-extrabold uppercase text-[#5F6B76]">Recurso</p>
          <h1 className="mt-2 text-[24px] font-extrabold leading-tight text-[#153244]">{resource.title}</h1>
          <p className="mt-4 text-[13px] font-semibold leading-relaxed text-[#5F6B76]">{resource.description || "Sin descripción."}</p>
          <p className="mt-4 text-[12px] font-bold text-[#5F6B76]">Publicado el {formatDate(resource.publishedAt)}</p>
          {resource.isActive ? <ResourceReactions resourceTitle={resource.title} summary={reactionSummary} canViewReactors={isAdmin} onChange={handleReaction} /> : null}

          <h2 className="mt-7 text-[13px] font-extrabold uppercase text-[#153244]">Archivos</h2>
          {resource.files.length > 0 ? (
            <div className="mt-3 space-y-2">
              {resource.files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setSelectedFileId(file.id)}
                  className={`min-h-11 w-full rounded-[7px] border px-3 py-2 text-left text-[12px] font-extrabold ${selectedFile?.id === file.id ? "border-[#153244] bg-[#DDF8F5]" : "border-[#E3E8EC] bg-white"}`}
                >
                  <span className="block truncate">{file.fileName}</span>
                  <span className="mt-1 block text-[10px] font-semibold text-[#5F6B76]">{formatFileKind(file.fileKind)} · {formatFileSize(file.fileSizeBytes)}</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-[13px] font-semibold text-[#5F6B76]">Este recurso no tiene archivos publicados.</p>
          )}
        </aside>

        <section
          ref={viewerRef}
          className={`min-w-0 bg-white ${isFullscreen ? "flex h-[100dvh] flex-col overflow-hidden p-3 sm:p-5" : "rounded-[12px] border border-[#E3E8EC] p-4 shadow-[0_2px_10px_rgba(21,50,68,0.05)] sm:p-5"}`}
        >
          {selectedFile ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="truncate text-[17px] font-extrabold text-[#153244]">{selectedFile.fileName}</h2>
                  <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">{formatFileKind(selectedFile.fileKind)} · {formatFileSize(selectedFile.fileSizeBytes)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleToggleFullscreen()}
                    aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                    aria-pressed={isFullscreen}
                    title={isFullscreen ? "Salir de pantalla completa" : "Ver en pantalla completa"}
                    className="inline-flex size-11 items-center justify-center rounded-[6px] border border-[#0072BC] text-[#0072BC] transition-colors hover:bg-[#EAF6FD] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#153244]"
                  >
                    <AppIcon name={isFullscreen ? "minimize" : "maximize"} size={20} />
                  </button>
                  {selectedFile.allowDownload ? (
                    <button type="button" onClick={() => void handleDownload(selectedFile)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#0072BC] px-4 text-[13px] font-extrabold text-[#0072BC]">
                      <AppIcon name="download" size={18} /> Descargar
                    </button>
                  ) : null}
                </div>
              </div>
              <div className={isFullscreen ? "min-h-0 flex-1" : ""}>
                <FilePreview file={selectedFile} isFullscreen={isFullscreen} />
              </div>
              {actionError ? <p role="alert" className="mt-4 rounded-[8px] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">{actionError}</p> : null}
            </>
          ) : (
            <div className="flex min-h-[420px] items-center justify-center text-center text-[14px] font-bold text-[#5F6B76]">No hay un archivo disponible para visualizar.</div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilePreview({ file, isFullscreen }: { file: ResourceFile; isFullscreen: boolean }) {
  if (!file.viewUrl) {
    return <div className={`flex items-center justify-center rounded-[8px] bg-[#F5F7F8] px-5 text-center text-[14px] font-bold text-[#5F6B76] ${isFullscreen ? "h-full min-h-0" : "min-h-[420px]"}`}>El archivo no está disponible en Storage.</div>;
  }

  if (file.fileKind === "pdf") {
    return <iframe src={file.viewUrl} title={`Vista previa de ${file.fileName}`} allowFullScreen className={`w-full rounded-[8px] border border-[#E3E8EC] ${isFullscreen ? "h-full min-h-0" : "h-[70dvh] min-h-[520px]"}`} />;
  }

  if (file.fileKind === "image") {
    return <div className={`flex items-center justify-center rounded-[8px] bg-[#F5F7F8] p-4 ${isFullscreen ? "h-full min-h-0" : "min-h-[420px]"}`}><img src={file.viewUrl} alt={file.fileName} className={`${isFullscreen ? "max-h-full" : "max-h-[70dvh]"} max-w-full object-contain`} /></div>;
  }

  return (
    <div className={`flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#C9D5DE] bg-[#F9FAFB] px-6 text-center ${isFullscreen ? "h-full min-h-0" : "min-h-[420px]"}`}>
      <AppIcon name="fileDescription" size={48} className="text-[#153244]" />
      <h3 className="mt-4 text-[18px] font-extrabold text-[#153244]">Vista previa no disponible</h3>
      <p className="mt-2 max-w-[520px] text-[13px] font-semibold leading-relaxed text-[#5F6B76]">Este formato no puede previsualizarse de forma nativa dentro de la WebApp. Podés abrir el archivo original con una aplicación compatible.</p>
      <a href={file.viewUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[6px] bg-[#153244] px-5 text-[13px] font-extrabold text-white">Abrir archivo</a>
    </div>
  );
}
