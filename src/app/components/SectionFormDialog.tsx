import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createSection, updateSection } from "../services/sectionService";
import { getErrorMessage } from "../services/serviceError";
import type { HubSection, SectionInput } from "../types/hub";
import { AdminForm } from "./AdminForm";
import { AdminField, AdminSwitch, adminInputClass, adminTextAreaClass } from "./AdminFormFields";
import { ImageCropField } from "./ImageCropField";

type SectionFormDialogProps = {
  open: boolean;
  section?: HubSection | null;
  onCancel: () => void;
  onSaved: (section: HubSection) => void;
};

type SectionFormState = {
  title: string;
  slug: string;
  category: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
  updatedAt: string;
  bannerFile: File | null;
};

export function SectionFormDialog({ open, section = null, onCancel, onSaved }: SectionFormDialogProps) {
  const [form, setForm] = useState<SectionFormState>(() => createInitialState(section));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(section));

  useEffect(() => {
    if (!open) return;
    setForm(createInitialState(section));
    setErrors({});
    setLoading(false);
    setSlugTouched(Boolean(section));
  }, [open, section]);

  const update = <K extends keyof SectionFormState>(key: K, value: SectionFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleTitleChange = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      slug: slugTouched ? current.slug : createSlug(title),
    }));
    setErrors((current) => ({ ...current, title: "", slug: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: SectionInput = {
      title: form.title,
      slug: form.slug,
      category: form.category,
      description: form.description,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      updatedAt: form.updatedAt,
      bannerFile: form.bannerFile,
    };

    setLoading(true);
    try {
      const saved = section ? await updateSection(section, payload) : await createSection(payload);
      toast.success(section ? "Sección actualizada" : "Sección creada", {
        description: "Los cambios ya están reflejados en el HUB.",
      });
      onSaved(saved);
    } catch (error) {
      toast.error("No se pudo guardar la sección", {
        description: getErrorMessage(error, "Revisá los datos e intentá nuevamente."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminForm
      open={open}
      title={section ? "Editar sección" : "Crear sección"}
      description="Completá la información que verán los integrantes en el HUB."
      submitLabel={section ? "Guardar cambios" : "Crear sección"}
      loading={loading}
      onSubmit={(event) => void handleSubmit(event)}
      onCancel={onCancel}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AdminField label="Nombre" required error={errors.title}>
            <input value={form.title} onChange={(event) => handleTitleChange(event.target.value)} className={adminInputClass} maxLength={160} autoComplete="off" />
          </AdminField>
        </div>
        <AdminField label="Slug" required hint="Solo minúsculas, números y guiones." error={errors.slug}>
          <input value={form.slug} onChange={(event) => { setSlugTouched(true); update("slug", event.target.value.toLowerCase()); }} className={adminInputClass} maxLength={180} autoComplete="off" />
        </AdminField>
        <AdminField label="Categoría" required error={errors.category}>
          <select value={form.category} onChange={(event) => update("category", event.target.value)} className={adminInputClass}>
            <option value="">Seleccionar</option>
            <option value="Programas">Programas</option>
            <option value="Encuentros">Encuentros</option>
            <option value="Recursos">Recursos</option>
            <option value="Novedades">Novedades</option>
          </select>
        </AdminField>
        <div className="sm:col-span-2">
          <AdminField label="Descripción" required error={errors.description}>
            <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className={adminTextAreaClass} maxLength={800} />
          </AdminField>
        </div>
        <AdminField label="Orden" required error={errors.sortOrder}>
          <input type="number" min="0" step="1" value={form.sortOrder} onChange={(event) => update("sortOrder", event.target.value)} className={adminInputClass} />
        </AdminField>
        <AdminField label="Fecha de actualización" required hint={section ? "Al editar, Supabase registra la fecha efectiva del cambio." : undefined} error={errors.updatedAt}>
          <input type="date" value={form.updatedAt} onChange={(event) => update("updatedAt", event.target.value)} className={adminInputClass} disabled={Boolean(section)} />
        </AdminField>
        <div className="sm:col-span-2">
          <AdminField label="Imagen / banner" hint={section?.bannerUrl ? "Dejá el campo vacío para conservar la imagen actual." : "PNG, JPG o WEBP. Máximo 10 MB."} error={errors.bannerFile}>
            <ImageCropField label="banner de la sección" currentUrl={section?.bannerUrl} value={form.bannerFile} disabled={loading} error={errors.bannerFile} onChange={(file) => update("bannerFile", file)} />
          </AdminField>
        </div>
        <div className="sm:col-span-2">
          <AdminSwitch checked={form.isActive} onChange={(checked) => update("isActive", checked)} label={form.isActive ? "Publicada" : "Borrador"} description={form.isActive ? "La sección está visible para los integrantes." : "Solo los administradores pueden verla."} />
        </div>
      </div>
    </AdminForm>
  );
}

function createInitialState(section: HubSection | null | undefined): SectionFormState {
  return {
    title: section?.title ?? "",
    slug: section?.slug ?? "",
    category: section?.category ?? "Programas",
    description: section?.description ?? "",
    sortOrder: String(section?.sortOrder ?? 0),
    isActive: section?.isActive ?? false,
    updatedAt: toDateInput(section?.updatedAt ?? new Date().toISOString()),
    bannerFile: null,
  };
}

function validate(form: SectionFormState) {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Ingresá el nombre.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim())) errors.slug = "Usá un slug válido.";
  if (!form.category.trim()) errors.category = "Seleccioná una categoría.";
  if (!form.description.trim()) errors.description = "Ingresá una descripción.";
  if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0) errors.sortOrder = "Ingresá un orden válido.";
  if (!form.updatedAt || Number.isNaN(new Date(`${form.updatedAt}T12:00:00`).getTime())) errors.updatedAt = "Ingresá una fecha válida.";
  if (form.bannerFile && form.bannerFile.size > 10 * 1024 * 1024) errors.bannerFile = "La imagen no puede superar los 10 MB.";
  return errors;
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDateInput(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}
