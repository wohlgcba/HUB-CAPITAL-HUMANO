import { AppIcon } from "./AppIcon";

export function SessionLoadingScreen() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#F5F7F8] px-5 font-['Archivo',sans-serif] text-[#153244]">
      <div className="text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-[#DDF8F5]">
          <AppIcon name="lock" size={30} />
        </span>
        <p className="mt-4 text-[14px] font-extrabold">Cargando sesión...</p>
      </div>
    </main>
  );
}
