import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNotifications } from "../context/NotificationContext";
import type { UserProfile } from "../types/auth";
import { AppIcon } from "./AppIcon";
import { ProfileModal } from "./ProfileModal";

const NotificationsModal = lazy(() => import("./NotificationsModal").then((module) => ({ default: module.NotificationsModal })));

type AppHeaderProps = {
  profile: UserProfile;
  onLogout: () => Promise<void>;
};

export function AppHeader({ profile, onLogout }: AppHeaderProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationsButtonRef = useRef<HTMLButtonElement>(null);
  const initials = getInitials(profile.fullName);
  const roleLabel = profile.role === "admin" ? "Administrador" : "Integrante";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!userMenuRef.current?.contains(event.target as Node)) setIsUserMenuOpen(false);
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

  const handleOpenProfile = () => {
    setIsUserMenuOpen(false);
    setIsProfileOpen(true);
  };

  const handleOpenHelp = () => {
    setIsUserMenuOpen(false);
    navigate("/ayuda");
  };

  const handleCloseProfile = useCallback(() => {
    setIsProfileOpen(false);
    window.setTimeout(() => userMenuButtonRef.current?.focus(), 0);
  }, []);

  const handleCloseNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
    window.setTimeout(() => notificationsButtonRef.current?.focus(), 0);
  }, []);

  return (
    <>
      <header className="relative z-50 min-h-[76px] w-screen max-w-full shrink-0 bg-[#062A43] px-3 text-white sm:min-h-[88px] sm:px-5 lg:px-7">
        <div className="mx-auto flex min-h-[76px] w-full max-w-[1672px] items-center justify-between gap-2 sm:min-h-[88px] sm:gap-4">
          <div className="min-w-0 flex-1 py-3 sm:py-4">
            <h1 className="max-w-[980px] text-[17px] font-extrabold leading-[1.1] sm:text-[25px] lg:text-[34px]">
              RED ENLACES CAPITAL HUMANO
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-5">
            <button
              ref={notificationsButtonRef}
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isNotificationsOpen}
              aria-label={unreadCount > 0 ? `Novedades, ${unreadCount} sin leer` : "Novedades"}
              className={`flex h-11 w-11 items-center justify-center rounded-[8px] text-white transition hover:bg-white/10 ${isNotificationsOpen ? "bg-white/10" : ""}`}
            >
              <span className="relative">
                <AppIcon name="bell" />
                {unreadCount > 0 ? <span className="absolute -right-2.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFCC00] px-1 text-[9px] font-extrabold leading-none text-[#153244]">{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
              </span>
            </button>

            <div className="hidden h-[45px] w-px bg-white/30 lg:block" />
            <div ref={userMenuRef} className="relative">
              <button
                ref={userMenuButtonRef}
                type="button"
                onClick={() => setIsUserMenuOpen((current) => !current)}
                className="flex min-h-11 items-center gap-2 rounded-[10px] text-left transition hover:bg-white/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80 lg:gap-4 lg:px-1"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-[13px] font-extrabold text-[#153244] sm:h-[48px] sm:w-[48px] sm:text-[15px]">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
                </span>
                <span className="hidden leading-tight xl:block">
                  <span className="block text-[16px] font-extrabold">{profile.fullName}</span>
                  <span className="block text-[13px] font-normal text-white/80">{roleLabel}</span>
                </span>
                <AppIcon name="chevronDown" size={18} className={`hidden transition-transform sm:block ${isUserMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {isUserMenuOpen ? (
                <div role="menu" className="absolute right-0 top-full mt-3 w-[238px] overflow-hidden rounded-[12px] border border-[#E3E8EC] bg-white text-[#153244] shadow-[0_18px_45px_rgba(6,42,67,0.20)]">
                  <div className="flex items-center gap-3 border-b border-[#E3E8EC] px-4 py-3">
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#DDF8F5] text-[13px] font-extrabold text-[#153244]">
                      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[14px] font-extrabold">{profile.fullName}</span>
                      <span className="block text-[12px] font-semibold text-[#5F6B76]">{roleLabel}</span>
                    </span>
                  </div>
                  <MenuButton icon="user" label="Mi perfil" onClick={handleOpenProfile} />
                  <MenuButton icon="help" label="Ayuda" onClick={handleOpenHelp} />
                  <MenuButton icon="logout" label={isLoggingOut ? "Cerrando..." : "Cerrar sesión"} onClick={() => void handleLogout()} disabled={isLoggingOut} last />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      {isProfileOpen ? <ProfileModal onClose={handleCloseProfile} onAvatarChange={setAvatarUrl} /> : null}
      {isNotificationsOpen ? <Suspense fallback={null}><NotificationsModal onClose={handleCloseNotifications} /></Suspense> : null}
    </>
  );
}

function MenuButton({ icon, label, onClick, disabled = false, last = false }: { icon: "user" | "help" | "logout"; label: string; onClick: () => void; disabled?: boolean; last?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-[14px] font-extrabold transition hover:bg-[#F5F7F8] focus-visible:bg-[#F5F7F8] focus-visible:outline-none disabled:opacity-50 ${last ? "" : "border-b border-[#E3E8EC]"}`}
    >
      <AppIcon name={icon} />
      {label}
    </button>
  );
}

function getInitials(fullName: string) {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
