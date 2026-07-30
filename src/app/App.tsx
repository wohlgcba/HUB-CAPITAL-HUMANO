import { Header } from "./components/Header";
import { MainTabs } from "./components/MainTabs";
import { HeroCard } from "./components/HeroCard";
import { SearchPanel } from "./components/SearchPanel";
import { QuickAccessPanel } from "./components/QuickAccessPanel";
import { ProjectsRow } from "./components/ProjectsRow";
import { RecentResources } from "./components/RecentResources";
import { NewsPanel } from "./components/NewsPanel";

export default function App() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#F5F7F8", fontFamily: "'Archivo', sans-serif" }}
    >
      {/* Header */}
      <Header />

      {/* Tabs */}
      <MainTabs />

      {/* Main content */}
      <main className="flex-1 flex flex-col gap-3 p-4 overflow-auto">
        {/* First row: Hero + Search + Quick access */}
        <div className="flex gap-3 items-stretch">
          <HeroCard />
          <SearchPanel />
          <QuickAccessPanel />
        </div>

        {/* Projects row */}
        <ProjectsRow />

        {/* Bottom row: Recent resources + News */}
        <div className="flex gap-3 items-stretch">
          <RecentResources />
          <NewsPanel />
        </div>
      </main>
    </div>
  );
}
