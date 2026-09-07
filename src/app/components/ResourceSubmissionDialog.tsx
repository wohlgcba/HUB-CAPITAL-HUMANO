import { useEffect, useState } from "react";
import { toast } from "sonner";
import { submitNovedadesResource } from "../services/communityService";
import { getErrorMessage } from "../services/serviceError";
import { inferResourceFileKind, validateResourceFile } from "../services/storageService";
import { AdminForm } from "./AdminForm";
import { AdminField, adminInputClass, adminTextAreaClass } from "./AdminFormFields";
import { ImageCropDialog, type ImageCropSource } from "./ImageCropField";

type ResourceSubmissionDialogProps = {
  open: boolean;
  sectionId: string;
  onCancel: () => void;
  onSubmitted: () => void;
};

export function ResourceSubmissionDialog({
  open,
  sectionId,
  onCancel,
  onSubmitted,
}: ResourceSubmissionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [imageSource, setImageSource] = useState<ImageCropSource | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setFile(null);
    setErrors({});
    setLoading(false);
    setImageSource(null);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateSubmission(title, file);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await submitNovedadesResource({
        sectionId,
        title: title.trim(),
        description: description.trim() || null,
        file: file!,
      });
      toast.success("Propuesta enviada", {
        description: "Un administrador debe revisarla antes de publicarla.",
      });
      onSubmitted();
    } catch (error) {
      toast.error("No se pudo enviar la propuesta", {
        description: getErrorMessage(error, "Revisá los datos e intentá nuevamente."),
      });
    } finally {
      setLoading(false);
    }
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
    setFile(nextFile);
    setErrors((current) => ({ ...current, file: "" }));
  };

  return (
    <AdminForm
      open={open}
      title="Proponer recurso"
      description="Tu archivo quedará como borrador en Novedades hasta que un administrador lo revise."
      submitLabel="Enviar para revisión"
      loading={loading}
      wide
      onSubmit={(event) => void handleSubmit(event)}
      onCancel={onCancel}
    >
      <div className="grid gap-5">
        <AdminField label="Título del recurso" required error={errors.title}>
          <input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setErrors((current) => ({ ...current, title: "" }));
            }}
            className={adminInputClass}
            maxLength={220}
            autoComplete="off"
          />
        </AdminField>
        <AdminField label="Descripción breve">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={adminTextAreaClass}
            maxLength={1000}
          />
        </AdminField>
        <AdminField
          label="Archivo"
          required
          hint="PDF, PPTX, DOCX, XLSX o imagen. Las imágenes se encuadran antes de enviar."
          error={errors.file}
        >
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
            onChange={(event) => { handleFileChange(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }}
            className={`${adminInputClass} cursor-pointer py-2 file:mr-3 file:rounded-[5px] file:border-0 file:bg-[#EAF4FB] file:px-3 file:py-1.5 file:text-[12px] file:font-extrabold file:text-[#005CB9]`}
          />
        </AdminField>
        <p className="rounded-[8px] border border-[#9BDCE4] bg-[#EAF9FB] px-4 py-3 text-[12px] font-bold leading-relaxed text-[#15566A]">
          La propuesta no será visible para otros integrantes hasta su aprobación.
        </p>
      </div>
      {imageSource ? <ImageCropDialog source={imageSource} onCancel={() => { URL.revokeObjectURL(imageSource.url); setImageSource(null); }} onConfirm={(croppedFile) => { setFile(croppedFile); setErrors((current) => ({ ...current, file: "" })); URL.revokeObjectURL(imageSource.url); setImageSource(null); }} /> : null}
    </AdminForm>
  );
}

function validateSubmission(title: string, file: File | null) {
  const errors: Record<string, string> = {};
  if (!title.trim()) errors.title = "Ingresá el título.";
  if (!file) errors.file = "Seleccioná un archivo.";
  if (file) {
    try {
      validateResourceFile(file);
    } catch (error) {
      errors.file = getErrorMessage(error, "El archivo no es válido.");
    }
  }
  return errors;
}
