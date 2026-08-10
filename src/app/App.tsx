import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import type { UserProfile } from "./types/auth";
import { AppHeader } from "./components/AppHeader";
import { AuthErrorPage } from "./components/AuthErrorPage";
import { ChangePasswordPage } from "./components/ChangePasswordPage";
import { HubPage } from "./components/HubPage";
import { LoginPage } from "./components/LoginPage";
import { MainTabs } from "./components/MainTabs";
import { SessionLoadingScreen } from "./components/SessionLoadingScreen";

const DirectoryPage = lazy(() => import("./components/DirectoryPage").then((module) => ({ default: module.DirectoryPage })));
const MapPage = lazy(() => import("./components/MapPage").then((module) => ({ default: module.MapPage })));
const ResourceViewerPage = lazy(() => import("./components/ResourceViewerPage").then((module) => ({ default: module.ResourceViewerPage })));
const SectionDetailPage = lazy(() => import("./components/SectionDetailPage").then((module) => ({ default: module.SectionDetailPage })));

export default function App() {
  const auth = useAuth();

  if (auth.status === "loading") return <SessionLoadingScreen />;
  if (auth.status === "unauthenticated") return <LoginPage />;
  if (auth.status === "error") return <AuthErrorPage message={auth.error} />;
  if (auth.profile.mustChangePassword || auth.isPasswordRecovery) return <ChangePasswordPage />;

  return <AuthenticatedApp profile={auth.profile} onLogout={auth.signOut} />;
}

function AuthenticatedApp({ profile, onLogout }: { profile: UserProfile; onLogout: () => Promise<void> }) {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = getActiveTab(location.pathname);

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = { hub: "/", directorio: "/directorio", mapa: "/mapa" };
    navigate(routes[tab] ?? "/");
  };

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-clip bg-[#F5F7F8] font-['Archivo',sans-serif] text-[#153244]">
      <AppHeader profile={profile} onLogout={onLogout} />
      <MainTabs active={activeTab} onChange={handleTabChange} />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/directorio" element={<DirectoryPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/secciones/:slug" element={<SectionDetailPage />} />
          <Route path="/recursos/:resourceId" element={<ResourceViewerPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  );
}

function RouteLoading() {
  return <div className="mx-auto mt-5 h-[540px] w-[calc(100%-32px)] max-w-[1400px] animate-pulse rounded-[12px] bg-[#E8EEF2]" aria-label="Cargando contenido" />;
}

function getActiveTab(pathname: string) {
  if (pathname.startsWith("/directorio")) return "directorio";
  if (pathname.startsWith("/mapa")) return "mapa";
  return "hub";
}
