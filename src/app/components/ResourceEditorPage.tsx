import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams, type BlockerFunction } from "react-router";
import { toast } from "sonner";
import { formatDate, formatFileKind, formatFileSize } from "../lib/formatters";
import { emptyRichTextDocument, hasRichTextContent, legacyTextToRichText, richTextToPlainText } from "../lib/richText";
import { createResource, getAdminResourceById, updateResource } from "../services/resourceService";
import { getAdminSectionBySlug, listAdminSections } from "../services/sectionService";
import { getErrorMessage } from "../services/serviceError";
import { inferResourceFileKind, validateResourceFile, validateSectionBanner } from "../services/storageService";
import type { HubSection } from "../types/hub";
import type { ResourceFile, ResourceInput, SectionResource } from "../types/resources";
import { AdminField, AdminSwitch, adminInputClass } from "./AdminFormFields";
import { AppIcon } from "./AppIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import { ImageCropDialog, ImageCropField, type ImageCropSource } from "./ImageCropField";
import { RichTextContent } from "./RichTextContent";
import { RichTextEditor } from "./RichTextEditor";

type EditorForm = {
  title: string;
  contentJson: JSONContent;
  plainText: string;
  file: File | null;
  coverFile: File | null;
  isFeatured: boolean;
  allowDownload: boolean;
  publishedAt: string;
  isActive: boolean;
};

const initialForm: EditorForm = {
  title: "",
  contentJson: emptyRichTextDocument,
  plainText: "",
  file: null,
  coverFile: null,
  isFeatured: false,
  allowDownload: true,
  publishedAt: new Date().toISOString().slice(0, 10),
  isActive: false,
};

export function ResourceEditorPage() {
  const { resourceId, slug } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(resourceId);
  const [resource, setResource] = useState<SectionResource | null>(null);
  const [section, setSection] = useState<HubSection | null>(null);
  const [form, setForm] = useState<EditorForm>(initialForm);
  const [editorKey, setEditorKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [mobileMode, setMobileMode] = useState<"edit" | "preview">("edit");
  const [imageSource, setImageSource] = useState<ImageCropSource | null>(null);
  const allowNavigationRef = useRef(false);
  const coverPreviewUrl = useObjectUrl(form.coverFile);
  const filePreviewUrl = useObjectUrl(form.file);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    void (async () => {
      if (resourceId) {
        const [nextResource, sections] = await Promise.all([getAdminResourceById(resourceId), listAdminSections()]);
        if (!nextResource) throw new Error("El recurso no existe o ya no está disponible.");
        const nextSection = sections.find((candidate) => candidate.id === nextResource.sectionId);
        if (!nextSection) throw new Error("No se pudo identificar la sección del recurso.");
        if (cancelled) return;
        const contentJson = nextResource.contentJson ?? legacyTextToRichText(nextResource.description);
        setResource(nextResource);
        setSection(nextSection);
        setForm({
          title: nextResource.title,
          contentJson,
          plainText: richTextToPlainText(contentJson),
          file: null,
          coverFile: null,
          isFeatured: nextResource.isFeatured,
          allowDownload: nextResource.files[0]?.allowDownload ?? true,
          publishedAt: toDateInput(nextResource.publishedAt),
          isActive: nextResource.isActive,
        });
      } else if (slug) {
        const nextSection = await getAdminSectionBySlug(slug);
        if (!nextSection) throw new Error("La sección no existe o ya no está disponible.");
        if (cancelled) return;
        setResource(null);
        setSection(nextSection);
        setForm({ ...initialForm, contentJson: { ...emptyRichTextDocument, content: [{ type: "paragraph" }] }, publishedAt: new Date().toISOString().slice(0, 10) });
      } else {
        throw new Error("No se indicó el recurso o la sección que querés editar.");
      }
      setEditorKey((key) => key + 1);
      setDirty(false);
    })().catch((loadError: unknown) => {
      if (!cancelled) setError(getErrorMessage(loadError, "No se pudo abrir el editor."));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [resourceId, slug]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || allowNavigationRef.current) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => dirty && !allowNavigationRef.current && currentLocation.pathname !== nextLocation.pathname,
    [dirty],
  );
  const blocker = useBlocker(shouldBlock);

  const update = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setDirty(true);
  };

  const handleFileChange = (nextFile: File | null) => {
    if (nextFile && inferResourceFileKind(nextFile) === "image") {
      if (nextFile.size > 10 * 1024 * 1024) {
        setErrors((current) => ({ ...current, file: "La imagen no puede superar los 10 MB." }));
        return;
      }
      setImageSource({ file: nextFile, url: URL.createObjectURL(nextFile) });
      return;
    }
    update("file", nextFile);
  };

  const save = async (forceActive: boolean) => {
    if (!section || saving) return;
    const nextForm = { ...form, isActive: forceActive };
    const nextErrors = validate(nextForm);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setMobileMode("edit");
      return;
    }

    const payload: ResourceInput = {
      sectionId: section.id,
      title: nextForm.title,
      description: nextForm.plainText || null,
      contentJson: nextForm.contentJson,
      file: nextForm.file,
      fileKind: nextForm.file ? inferResourceFileKind(nextForm.file) : resource?.files[0]?.fileKind ?? "other",
      coverFile: nextForm.coverFile,
      isFeatured: nextForm.isFeatured,
      allowDownload: nextForm.allowDownload,
      publishedAt: `${nextForm.publishedAt}T12:00:00`,
      isActive: forceActive,
    };

    setSaving(true);
    try {
      const saved = resource ? await updateResource(resource, payload) : await createResource(payload);
      allowNavigationRef.current = true;
      setDirty(false);
      toast.success(resource ? "Recurso actualizado" : forceActive ? "Recurso publicado" : "Borrador guardado", {
        description: "Los cambios ya están disponibles en el HUB.",
      });
      navigate(`/recursos/${saved.id}`, { replace: true });
    } catch (saveError) {
      toast.error("No se pudo guardar el recurso", { description: getErrorMessage(saveError, "Revisá los datos e intentá nuevamente.") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mx-auto mt-6 h-[680px] w-[calc(100%-32px)] max-w-[1500px] animate-pulse rounded-[10px] bg-[#E5EAEE]" aria-label="Cargando editor" />;

  if (error || !section) {
    return <main className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6"><section className="rounded-[10px] border border-[#F0B8B8] bg-white p-8 text-center"><h1 className="text-[25px] font-extrabold text-[#061947]">No pudimos abrir el editor</h1><p className="mt-2 text-[14px] font-semibold text-[#C83232]">{error}</p><button type="button" onClick={() => navigate(-1)} className="mt-5 min-h-11 rounded-[6px] bg-[#153244] px-5 text-[13px] font-extrabold text-white">Volver</button></section></main>;
  }

  const currentFile = resource?.files[0] ?? null;
  const previewFile = form.file ? toPreviewFile(form.file, filePreviewUrl) : currentFile;
  const previewCover = coverPreviewUrl ?? resource?.coverImageUrl ?? null;

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button type="button" onClick={() => navigate(-1)} className="inline-flex min-h-10 items-center gap-2 text-[12px] font-extrabold text-[#005CB9]"><AppIcon name="chevronLeft" size={17} /> Volver</button>
            <p className="mt-2 text-[11px] font-extrabold uppercase text-[#007D95]">{section.title}</p>
            <h1 className="mt-1 text-[clamp(26px,3vw,36px)] font-extrabold leading-tight text-[#061947]">{isEditing ? "Editar recurso" : "Nuevo recurso"}</h1>
          </div>
          <span className={`w-fit rounded-[5px] px-3 py-1.5 text-[11px] font-extrabold ${form.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>{form.isActive ? "Publicado" : "Borrador"}</span>
        </div>

        <div className="mb-4 grid grid-cols-2 rounded-[7px] border border-[#C7D1DA] bg-white p-1 lg:hidden" aria-label="Modo del editor">
          <button type="button" onClick={() => setMobileMode("edit")} className={`min-h-10 rounded-[5px] text-[12px] font-extrabold ${mobileMode === "edit" ? "bg-[#153244] text-white" : "text-[#5F6B76]"}`}>Modo edición</button>
          <button type="button" onClick={() => setMobileMode("preview")} className={`min-h-10 rounded-[5px] text-[12px] font-extrabold ${mobileMode === "preview" ? "bg-[#153244] text-white" : "text-[#5F6B76]"}`}>Vista previa</button>
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(430px,1.1fr)] lg:items-start">
          <section className={`${mobileMode === "preview" ? "block" : "hidden"} min-w-0 lg:sticky lg:top-5 lg:block`} aria-labelledby="resource-preview-title">
            <h2 id="resource-preview-title" className="mb-3 text-[17px] font-extrabold text-[#153244]">Vista previa</h2>
            <ResourceLivePreview form={form} section={section} file={previewFile} coverUrl={previewCover} />
          </section>

          <section className={`${mobileMode === "edit" ? "block" : "hidden"} min-w-0 overflow-hidden rounded-[10px] border border-[#DCE3E8] bg-white shadow-[0_3px_14px_rgba(21,50,68,0.06)] lg:block`} aria-labelledby="resource-editor-title">
            <div className="border-b border-[#E3E8EC] px-5 py-4 sm:px-6">
              <h2 id="resource-editor-title" className="text-[19px] font-extrabold text-[#061947]">Editar recurso</h2>
              <p className="mt-1 text-[12px] font-semibold text-[#6F7D88]">Los cambios se reflejan en la vista previa antes de guardarse.</p>
            </div>
            <div className="grid gap-5 p-5 sm:p-6">
              <AdminField label="Título" required error={errors.title}>
                <input value={form.title} onChange={(event) => update("title", event.target.value)} maxLength={220} className={adminInputClass} />
              </AdminField>
              <AdminField label="Contenido" required error={errors.contentJson}>
                <RichTextEditor key={editorKey} initialContent={form.contentJson} disabled={saving} error={errors.contentJson} onChange={(contentJson, plainText) => { setForm((current) => ({ ...current, contentJson, plainText })); setErrors((current) => ({ ...current, contentJson: "" })); setDirty(true); }} />
              </AdminField>
              <AdminField label={currentFile ? "Archivo adjunto actual" : "Archivo adjunto"} hint={currentFile && !form.file ? "Se conservará mientras no selecciones un reemplazo." : "PDF, PPTX, DOCX, XLSX o imagen. Máximo 50 MB."} error={errors.file}>
                {currentFile ? <CurrentFileCard file={currentFile} replacingFile={form.file} /> : null}
                <label className={`mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-[7px] border border-dashed border-[#9FB5C4] bg-[#F7F9FA] px-4 text-[12px] font-extrabold text-[#005CB9] hover:bg-[#EAF6FD] ${saving ? "pointer-events-none opacity-50" : ""}`}>
                  <AppIcon name="upload" size={18} /> {currentFile ? "Reemplazar archivo" : "Seleccionar archivo"}
                  <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="sr-only" disabled={saving} onChange={(event) => { handleFileChange(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} />
                </label>
                {form.file ? <p className="mt-2 break-all text-[11px] font-bold text-[#006F73]">Nuevo archivo: {form.file.name}</p> : null}
              </AdminField>
              <AdminField label="Portada" hint={resource?.coverImageUrl ? "Si no elegís otra, se conserva la portada actual." : "Opcional. Formato 16:9, JPG, PNG o WEBP."} error={errors.coverFile}>
                <ImageCropField label="portada del recurso" currentUrl={resource?.coverImageUrl} value={form.coverFile} disabled={saving} error={errors.coverFile} onChange={(file) => update("coverFile", file)} />
              </AdminField>
              <AdminField label="Fecha de publicación" required error={errors.publishedAt}>
                <input type="date" value={form.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} className={adminInputClass} />
              </AdminField>
              <div className="grid gap-3 sm:grid-cols-2">
                <AdminSwitch checked={form.isFeatured} onChange={(checked) => update("isFeatured", checked)} label="Destacado" description="Resalta el recurso en la sección." />
                <AdminSwitch checked={form.allowDownload} onChange={(checked) => update("allowDownload", checked)} label="Permitir descarga" description="Habilita la descarga del adjunto." />
              </div>
              <AdminSwitch checked={form.isActive} onChange={(checked) => update("isActive", checked)} label={form.isActive ? "Publicado" : "Borrador"} description={form.isActive ? "Visible para todos los integrantes." : "Visible únicamente para administradores."} />
            </div>
            <div className="flex flex-col-reverse gap-2 border-t border-[#E3E8EC] bg-[#FAFBFC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" disabled={saving} onClick={() => navigate(-1)} className="min-h-11 rounded-[7px] border border-[#C7D1DA] bg-white px-5 text-[13px] font-extrabold text-[#153244] disabled:opacity-50">Cancelar</button>
              <button type="button" disabled={saving} onClick={() => void save(false)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] border border-[#0072BC] bg-white px-5 text-[13px] font-extrabold text-[#0072BC] disabled:opacity-50"><AppIcon name="deviceFloppy" size={17} /> Guardar borrador</button>
              <button type="button" disabled={saving} onClick={() => void save(isEditing ? form.isActive : true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white disabled:opacity-55">{saving ? <AppIcon name="loader" size={17} className="animate-spin" /> : <AppIcon name="check" size={17} />} {isEditing ? "Guardar cambios" : "Publicar recurso"}</button>
            </div>
          </section>
        </div>
      </div>

      {imageSource ? <ImageCropDialog source={imageSource} onCancel={() => { URL.revokeObjectURL(imageSource.url); setImageSource(null); }} onConfirm={(file) => { update("file", file); URL.revokeObjectURL(imageSource.url); setImageSource(null); }} /> : null}
      <ConfirmDialog open={blocker.state === "blocked"} title="¿Salir sin guardar?" description="Los cambios realizados en este recurso se perderán." confirmLabel="Salir del editor" variant="primary" onCancel={() => blocker.reset?.()} onConfirm={() => { allowNavigationRef.current = true; blocker.proceed?.(); }} />
    </main>
  );
}

function ResourceLivePreview({ form, section, file, coverUrl }: { form: EditorForm; section: HubSection; file: ResourceFile | null; coverUrl: string | null }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-[10px] border border-[#DCE3E8] bg-white shadow-[0_3px_14px_rgba(21,50,68,0.06)]">
      {coverUrl ? <div className="aspect-[16/9] w-full overflow-hidden bg-[#DCE6EC]"><img src={coverUrl} alt="Vista previa de la portada" className="h-full w-full object-cover" /></div> : <div className="flex aspect-[16/6] items-center justify-center bg-[#EAF1F5] text-[#6F7D88]"><AppIcon name="photo" size={34} /></div>}
      <div className="min-w-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-[4px] bg-[#EAF6FD] px-2 py-1 text-[10px] font-extrabold uppercase text-[#005CB9]">{section.title}</span>
          {form.isFeatured ? <span className="rounded-[4px] bg-[#FFCC00] px-2 py-1 text-[10px] font-extrabold text-[#153244]">Destacado</span> : null}
          <span className={`rounded-[4px] px-2 py-1 text-[10px] font-extrabold ${form.isActive ? "bg-[#DDF8F5] text-[#006F73]" : "bg-[#FFF1C2] text-[#735B00]"}`}>{form.isActive ? "Publicado" : "Borrador"}</span>
        </div>
        <h2 className="mt-4 break-words text-[clamp(22px,3vw,30px)] font-extrabold leading-tight text-[#061947] [overflow-wrap:anywhere]">{form.title.trim() || "Título del recurso"}</h2>
        <RichTextContent content={form.contentJson} emptyText="El contenido aparecerá acá mientras escribís." className="mt-4 text-[14px] font-semibold leading-[1.65] text-[#4F606C]" />
        <p className="mt-5 border-t border-[#E3E8EC] pt-4 text-[11px] font-bold text-[#6F7D88]">Publicado el {formatDate(`${form.publishedAt}T12:00:00`)}</p>
        <div className="mt-5 rounded-[8px] border border-[#DCE3E8] bg-[#F7F9FA] p-4">
          <p className="text-[10px] font-extrabold uppercase text-[#6F7D88]">Archivo adjunto</p>
          {file ? <div className="mt-2 flex min-w-0 items-center gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-[7px] bg-[#EAF4FB] text-[#0072BC]"><AppIcon name="fileDescription" size={21} /></span><div className="min-w-0"><p className="break-words text-[12px] font-extrabold text-[#153244] [overflow-wrap:anywhere]">{file.fileName}</p><p className="mt-0.5 text-[10px] font-semibold text-[#6F7D88]">{formatFileKind(file.fileKind)} · {formatFileSize(file.fileSizeBytes)}{form.allowDownload ? " · Descarga habilitada" : ""}</p></div></div> : <p className="mt-2 text-[12px] font-semibold text-[#6F7D88]">Sin archivo adjunto.</p>}
        </div>
      </div>
    </article>
  );
}

function CurrentFileCard({ file, replacingFile }: { file: ResourceFile; replacingFile: File | null }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-[8px] border border-[#DCE3E8] bg-[#F7F9FA] p-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-[7px] bg-[#EAF4FB] text-[#0072BC]"><AppIcon name="fileDescription" size={21} /></span><div className="min-w-0"><p className={`break-words text-[12px] font-extrabold [overflow-wrap:anywhere] ${replacingFile ? "text-[#7C8893] line-through" : "text-[#153244]"}`}>{file.fileName}</p><p className="mt-0.5 text-[10px] font-semibold text-[#6F7D88]">{formatFileKind(file.fileKind)} · {formatFileSize(file.fileSizeBytes)}</p></div></div>;
}

function toPreviewFile(file: File, url: string | null): ResourceFile {
  return { id: "preview", resourceId: "preview", storageBucket: "", storagePath: "", fileName: file.name, fileKind: inferResourceFileKind(file), mimeType: file.type || null, fileSizeBytes: file.size, thumbnailPath: null, thumbnailUrl: null, sortOrder: 0, allowDownload: true, viewUrl: url };
}

function validate(form: EditorForm) {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Ingresá el título.";
  if (!hasRichTextContent(form.contentJson)) errors.contentJson = "Ingresá el contenido del recurso.";
  if (!form.publishedAt || Number.isNaN(new Date(`${form.publishedAt}T12:00:00`).getTime())) errors.publishedAt = "Ingresá una fecha válida.";
  if (form.file) {
    try { validateResourceFile(form.file); } catch (fileError) { errors.file = getErrorMessage(fileError, "El archivo no es válido."); }
  }
  if (form.coverFile) {
    try { validateSectionBanner(form.coverFile); } catch (coverError) { errors.coverFile = getErrorMessage(coverError, "La portada no es válida."); }
  }
  return errors;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const nextUrl = URL.createObjectURL(file);
    setUrl(nextUrl);
    return () => URL.revokeObjectURL(nextUrl);
  }, [file]);
  return url;
}

function toDateInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
