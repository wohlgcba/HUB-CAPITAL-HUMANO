import { useEffect, useRef, useState } from "react";
import { validateProfileAvatar } from "../services/storageService";
import { AppIcon } from "./AppIcon";
import { getInitials } from "./PersonCard";

type ProfileAvatarUploaderProps = {
  fullName: string;
  avatarUrl: string | null;
  selectedFile: File | null;
  disabled: boolean;
  onSelect: (file: File) => void;
  onValidationError: (message: string) => void;
};

export function ProfileAvatarUploader({
  fullName,
  avatarUrl,
  selectedFile,
  disabled,
  onSelect,
  onValidationError,
}: ProfileAvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(nextPreviewUrl);
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      validateProfileAvatar(file);
      onSelect(file);
    } catch (validationError) {
      onValidationError(validationError instanceof Error ? validationError.message : "La foto seleccionada no es válida.");
    }
  };

  const visibleAvatarUrl = previewUrl || avatarUrl;

  return (
    <div className="flex flex-col items-center sm:items-start">
      <div className="flex h-[136px] w-[136px] items-center justify-center overflow-hidden rounded-full bg-[#BFEFED] text-[42px] font-extrabold text-[#153244] ring-1 ring-[#8DE2D6]">
        {visibleAvatarUrl ? <img src={visibleAvatarUrl} alt={`Foto de perfil de ${fullName}`} className="h-full w-full object-cover" /> : getInitials(fullName)}
      </div>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileChange} className="sr-only" aria-label="Seleccionar foto de perfil" disabled={disabled} />
      <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#0072BC] bg-white px-4 text-[13px] font-extrabold text-[#0072BC] transition hover:bg-[#EAF4FF] disabled:cursor-wait disabled:opacity-50">
        <AppIcon name="upload" size={19} /> {avatarUrl ? "Reemplazar foto" : "Subir foto de perfil"}
      </button>
      <p className="mt-2 text-center text-[12px] font-semibold text-[#7A8792] sm:text-left">JPG, PNG · Máx. 5 MB</p>
    </div>
  );
}
