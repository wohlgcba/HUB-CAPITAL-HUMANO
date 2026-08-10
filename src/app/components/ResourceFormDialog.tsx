import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createResource, updateResource } from "../services/resourceService";
import { getErrorMessage } from "../services/serviceError";
import { inferResourceFileKind } from "../services/storageService";
import type { HubSection } from "../types/hub";
import type { ResourceFileKind, ResourceInput, SectionResource } from "../types/resources";
import { AdminForm } from "./AdminForm";
import { AdminField, AdminSwitch, adminInputClass, adminTextAreaClass } from "./AdminFormFields";

type ResourceFormDialogProps = {
  open: boolean;
  sections: HubSection[];
  initialSectionId?: string;
  resource?: SectionResource | null;
  onCancel: () => void;
  onSaved: (resource: SectionResource) => void;
};

type ResourceFormState = {
  sectionId: string;
  title: string;
  description: string;
  file: File | null;
  fileKind: ResourceFileKind;
  isFeatured: boolean;
  allowDownload: boolean;
  publishedAt: string;
  isActive: boolean;
};

export function ResourceFormDialog({
  open,
  sections,
  initialSectionId,
  resource = null,
  onCancel,
  onSaved,
}: ResourceFormDialogProps) {
  const [form, setForm] = useState<ResourceFormState>(() => createInitialState(resource, initialSectionId, sections));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialState(resource, initialSectionId, sections));
    setErrors({});
    setLoading(false);
  }, [initialSectionId, open, resource, sections]);

  const update = <K extends keyof ResourceFormState>(key: K, value: ResourceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleFileChange = (file: File | null) => {
    setForm((current) => ({ ...current, file, fileKind: file ? inferResourceFileKind(file) : current.fileKind }));
    setErrors((current) => ({ ...current, file: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form, Boolean(resource));
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: ResourceInput = {
      sectionId: form.sectionId,
      title: form.title,
      description: form.description.trim() || null,
      file: form.file,
      fileKind: form.fileKind,
      isFeatured: form.isFeatured,
      allowDownload: form.allowDownload,
      publishedAt: `${form.publishedAt}T12:00:00`,
      isActive: form.isActive,
    };

    setLoading(true);
    try {
      const saved = resource ? await updateResource(resource, payload) : await createResource(payload);
      toast.success(resource ? "Contenido actualizado" : "Contenido añadido", {
        description: "Los contadores y la sección ya fueron actualizados.",
      });
      onSaved(saved);
    } catch (error) {
      toast.error("No se pudo guardar el contenido", {
        description: getErrorMessage(error, "Revisá el archivo e intentá nuevamente."),
      });
    } finally {
      setLoading(false);
    }
  };

  const currentFile = resource?.files[0] ?? null;
  return (
    <AdminForm
      open={open}
      title={resource ? "Editar contenido" : "Añadir contenido"}
      description="El archivo se guardará en Supabase Storage y quedará asociado a la sección elegida."
      submitLabel={resource ? "Guardar cambios" : "Añadir contenido"}
      loading={loading}
      wide
      onSubmit={(event) => void handleSubmit(event)}
      onCancel={onCancel}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Sección" required error={errors.sectionId}>
          <select value={form.sectionId} onChange={(event) => update("sectionId", event.target.value)} className={adminInputClass}>
            <option value="">Seleccionar sección</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.title}{section.isActive ? "" : " (Borrador)"}</option>)}
          </select>
        </AdminField>
        <AdminField label="Tipo de archivo" required error={errors.fileKind}>
          <select value={form.fileKind} onChange={(event) => update("fileKind", event.target.value as ResourceFileKind)} className={adminInputClass}>
            <option value="pdf">PDF</option>
            <option value="powerpoint">PPTX</option>
            <option value="word">DOCX</option>
            <option value="spreadsheet">XLSX</option>
          </select>
        </AdminField>
        <div className="sm:col-span-2">
          <AdminField label="Título del recurso" required error={errors.title}>
            <input value={form.title} onChange={(event) => update("title", event.target.value)} className={adminInputClass} maxLength={220} />
          </AdminField>
        </div>
        <div className="sm:col-span-2">
          <AdminField label="Descripción breve" error={errors.description}>
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className={adminTextAreaClass} maxLength={1000} />
          </AdminField>
        </div>
        <div className="sm:col-span-2">
          <AdminField
            label={resource ? "Reemplazar archivo" : "Archivo"}
            required={!resource}
            hint={currentFile ? `Archivo actual: ${currentFile.fileName}. Si elegís otro, se reemplazará después de guardar correctamente.` : "PDF, PPTX, DOCX o XLSX. Máximo 50 MB."}
            error={errors.file}
          >
            <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} className={`${adminInputClass} cursor-pointer py-2 file:mr-3 file:rounded-[5px] file:border-0 file:bg-[#EAF4FB] file:px-3 file:py-1.5 file:text-[12px] file:font-extrabold file:text-[#005CB9]`} />
          </AdminField>
        </div>
        <AdminField label="Fecha de publicación" required error={errors.publishedAt}>
          <input type="date" value={form.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} className={adminInputClass} />
        </AdminField>
        <div className="grid gap-3">
          <AdminSwitch checked={form.isFeatured} onChange={(checked) => update("isFeatured", checked)} label="Destacado" description="Resalta el recurso dentro de la sección." />
        </div>
        <AdminSwitch checked={form.allowDownload} onChange={(checked) => update("allowDownload", checked)} label="Permitir descarga" description="Los integrantes podrán descargar el archivo." />
        <AdminSwitch checked={form.isActive} onChange={(checked) => update("isActive", checked)} label={form.isActive ? "Publicado" : "Borrador"} description={form.isActive ? "Visible para los integrantes." : "Visible solo en administración."} />
      </div>
    </AdminForm>
  );
}

function createInitialState(resource: SectionResource | null | undefined, sectionId: string | undefined, sections: HubSection[]): ResourceFormState {
  return {
    sectionId: resource?.sectionId ?? sectionId ?? sections[0]?.id ?? "",
    title: resource?.title ?? "",
    description: resource?.description ?? "",
    file: null,
    fileKind: resource?.files[0]?.fileKind ?? "pdf",
    isFeatured: resource?.isFeatured ?? false,
    allowDownload: resource?.files[0]?.allowDownload ?? true,
    publishedAt: toDateInput(resource?.publishedAt ?? new Date().toISOString()),
    isActive: resource?.isActive ?? false,
  };
}

function validate(form: ResourceFormState, isEditing: boolean) {
  const errors: Record<string, string> = {};
  if (!form.sectionId) errors.sectionId = "Seleccioná una sección.";
  if (!form.title.trim()) errors.title = "Ingresá el título.";
  if (!isEditing && !form.file) errors.file = "Seleccioná un archivo.";
  if (form.file && form.file.size > 50 * 1024 * 1024) errors.file = "El archivo no puede superar los 50 MB.";
  if (form.file && inferResourceFileKind(form.file) === "other") errors.file = "El archivo debe ser PDF, PPTX, DOCX o XLSX.";
  if (!form.publishedAt || Number.isNaN(new Date(`${form.publishedAt}T12:00:00`).getTime())) errors.publishedAt = "Ingresá una fecha válida.";
  return errors;
}

function toDateInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
