import { FormEvent, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/serviceError";
import { AppIcon } from "./AppIcon";

export function ChangePasswordPage() {
  const { changePassword, isPasswordRecovery, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsLoading(true);
    try {
      await changePassword(password);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "No se pudo actualizar la contraseña."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F7F8] px-5 py-8 font-['Archivo',sans-serif] text-[#153244]">
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="w-full max-w-[456px] rounded-[18px] border border-[#E3E8EC] bg-white px-5 py-7 shadow-[0_22px_70px_rgba(21,50,68,0.10)] sm:px-8 sm:py-9"
      >
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF8F5]">
          <AppIcon name="lock" size={32} />
        </span>
        <h1 className="mt-5 text-center text-[28px] font-extrabold leading-tight">
          {isPasswordRecovery ? "Creá una nueva contraseña" : "Cambiá tu contraseña"}
        </h1>
        <p className="mt-2 text-center text-[14px] font-semibold leading-relaxed text-[#5F6B76]">
          {isPasswordRecovery
            ? "Ingresá una contraseña nueva para recuperar el acceso."
            : "Por seguridad, reemplazá tu contraseña inicial antes de continuar."}
        </p>

        <div className="mt-7 space-y-4">
          <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} />
          <PasswordField label="Repetir contraseña" value={confirmation} onChange={setConfirmation} />
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-[13px] font-bold text-[#C93B3B]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 flex min-h-14 w-full items-center justify-center rounded-[8px] bg-[#153244] px-5 text-[15px] font-extrabold text-white disabled:cursor-wait disabled:opacity-65"
        >
          {isLoading ? "Actualizando..." : "Guardar contraseña"}
        </button>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 min-h-11 w-full text-[13px] font-extrabold text-[#005CB9]"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}

function PasswordField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label className="text-[13px] font-extrabold text-[#153244]">
        {label}
        <span className="mt-2 flex min-h-14 items-center rounded-[9px] border border-[#C7D1DA] bg-white px-4 focus-within:border-[#005CB9] focus-within:ring-4 focus-within:ring-[#8DE2D6]/35">
          <input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold outline-none"
          />
          <button
            type="button"
            onClick={() => setVisible((current) => !current)}
            className="flex h-11 w-11 items-center justify-center"
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <AppIcon name={visible ? "eyeOff" : "eye"} size={20} />
          </button>
        </span>
      </label>
    </div>
  );
}
