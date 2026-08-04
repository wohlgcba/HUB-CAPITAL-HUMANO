import { AppIcon } from "./AppIcon";

type PasswordInputProps = {
  value: string;
  showPassword: boolean;
  error?: string;
  onChange: (value: string) => void;
  onToggleVisibility: () => void;
};

export function PasswordInput({ value, showPassword, error, onChange, onToggleVisibility }: PasswordInputProps) {
  return (
    <div>
      <label htmlFor="password" className="text-[13px] font-extrabold text-[#153244]">
        Contraseña
      </label>
      <div
        className={`mt-2 flex h-14 items-center gap-3 rounded-[9px] border bg-white px-4 transition focus-within:border-[#005CB9] focus-within:ring-4 focus-within:ring-[#8DE2D6]/35 ${
          error ? "border-[#C93B3B]" : "border-[#C7D1DA]"
        }`}
      >
        <AppIcon name="lock" className="shrink-0 text-[#5F6B76]" />
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#153244] outline-none placeholder:text-[#8B98A4]"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#5F6B76] transition hover:bg-[#F5F7F8] hover:text-[#153244] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <AppIcon name={showPassword ? "eyeOff" : "eye"} />
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] font-semibold text-[#C93B3B]">{error}</p>}
    </div>
  );
}
