import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { getHubStats } from "../services/hubService";
import { getRecentResources } from "../services/resourceService";
import { getErrorMessage } from "../services/serviceError";
import { listPublishedSections } from "../services/sectionService";
import type { HubSection, HubStats } from "../types/hub";
import type { RecentResource } from "../types/resources";
import { HeroCard } from "./HeroCard";
import { ProjectsRow } from "./ProjectsRow";
import { RecentResources } from "./RecentResources";
import { SearchPanel } from "./SearchPanel";

export function HubPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HubStats | null>(null);
  const [sections, setSections] = useState<HubSection[]>([]);
  const [resources, setResources] = useState<RecentResource[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");

    void Promise.all([getHubStats(), listPublishedSections(), getRecentResources(5)])
      .then(([nextStats, nextSections, nextResources]) => {
        if (cancelled) return;
        setStats(nextStats);
        setSections(nextSections);
        setResources(nextResources);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(getErrorMessage(loadError, "No se pudo cargar el HUB."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(sections.map((section) => section.category).filter(Boolean))],
    [sections],
  );
  const visibleSections = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLocaleLowerCase("es-AR");
    return sections.filter((section) => {
      const matchesCategory = !category || section.category === category;
      const searchable = `${section.title} ${section.description} ${section.category}`.toLocaleLowerCase("es-AR");
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [category, deferredQuery, sections]);

  return (
    <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1888px]">
        <HeroCard stats={stats} loading={isLoading} />
      </div>
      <div className="mx-auto w-full max-w-[1888px] rounded-[14px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
        <SearchPanel
          embedded
          query={query}
          activeCategory={category}
          categories={categories}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
        />
        <div className="mt-5">
          {error ? (
            <p className="border-t border-[#E3E8EC] pt-5 text-[14px] font-bold text-[#5F6B76]">Los contenidos no están disponibles en este momento.</p>
          ) : (
            <RecentResources
              embedded
              resources={resources}
              loading={isLoading}
              onOpen={(resourceId) => navigate(`/recursos/${resourceId}`)}
            />
          )}
        </div>
      </div>
      {error ? (
        <div role="alert" className="rounded-[12px] border border-[#F0B8B8] bg-[#FFF4F4] px-5 py-4 text-[14px] font-bold text-[#C93B3B]">
          {error}
        </div>
      ) : null}
      <div className="mx-auto w-full max-w-[1888px]">
        {error ? null : (
          <ProjectsRow
            sections={visibleSections}
            loading={isLoading}
            totalCount={sections.length}
            onOpenSection={(slug) => navigate(`/secciones/${slug}`)}
          />
        )}
      </div>
    </main>
  );
}
