import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { useAuth } from "./context/AuthContext";
import type { UserProfile } from "./types/auth";
import { AppHeader } from "./components/AppHeader";
import { AdminHubPage } from "./components/AdminHubPage";
import { AuthErrorPage } from "./components/AuthErrorPage";
import { ChangePasswordPage } from "./components/ChangePasswordPage";
import { HubPage } from "./components/HubPage";
import { LoginPage } from "./components/LoginPage";
import { MainTabs } from "./components/MainTabs";
import { SessionLoadingScreen } from "./components/SessionLoadingScreen";

const DirectoryPage = lazy(() => import("./components/DirectoryPage").then((module) => ({ default: module.DirectoryPage })));
const AdminMetricsPage = lazy(() => import("./components/AdminMetricsPage").then((module) => ({ default: module.AdminMetricsPage })));
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
  const isAdmin = profile.role === "admin";
  const activeTab = getActiveTab(location.pathname);

  const handleTabChange = (tab: string) => {
    const routes: Record<string, string> = isAdmin
      ? { hub: "/", directorio: "/directorio", metricas: "/metricas" }
      : { hub: "/", directorio: "/directorio", mapa: "/mapa" };
    navigate(routes[tab] ?? "/");
  };

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-clip bg-[#F5F7F8] font-['Archivo',sans-serif] text-[#153244]">
      <AppHeader profile={profile} onLogout={onLogout} />
      <MainTabs active={activeTab} isAdmin={isAdmin} onChange={handleTabChange} />
      <Suspense fallback={<RouteLoading />}>
        <Routes>
          <Route path="/" element={isAdmin ? <AdminHubPage /> : <HubPage />} />
          <Route path="/directorio" element={<DirectoryPage />} />
          <Route path="/mapa" element={isAdmin ? <Navigate to="/" replace /> : <MapPage />} />
          <Route path="/metricas" element={isAdmin ? <AdminMetricsPage /> : <Navigate to="/" replace />} />
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
  if (pathname.startsWith("/metricas")) return "metricas";
  return "hub";
}
