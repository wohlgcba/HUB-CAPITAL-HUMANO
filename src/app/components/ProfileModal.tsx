import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { getMyProfileDetails, saveMyProfileAvatar } from "../services/profileService";
import { getErrorMessage } from "../services/serviceError";
import type { MyProfileDetails } from "../types/profile";
import { AppIcon } from "./AppIcon";
import { ProfileAvatarUploader } from "./ProfileAvatarUploader";
import { ProfileInfoCard } from "./ProfileInfoCard";
import { ProfilePasswordForm } from "./ProfilePasswordForm";

const focusableSelector =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

type ProfileModalProps = {
  onClose: () => void;
  onAvatarChange?: (avatarUrl: string | null) => void;
};

export function ProfileModal({ onClose, onAvatarChange }: ProfileModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const isBusyRef = useRef(false);
  const [profile, setProfile] = useState<MyProfileDetails | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);
  const [error, setError] = useState("");
  const isBusy = isSaving || isPasswordSaving;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    isBusyRef.current = isBusy;
  }, [isBusy]);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const details = await getMyProfileDetails();
      setProfile(details);
      onAvatarChange?.(details.avatarUrl);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "No se pudo cargar tu perfil."));
    } finally {
      setIsLoading(false);
    }
  }, [onAvatarChange]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isBusyRef.current) onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleTrapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const elements = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
    if (elements.length === 0) return;
    if (event.shiftKey && document.activeElement === elements[0]) {
      event.preventDefault();
      elements.at(-1)?.focus();
    } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
      event.preventDefault();
      elements[0].focus();
    }
  };

  const handleSave = async () => {
    if (!profile || !selectedFile || isSaving) return;

    setIsSaving(true);
    try {
      const avatar = await saveMyProfileAvatar(profile, selectedFile);
      setProfile((current) => current ? { ...current, ...avatar } : current);
      setSelectedFile(null);
      onAvatarChange?.(avatar.avatarUrl);
      window.dispatchEvent(new CustomEvent("profile-avatar-updated", {
        detail: { directoryPersonId: profile.directoryPersonId, avatarUrl: avatar.avatarUrl },
      }));
      toast.success("Foto de perfil actualizada", { description: "El cambio ya está guardado en tu perfil." });
    } catch (saveError) {
      toast.error("No se pudo guardar la foto", { description: getErrorMessage(saveError, "Intentá nuevamente.") });
    } finally {
      setIsSaving(false);
    }
  };

  const closeIfAvailable = () => {
    if (!isBusy) onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#061947]/60 p-0 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeIfAvailable(); }}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
        aria-describedby="profile-modal-description"
        aria-busy={isLoading || isBusy}
        onKeyDown={handleTrapFocus}
        className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.32)] sm:h-auto sm:max-h-[calc(100dvh-40px)] sm:max-w-[1040px] sm:rounded-[14px] sm:border sm:border-[#D8E0E6]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#D8E0E6] px-5 py-4 sm:px-8 sm:py-5">
          <h2 id="profile-modal-title" className="text-[24px] font-extrabold text-[#061947]">Mi perfil</h2>
          <button ref={closeButtonRef} type="button" onClick={closeIfAvailable} disabled={isBusy} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#C7D1DA] hover:bg-[#F5F7F8] disabled:opacity-50" aria-label="Cerrar Mi perfil"><AppIcon name="x" size={23} /></button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-7">
            {isLoading ? <ProfileModalSkeleton /> : error || !profile ? (
              <div role="alert" className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3BF]"><AppIcon name="alert" size={26} /></span>
                <h3 className="mt-4 text-[19px] font-extrabold">No pudimos cargar tu perfil</h3>
                <p className="mt-2 max-w-[520px] text-[13px] font-semibold text-[#5F6B76]">{error}</p>
                <button type="button" onClick={() => void loadProfile()} className="mt-5 min-h-11 rounded-[6px] border border-[#0072BC] px-5 text-[13px] font-extrabold text-[#0072BC]">Reintentar</button>
              </div>
            ) : (
              <>
                <section className="grid gap-6 border-b border-[#D8E0E6] pb-7 sm:grid-cols-[230px_minmax(0,1fr)] sm:items-center">
                  <ProfileAvatarUploader
                    fullName={profile.fullName}
                    avatarUrl={profile.avatarUrl}
                    selectedFile={selectedFile}
                    disabled={isBusy}
                    onSelect={setSelectedFile}
                    onValidationError={(message) => toast.error("Foto no válida", { description: message })}
                  />
                  <div className="min-w-0 text-center sm:text-left">
                    <h3 className="text-[clamp(25px,4vw,34px)] font-extrabold leading-tight text-[#061947]">{profile.fullName}</h3>
                    <p className="mt-3 break-words text-[13px] font-extrabold uppercase leading-snug text-[#153244]">{profile.area || "Sin especificar"}</p>
                    <p className="mt-2 text-[15px] font-semibold text-[#5F6B76]">{profile.jobRole || "Sin especificar"}</p>
                  </div>
                </section>

                <ProfileSection title="Información personal">
                  <div className="grid gap-3 sm:grid-cols-2"><ProfileInfoCard icon="phone" label="Celular" value={profile.phone} /><ProfileInfoCard icon="mail" label="Mail" value={profile.email} /></div>
                </ProfileSection>

                <ProfileSection title="Ubicación">
                  <ProfileInfoCard icon="building" label="Edificio GCBA" value={profile.building} />
                </ProfileSection>

                <ProfileSection title="Datos de acceso">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileInfoCard icon="clipboard" label="CUIT" value={profile.cuit} />
                    <ProfileInfoCard icon="usersGroup" label="Rol del sistema" value={profile.systemRole === "admin" ? "Administrador" : "Usuario"} />
                    <ProfileInfoCard icon="check" label="Estado" value={profile.isActive ? "Activo" : "Inactivo"} />
                  </div>
                  <ProfilePasswordForm mustChangePassword={profile.mustChangePassword} disabled={isLoading || isSaving} onSavingChange={setIsPasswordSaving} />
                </ProfileSection>

                <ProfileSection title="Preferencias">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileInfoCard icon="user" label="Foto de perfil" value={selectedFile ? "Cambio pendiente de guardar" : profile.avatarPath ? "Foto establecida" : "Sin foto establecida"} />
                    <ProfileInfoCard icon="bell" label="Notificaciones por correo" value={profile.emailNotificationsEnabled === null ? "Sin especificar" : profile.emailNotificationsEnabled ? "Activadas" : "Desactivadas"} />
                  </div>
                </ProfileSection>

                <div id="profile-modal-description" className="mt-6 flex gap-3 rounded-[9px] border border-[#8DE2D6] bg-[#DDF8F5] px-4 py-3 text-[13px] font-bold leading-relaxed text-[#153244]">
                  <AppIcon name="help" size={20} className="mt-0.5 shrink-0" />
                  <span>Información de uso interno. Mantené tus datos actualizados y no compartas credenciales ni datos sensibles.</span>
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-[#D8E0E6] bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
            <button type="button" onClick={closeIfAvailable} disabled={isBusy} className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-6 text-[13px] font-extrabold text-[#153244] hover:bg-[#F5F7F8] disabled:opacity-50">Cerrar</button>
            <button type="button" onClick={() => void handleSave()} disabled={!selectedFile || isLoading || isBusy || Boolean(error)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#153244] px-6 text-[13px] font-extrabold text-white hover:bg-[#0D2433] disabled:cursor-not-allowed disabled:bg-[#AAB4BC]">
              {isSaving ? <><AppIcon name="loader" size={18} className="animate-spin" /> Guardando...</> : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ProfileSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-7"><h4 className="mb-3 text-[14px] font-extrabold uppercase text-[#153244]">{title}</h4>{children}</section>;
}

function ProfileModalSkeleton() {
  return <div className="space-y-5" aria-label="Cargando perfil"><div className="h-[190px] animate-pulse rounded-[10px] bg-[#E8EEF2]" /><div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-[86px] animate-pulse rounded-[9px] bg-[#E8EEF2]" />)}</div></div>;
}
