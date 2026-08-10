import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AppIcon } from "./AppIcon";

export function AuthErrorPage({ message }: { message: string }) {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F7F8] px-5 font-['Archivo',sans-serif] text-[#153244]">
      <section className="w-full max-w-[480px] rounded-[14px] border border-[#E3E8EC] bg-white p-8 text-center shadow-[0_18px_55px_rgba(21,50,68,0.10)]">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFF0C8] text-[#153244]">
          <AppIcon name="help" size={30} />
        </span>
        <h1 className="mt-5 text-[24px] font-extrabold">No pudimos validar tu acceso</h1>
        <p className="mt-3 text-[14px] font-semibold leading-relaxed text-[#5F6B76]">{message}</p>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true);
            void signOut().finally(() => setIsLoading(false));
          }}
          className="mt-6 min-h-11 rounded-[7px] bg-[#153244] px-6 text-[14px] font-extrabold text-white disabled:opacity-60"
        >
          {isLoading ? "Cerrando sesión..." : "Volver al inicio de sesión"}
        </button>
      </section>
    </main>
  );
}
