import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createHelpFaq, updateHelpFaq } from "../services/helpService";
import { getErrorMessage } from "../services/serviceError";
import type { HelpFaq, HelpFaqIconName, HelpFaqInput } from "../types/help";
import { AdminForm } from "./AdminForm";
import { AdminField, AdminSwitch, adminInputClass, adminTextAreaClass } from "./AdminFormFields";
import { AppIcon } from "./AppIcon";

type HelpFaqFormDialogProps = {
  open: boolean;
  faq?: HelpFaq | null;
  defaultSortOrder?: number;
  onCancel: () => void;
  onSaved: (faq: HelpFaq) => void;
};

type HelpFaqFormState = {
  title: string;
  content: string;
  category: string;
  iconName: HelpFaqIconName;
  sortOrder: string;
  isActive: boolean;
  adminOnly: boolean;
};

const iconOptions: Array<{ name: HelpFaqIconName; label: string }> = [
  { name: "help", label: "Ayuda" },
  { name: "lock", label: "Acceso" },
  { name: "fileDescription", label: "Documento" },
  { name: "download", label: "Descarga" },
  { name: "usersGroup", label: "Personas" },
  { name: "search", label: "Búsqueda" },
  { name: "bell", label: "Novedades" },
  { name: "upload", label: "Publicación" },
  { name: "clipboard", label: "Formulario" },
  { name: "bulb", label: "Consejo" },
  { name: "mail", label: "Correo" },
  { name: "calendar", label: "Agenda" },
  { name: "settings", label: "Configuración" },
];

export function HelpFaqFormDialog({
  open,
  faq = null,
  defaultSortOrder = 10,
  onCancel,
  onSaved,
}: HelpFaqFormDialogProps) {
  const [form, setForm] = useState<HelpFaqFormState>(() => createInitialState(faq, defaultSortOrder));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(createInitialState(faq, defaultSortOrder));
    setErrors({});
    setLoading(false);
  }, [defaultSortOrder, faq, open]);

  const update = <K extends keyof HelpFaqFormState>(key: K, value: HelpFaqFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: HelpFaqInput = {
      title: form.title,
      content: form.content,
      category: form.category,
      iconName: form.iconName,
      sortOrder: Number(form.sortOrder),
      isActive: form.isActive,
      adminOnly: form.adminOnly,
    };

    setLoading(true);
    try {
      const savedFaq = faq ? await updateHelpFaq(faq.id, payload) : await createHelpFaq(payload);
      toast.success(faq ? "Pregunta actualizada" : "Pregunta creada", {
        description: savedFaq.isActive ? "El cambio ya está visible en Ayuda." : "La pregunta quedó guardada como borrador.",
      });
      onSaved(savedFaq);
    } catch (error) {
      toast.error("No se pudo guardar la pregunta", {
        description: getErrorMessage(error, "Revisá los datos e intentá nuevamente."),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminForm
      open={open}
      title={faq ? "Editar pregunta frecuente" : "Añadir pregunta frecuente"}
      description="Configurá la consulta, su respuesta y el ícono que verán los integrantes."
      submitLabel={faq ? "Guardar cambios" : "Añadir pregunta"}
      loading={loading}
      onSubmit={(event) => void handleSubmit(event)}
      onCancel={onCancel}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <AdminField label="Pregunta" required error={errors.title}>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              className={adminInputClass}
              maxLength={180}
              autoComplete="off"
            />
          </AdminField>
        </div>

        <div className="sm:col-span-2">
          <AdminField label="Respuesta" required error={errors.content}>
            <textarea
              value={form.content}
              onChange={(event) => update("content", event.target.value)}
              className={`${adminTextAreaClass} min-h-[140px]`}
              maxLength={1600}
            />
          </AdminField>
        </div>

        <AdminField label="Categoría" required error={errors.category}>
          <input
            value={form.category}
            onChange={(event) => update("category", event.target.value)}
            className={adminInputClass}
            maxLength={80}
            autoComplete="off"
            placeholder="Ej.: Recursos"
          />
        </AdminField>

        <AdminField label="Orden" required hint="Los valores menores aparecen primero." error={errors.sortOrder}>
          <input
            type="number"
            min="0"
            step="1"
            value={form.sortOrder}
            onChange={(event) => update("sortOrder", event.target.value)}
            className={adminInputClass}
          />
        </AdminField>

        <fieldset className="sm:col-span-2">
          <legend className="mb-2 text-[12px] font-extrabold text-[#153244]">Ícono</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {iconOptions.map((option) => {
              const selected = form.iconName === option.name;
              return (
                <label
                  key={option.name}
                  className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-[8px] border px-3 text-[12px] font-extrabold transition ${
                    selected
                      ? "border-[#0072BC] bg-[#EAF4FB] text-[#005CB9] ring-2 ring-[#8DE2D6]/40"
                      : "border-[#D8E0E6] bg-white text-[#153244] hover:bg-[#F5F7F8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="help-faq-icon"
                    value={option.name}
                    checked={selected}
                    onChange={() => update("iconName", option.name)}
                    className="sr-only"
                  />
                  <AppIcon name={option.name} size={19} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <AdminSwitch
          checked={form.isActive}
          onChange={(checked) => update("isActive", checked)}
          label={form.isActive ? "Publicada" : "Borrador"}
          description={form.isActive ? "La pregunta está visible en Ayuda." : "Solo los administradores pueden verla."}
        />

        <AdminSwitch
          checked={form.adminOnly}
          onChange={(checked) => update("adminOnly", checked)}
          label={form.adminOnly ? "Solo administradores" : "Todos los usuarios"}
          description={form.adminOnly ? "La consulta queda reservada a administración." : "La consulta está disponible para cualquier integrante."}
        />
      </div>
    </AdminForm>
  );
}

function createInitialState(faq: HelpFaq | null | undefined, defaultSortOrder: number): HelpFaqFormState {
  return {
    title: faq?.title ?? "",
    content: faq?.content ?? "",
    category: faq?.category ?? "General",
    iconName: faq?.iconName ?? "help",
    sortOrder: String(faq?.sortOrder ?? defaultSortOrder),
    isActive: faq?.isActive ?? true,
    adminOnly: faq?.adminOnly ?? false,
  };
}

function validate(form: HelpFaqFormState) {
  const errors: Record<string, string> = {};
  if (!form.title.trim()) errors.title = "Ingresá la pregunta.";
  if (!form.content.trim()) errors.content = "Ingresá la respuesta.";
  if (!form.category.trim()) errors.category = "Ingresá una categoría.";
  if (!Number.isInteger(Number(form.sortOrder)) || Number(form.sortOrder) < 0) {
    errors.sortOrder = "Ingresá un orden válido.";
  }
  return errors;
}
