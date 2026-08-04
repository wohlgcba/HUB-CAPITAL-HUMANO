import { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router";
import { AppHeader } from "./components/AppHeader";
import { MainTabs } from "./components/MainTabs";
import { DirectoryPage } from "./components/DirectoryPage";
import { MapPage } from "./components/MapPage";
import { LoginPage } from "./components/LoginPage";
import { HeroCard } from "./components/HeroCard";
import { SearchPanel } from "./components/SearchPanel";
import { ProjectsRow } from "./components/ProjectsRow";
import { RecentResources } from "./components/RecentResources";
import { SectionDetailPage } from "./components/SectionDetailPage";

export default function App() {
  const [activeTab, setActiveTab] = useState("hub");
  const location = useLocation();
  const navigate = useNavigate();
  const [route, setRoute] = useState(() => {
    if (typeof window === "undefined") return "login";
    return window.location.hash === "#app" || window.location.pathname.startsWith("/secciones/") ? "app" : "login";
  });

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash === "#app" || window.location.pathname.startsWith("/secciones/") ? "app" : "login");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "login") {
    return <LoginPage />;
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (location.pathname.startsWith("/secciones/")) {
      navigate("/");
    }
  };

  const handleOpenSection = (slug: string) => {
    setActiveTab("hub");
    navigate(`/secciones/${slug}`);
  };

  const handleBackToHub = () => {
    setActiveTab("hub");
    navigate("/");
  };

  const renderHomeContent = () => {
    if (activeTab === "mapa") {
      return <MapPage />;
    }

    if (activeTab === "directorio") {
      return <DirectoryPage />;
    }

    return (
      <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1888px]">
          <HeroCard />
        </div>
        <div className="mx-auto w-full max-w-[1888px] rounded-[14px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
          <SearchPanel embedded />
          <div className="mt-5">
            <RecentResources embedded />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1888px]">
          <ProjectsRow onOpenSection={handleOpenSection} />
        </div>
      </main>
    );
  };

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-clip bg-[#F5F7F8] font-['Archivo',sans-serif] text-[#153244]">
      <AppHeader />
      <MainTabs active={activeTab} onChange={handleTabChange} />
      <Routes>
        <Route path="/secciones/:slug" element={<SectionDetailPage onBack={handleBackToHub} />} />
        <Route path="*" element={renderHomeContent()} />
      </Routes>
    </div>
  );
}
