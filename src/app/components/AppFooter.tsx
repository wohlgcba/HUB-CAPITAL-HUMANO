import logoBAUrl from "../../../logo-BA-1-800x261.svg";

export function AppFooter() {
  return (
    <footer className="mt-auto w-full border-t border-white/15 bg-[#062A43] px-5 py-6 text-white sm:px-7">
      <div className="mx-auto flex w-full max-w-[1672px] flex-col items-start gap-5 sm:flex-row sm:items-center">
        <img src={logoBAUrl} alt="Buenos Aires Ciudad" className="h-[44px] w-auto max-w-[136px] shrink-0 object-contain brightness-0 invert" />
        <div className="hidden h-[44px] w-px bg-white/30 sm:block" />
        <div className="text-[12px] font-semibold leading-[1.2] text-white sm:text-[13px]">
          <p>Subsecretaría de</p>
          <p>Cultura Ciudadana y</p>
          <p>Responsabilidad Social</p>
        </div>
      </div>
    </footer>
  );
}
