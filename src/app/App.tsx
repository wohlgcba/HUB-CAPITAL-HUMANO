import { useEffect, useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { MainTabs } from "./components/MainTabs";
import { DirectoryPage } from "./components/DirectoryPage";
import { MapPage } from "./components/MapPage";
import { LoginPage } from "./components/LoginPage";
import { HeroCard } from "./components/HeroCard";
import { SearchPanel } from "./components/SearchPanel";
import { ProjectsRow } from "./components/ProjectsRow";
import { RecentResources } from "./components/RecentResources";

export default function App() {
  const [activeTab, setActiveTab] = useState("hub");
  const [route, setRoute] = useState(() => (typeof window !== "undefined" && window.location.hash === "#app" ? "app" : "login"));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash === "#app" ? "app" : "login");
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "login") {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen w-screen max-w-full overflow-x-clip bg-[#F5F7F8] font-['Archivo',sans-serif] text-[#153244]">
      <AppHeader />
      <MainTabs active={activeTab} onChange={setActiveTab} />
      {activeTab === "mapa" ? (
        <MapPage />
      ) : activeTab === "directorio" ? (
        <DirectoryPage />
      ) : (
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
          <ProjectsRow />
        </div>
      </main>
      )}
    </div>
  );
}
