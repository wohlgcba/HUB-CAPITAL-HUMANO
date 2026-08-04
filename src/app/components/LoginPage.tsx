import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";

export function LoginPage() {
  return (
    <main className="min-h-dvh w-full overflow-x-clip bg-[#F5F7F8] font-['Archivo',sans-serif] text-[#153244] md:grid md:grid-cols-2">
      <LoginBrandPanel />
      <section className="flex min-h-[calc(100dvh-220px)] items-center justify-center px-5 py-8 sm:px-8 md:min-h-screen lg:px-12">
        <LoginForm />
      </section>
    </main>
  );
}
