import { FormEvent, useState } from "react";
import { AppIcon } from "./AppIcon";
import { PasswordInput } from "./PasswordInput";

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!email.trim()) nextErrors.email = "Ingresá tu correo institucional.";
    if (!password.trim()) nextErrors.password = "Ingresá tu contraseña.";

    setErrors(nextErrors);
    setMessage("");

    if (Object.keys(nextErrors).length > 0) return;

    if (email.trim() !== "Usuario" || password !== "Contraseña") {
      setErrors({ general: "Credenciales inválidas para la presentación." });
      return;
    }

    setMessage("Inicio de sesión pendiente de conexión con Supabase.");
    window.setTimeout(() => {
      window.location.hash = "#app";
    }, 700);
  };

  return (
    <div className="w-full max-w-[456px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[18px] border border-[#E3E8EC] bg-white px-5 py-7 shadow-[0_22px_70px_rgba(21,50,68,0.10)] sm:px-8 sm:py-9"
        noValidate
      >
        <div className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#DDF8F5] text-[#153244]">
          <AppIcon name="lock" size={32} stroke={1.7} />
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-[30px] font-extrabold leading-tight text-[#153244]">Iniciá sesión</h2>
          <p className="mt-2 text-[14px] font-semibold text-[#5F6B76]">Ingresá tus credenciales para continuar</p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="text-[13px] font-extrabold text-[#153244]">
              Correo institucional
            </label>
            <div
              className={`mt-2 flex h-14 items-center gap-3 rounded-[9px] border bg-white px-4 transition focus-within:border-[#005CB9] focus-within:ring-4 focus-within:ring-[#8DE2D6]/35 ${
                errors.email ? "border-[#C93B3B]" : "border-[#C7D1DA]"
              }`}
            >
              <AppIcon name="mail" className="shrink-0 text-[#5F6B76]" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu.nombre@buenosaires.gob.ar"
                className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#153244] outline-none placeholder:text-[#8B98A4]"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email && <p className="mt-2 text-[12px] font-semibold text-[#C93B3B]">{errors.email}</p>}
          </div>

          <PasswordInput
            value={password}
            showPassword={showPassword}
            error={errors.password}
            onChange={setPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[13px] font-bold">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 text-[#153244]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="h-[17px] w-[17px] rounded border-[#B7C3CC] accent-[#153244]"
            />
            Recordarme
          </label>
          <a
            href="#login"
            className="flex min-h-11 items-center text-[#005CB9] underline-offset-4 transition hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button
          type="submit"
          className="mt-4 flex h-14 w-full items-center justify-center rounded-[8px] bg-[#153244] text-[15px] font-extrabold text-white shadow-[0_10px_24px_rgba(21,50,68,0.18)] transition hover:bg-[#062A43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
        >
          Iniciar sesión
        </button>

        {errors.general && (
          <p className="mt-4 rounded-[8px] border border-[#F0B8B8] bg-[#FFF4F4] px-4 py-3 text-center text-[13px] font-bold text-[#C93B3B]">
            {errors.general}
          </p>
        )}

        <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-[13px] font-bold text-[#8793A0]">
          <span className="h-px bg-[#E3E8EC]" />
          o
          <span className="h-px bg-[#E3E8EC]" />
        </div>

        <button
          type="button"
          className="flex h-14 w-full items-center justify-center rounded-[8px] border border-[#C7D1DA] bg-white text-[14px] font-extrabold text-[#153244] transition hover:border-[#153244] hover:bg-[#F5F7F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
        >
          Ingresar con SSO del GCBA
        </button>

        {message && (
          <p className="mt-5 rounded-[8px] border border-[#8DE2D6] bg-[#DDF8F5] px-4 py-3 text-center text-[13px] font-bold text-[#153244]">
            {message}
          </p>
        )}
      </form>

      <p className="mt-5 px-2 text-center text-[13px] font-semibold leading-[1.45] text-[#5F6B76]">
        ¿Necesitás ayuda? Contactá a{" "}
        <a className="font-extrabold text-[#005CB9] underline-offset-4 hover:underline" href="mailto:soporte.capitalhumano@buenosaires.gob.ar">
          soporte.capitalhumano@buenosaires.gob.ar
        </a>
      </p>
    </div>
  );
}
