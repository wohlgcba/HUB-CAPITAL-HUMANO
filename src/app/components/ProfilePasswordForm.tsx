import { useId, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/serviceError";
import { AppIcon } from "./AppIcon";

type ProfilePasswordFormProps = {
  mustChangePassword: boolean;
  disabled?: boolean;
  onSavingChange: (saving: boolean) => void;
};

export function ProfilePasswordForm({ mustChangePassword, disabled = false, onSavingChange }: ProfilePasswordFormProps) {
  const auth = useAuth();
  const fieldId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmation("");
    setError("");
  };

  const close = () => {
    if (isSaving) return;
    reset();
    setIsOpen(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Ingresá tu contraseña actual.");
      return;
    }
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("La nueva contraseña debe ser diferente de la actual.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    setIsSaving(true);
    onSavingChange(true);
    try {
      await auth.changePasswordWithCurrentPassword(currentPassword, newPassword);
      reset();
      setIsOpen(false);
      toast.success("Contraseña actualizada", { description: "Ya podés usar tu nueva contraseña en el próximo ingreso." });
    } catch (saveError) {
      setError(getErrorMessage(saveError, "No se pudo actualizar la contraseña."));
    } finally {
      setIsSaving(false);
      onSavingChange(false);
    }
  };

  return (
    <div className="mt-3 overflow-hidden rounded-[9px] border border-[#D8E0E6] bg-[#FCFCFC]">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAF4FB] text-[#0072BC]"><AppIcon name="lock" size={20} /></span>
          <div className="min-w-0">
            <p className="text-[12px] font-bold text-[#5F6B76]">Contraseña</p>
            <p className="mt-1 text-[14px] font-extrabold leading-snug text-[#153244]">{mustChangePassword ? "Debe cambiarla al ingresar" : "Contraseña personalizada"}</p>
          </div>
        </div>
        {!isOpen ? (
          <button type="button" disabled={disabled} onClick={() => setIsOpen(true)} className="min-h-11 rounded-[7px] border border-[#0072BC] px-4 text-[13px] font-extrabold text-[#0072BC] hover:bg-[#EAF4FB] disabled:cursor-not-allowed disabled:opacity-50">
            Cambiar contraseña
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="border-t border-[#D8E0E6] bg-white px-4 py-5" aria-label="Cambiar contraseña">
          <div className="grid gap-4 lg:grid-cols-3">
            <PasswordInput id={`${fieldId}-current`} label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" disabled={isSaving} />
            <PasswordInput id={`${fieldId}-new`} label="Nueva contraseña" value={newPassword} onChange={setNewPassword} autoComplete="new-password" disabled={isSaving} />
            <PasswordInput id={`${fieldId}-confirmation`} label="Repetir contraseña" value={confirmation} onChange={setConfirmation} autoComplete="new-password" disabled={isSaving} />
          </div>
          <p className="mt-3 text-[11px] font-semibold text-[#6F7D88]">Usá al menos 8 caracteres. No reutilices tu CUIT ni compartas la contraseña.</p>
          {error ? <p role="alert" className="mt-3 rounded-[7px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[12px] font-bold text-[#C93B3B]">{error}</p> : null}
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={close} disabled={isSaving} className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-5 text-[13px] font-extrabold text-[#153244] hover:bg-[#F5F7F8] disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSaving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#153244] px-5 text-[13px] font-extrabold text-white hover:bg-[#0D2433] disabled:cursor-wait disabled:opacity-65">
              {isSaving ? <><AppIcon name="loader" size={17} className="animate-spin" /> Actualizando...</> : "Actualizar contraseña"}
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function PasswordInput({ id, label, value, onChange, autoComplete, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; autoComplete: "current-password" | "new-password"; disabled: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <label htmlFor={id} className="min-w-0 text-[12px] font-extrabold text-[#153244]">
      {label}
      <span className="mt-2 flex min-h-11 rounded-[8px] border border-[#C7D1DA] bg-white px-3 focus-within:border-[#21AFC0] focus-within:ring-4 focus-within:ring-[#8DE2D6]/30">
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} disabled={disabled} className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none disabled:opacity-60" />
        <button type="button" onClick={() => setVisible((current) => !current)} disabled={disabled} className="flex h-11 w-11 shrink-0 items-center justify-center text-[#5F6B76] disabled:opacity-50" aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}>
          <AppIcon name={visible ? "eyeOff" : "eye"} size={19} />
        </button>
      </span>
    </label>
  );
}
