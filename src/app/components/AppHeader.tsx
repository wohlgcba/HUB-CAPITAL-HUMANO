import { useEffect, useRef, useState } from "react";
import logoBAUrl from "../../../logo-BA-1-800x261.svg";
import type { UserProfile } from "../types/auth";
import { AppIcon } from "./AppIcon";

type AppHeaderProps = {
  profile: UserProfile;
  onLogout: () => Promise<void>;
};

export function AppHeader({ profile, onLogout }: AppHeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const initials = getInitials(profile.fullName);
  const roleLabel = profile.role === "admin" ? "Administrador" : "Integrante";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="relative z-50 h-auto min-h-[76px] w-screen max-w-full shrink-0 bg-[#062A43] px-3 text-white sm:min-h-[88px] sm:px-5 lg:px-7">
      <div className="mx-auto grid min-h-[76px] w-full max-w-[1672px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:min-h-[88px] sm:justify-between sm:gap-3 lg:gap-5">
        <div className="contents min-w-0 sm:flex sm:items-center sm:gap-3 lg:gap-5">
          <BuenosAiresLogo />
          <div className="hidden h-[45px] w-px bg-white/30 sm:block" />
          <div className="hidden max-w-[190px] text-[12px] font-semibold leading-[1.12] text-white md:block xl:text-[14px]">
            <p>Subsecretaría de</p>
            <p>Cultura Ciudadana y</p>
            <p>Responsabilidad Social</p>
          </div>
          <div className="hidden h-[45px] w-px bg-white/30 lg:block" />
          <div className="min-w-0 py-3 sm:py-4">
            <h1 className="truncate text-[clamp(19px,4.1vw,24px)] font-extrabold leading-tight tracking-0 sm:text-[clamp(26px,2.8vw,34px)]">
              <span className="sm:hidden">RED ENLACES</span>
              <span className="hidden sm:inline">RED ENLACES CAPITAL HUMANO</span>
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-self-end gap-1 sm:gap-2 lg:gap-7">
          <button className="flex h-11 w-11 items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white md:w-auto md:px-1">
            <span className="relative">
              <AppIcon name="bell" />
              <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-[#FFCC00]" />
            </span>
            <span className="hidden md:inline">Novedades</span>
          </button>
          <button className="flex h-11 w-11 items-center justify-center gap-2 rounded-full text-[14px] font-semibold text-white md:w-auto md:px-1">
            <AppIcon name="help" />
            <span className="hidden md:inline">Ayuda</span>
          </button>
          <div className="hidden h-[45px] w-px bg-white/30 lg:block" />
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((current) => !current)}
              className="flex min-h-11 items-center gap-2 rounded-[10px] text-left transition hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 lg:gap-4 lg:px-1"
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[13px] font-extrabold text-[#153244] sm:h-[48px] sm:w-[48px] sm:text-[15px]">
                {initials}
              </span>
              <span className="hidden leading-tight xl:block">
                <span className="block text-[16px] font-extrabold">{profile.fullName}</span>
                <span className="block text-[13px] font-normal text-white/80">{roleLabel}</span>
              </span>
              <AppIcon
                name="chevronDown"
                size={18}
                className={`hidden transition-transform sm:block ${isUserMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-3 w-[238px] overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white text-[#153244] shadow-[0_18px_45px_rgba(6,42,67,0.20)]"
              >
                <div className="flex items-center gap-3 border-b border-[#E3E8EC] px-4 py-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#DDF8F5] text-[13px] font-extrabold text-[#153244]">
                    {initials}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block truncate text-[14px] font-extrabold">{profile.fullName}</span>
                    <span className="block text-[12px] font-semibold text-[#5F6B76]">{roleLabel}</span>
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  disabled={isLoggingOut}
                  className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-extrabold transition hover:bg-[#F5F7F8] focus-visible:bg-[#F5F7F8] focus-visible:outline-none"
                >
                  <AppIcon name="logout" />
                  {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function getInitials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function BuenosAiresLogo() {
  return (
    <img
      src={logoBAUrl}
      alt="Buenos Aires Ciudad"
      className="h-[32px] w-auto max-w-[98px] shrink-0 object-contain brightness-0 invert sm:h-[48px] sm:max-w-[147px]"
    />
  );
}
