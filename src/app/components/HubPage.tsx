import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { listPublishedResourceSearchItems } from "../services/resourceService";
import { logAuditEvent } from "../services/auditService";
import { getErrorMessage } from "../services/serviceError";
import { listPublishedSections } from "../services/sectionService";
import type { HubSection } from "../types/hub";
import type { ResourceSearchItem } from "../types/resources";
import { GlobalResourceSearch } from "./GlobalResourceSearch";
import { ProjectsRow } from "./ProjectsRow";

export function HubPage() {
  const navigate = useNavigate();
  const [sections, setSections] = useState<HubSection[]>([]);
  const [resources, setResources] = useState<ResourceSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void logAuditEvent("hub_view", "hub");
    let cancelled = false;
    setIsLoading(true);
    setError("");

    void Promise.all([listPublishedSections(), listPublishedResourceSearchItems()])
      .then(([nextSections, nextResources]) => {
        if (cancelled) return;
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

  return (
    <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <GlobalResourceSearch
        resources={resources}
        loading={isLoading}
        onSelect={(resourceId) => navigate(`/recursos/${resourceId}`)}
      />

      {error ? (
        <div role="alert" className="rounded-[12px] border border-[#F0B8B8] bg-[#FFF4F4] px-5 py-4 text-[14px] font-bold text-[#C93B3B]">
          {error}
        </div>
      ) : null}

      <section aria-labelledby="hub-sections-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h1 id="hub-sections-title" className="text-[28px] font-extrabold leading-tight text-[#061947] sm:text-[32px]">Secciones</h1>
          {!isLoading && !error ? <span className="text-[12px] font-bold text-[#5F6B76]">{sections.length} secciones</span> : null}
        </div>
        {error ? null : (
          <ProjectsRow
            sections={sections}
            loading={isLoading}
            totalCount={sections.length}
            onOpenSection={(slug) => navigate(`/secciones/${slug}`)}
          />
        )}
      </section>
    </main>
  );
}
