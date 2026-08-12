import logoBAUrl from "../../../logo-BA-1-800x261.svg";
import { AppIcon } from "./AppIcon";

export function LoginBrandPanel() {
  return (
    <section className="relative isolate flex min-h-[220px] overflow-hidden bg-[#062A43] px-5 py-6 text-white md:min-h-screen md:px-8 lg:px-12 xl:px-16">
      <div className="relative z-10 flex w-full max-w-[620px] flex-col md:justify-between">
        <div>
          <div className="flex items-center gap-4 md:gap-5">
            <img
              src={logoBAUrl}
              alt="Buenos Aires Ciudad"
              className="h-[42px] w-auto max-w-[128px] shrink-0 object-contain brightness-0 invert md:h-[52px] md:max-w-[160px]"
            />
            <div className="h-[44px] w-px bg-white/35 md:h-[52px]" />
            <div className="max-w-[205px] text-[12px] font-semibold leading-[1.12] md:text-[15px]">
              <p>Subsecretaría</p>
              <p>Cultura Ciudadana y</p>
              <p>Responsabilidad Social</p>
            </div>
          </div>

          <div className="mt-10 md:mt-24 lg:mt-28">
            <h1 className="max-w-[620px] text-[clamp(28px,5.8vw,56px)] font-extrabold leading-[1.03] tracking-0">
              HUB <span className="text-[#FFCC00]">|</span> RED ENLACES
              <br />
              CAPITAL HUMANO <span className="text-[#FFCC00]">|</span> 2026
            </h1>
          </div>
        </div>
      </div>

      <BrandDecoration />
    </section>
  );
}

function BrandDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden="true">
      <svg className="absolute bottom-[-80px] right-[-110px] h-[520px] w-[520px] text-white/25" viewBox="0 0 520 520" fill="none">
        <path d="M60 430C130 220 285 88 496 38" stroke="currentColor" strokeWidth="1.1" />
        <path d="M14 390C102 188 242 94 436 108" stroke="currentColor" strokeWidth="1.1" />
        <path d="M118 498C144 324 257 206 458 164" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="254" cy="274" r="168" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="332" cy="244" r="115" stroke="currentColor" strokeWidth="1.1" />
      </svg>

      <div className="absolute right-[9%] top-[14%] grid grid-cols-12 gap-[8px] opacity-70">
        {Array.from({ length: 120 }).map((_, index) => (
          <span key={index} className="h-[2px] w-[2px] rounded-full bg-[#8DE2D6]/70" />
        ))}
      </div>

      <div className="absolute bottom-[16%] right-[18%] flex h-[150px] w-[150px] items-center justify-center rounded-full bg-[#8DE2D6] shadow-[0_18px_70px_rgba(141,226,214,0.22)]">
        <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full bg-[#FFCC00] text-[#153244]">
          <AppIcon name="usersGroup" size={44} stroke={1.8} />
        </div>
      </div>
      <div className="absolute bottom-[7%] right-[-52px] h-[245px] w-[245px] rounded-full bg-[#4BD4DF]/70" />
      <div className="absolute bottom-[28%] right-[34%] h-[110px] w-[110px] rounded-full bg-[#4BD4DF]/18" />
      <div className="absolute right-[11%] top-[33%] h-[64px] w-[64px] rounded-full bg-white/10" />
      <div className="absolute right-[18%] top-[27%] h-[42px] w-[42px] rounded-full bg-white/8" />
    </div>
  );
}
