import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { logAuditEvent } from "../services/auditService";
import { listHelpFaqs } from "../services/helpService";
import { getErrorMessage } from "../services/serviceError";
import type { HelpFaq } from "../types/help";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";
import { HelpFaqFormDialog } from "./HelpFaqFormDialog";

export function HelpPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAdmin = auth.profile?.role === "admin";
  const [query, setQuery] = useState("");
  const [topics, setTopics] = useState<HelpFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<HelpFaq | null>(null);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setTopics(await listHelpFaqs(isAdmin));
    } catch (error) {
      setLoadError(getErrorMessage(error, "No se pudieron cargar las preguntas frecuentes."));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void loadTopics();
    void logAuditEvent("help_view", "help");
  }, [loadTopics]);

  const visibleTopics = useMemo(() => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return topics;
    return topics.filter((topic) =>
      normalize(`${topic.title} ${topic.content} ${topic.category}`).includes(normalizedQuery),
    );
  }, [query, topics]);

  const nextSortOrder = useMemo(
    () => topics.reduce((maximum, topic) => Math.max(maximum, topic.sortOrder), 0) + 10,
    [topics],
  );

  const openCreateForm = () => {
    setEditingFaq(null);
    setFormOpen(true);
  };

  const openEditForm = (faq: HelpFaq) => {
    setEditingFaq(faq);
    setFormOpen(true);
  };

  const handleSaved = (savedFaq: HelpFaq) => {
    setTopics((current) =>
      [...current.filter((topic) => topic.id !== savedFaq.id), savedFaq].sort(compareHelpFaqs),
    );
    setFormOpen(false);
    setEditingFaq(null);
    void logAuditEvent(editingFaq ? "help_faq_updated" : "help_faq_created", "help_faq", savedFaq.id);
  };

  return (
    <main className="mx-auto w-screen max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 border-b border-[#D8E0E6] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase text-[#5F6B76]">Centro de asistencia</p>
          <h1 className="mt-1 text-[30px] font-extrabold leading-tight text-[#153244]">Ayuda</h1>
          <p className="mt-2 max-w-[720px] text-[14px] font-semibold text-[#5F6B76]">
            Información para resolver consultas sobre el acceso y el uso institucional del HUB.
          </p>
        </div>
        {isAdmin ? (
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-4 text-[13px] font-extrabold text-white shadow-[0_2px_6px_rgba(0,114,188,0.18)] hover:bg-[#005F9E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
          >
            <AppIcon name="plus" size={18} />
            Añadir pregunta frecuente
          </button>
        ) : null}
      </div>

      <div className="mt-5 flex min-h-12 items-center gap-3 rounded-[8px] border border-[#C7D1DA] bg-white px-4 shadow-[0_1px_4px_rgba(21,50,68,0.03)] focus-within:border-[#21AFC0] focus-within:ring-4 focus-within:ring-[#8DE2D6]/30">
        <AppIcon name="search" size={21} className="shrink-0 text-[#153244]" />
        <label htmlFor="help-search" className="sr-only">Buscar en Ayuda</label>
        <input
          id="help-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#153244] outline-none placeholder:text-[#77838E] disabled:cursor-wait"
          placeholder="Buscar una consulta..."
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            title="Limpiar búsqueda"
            className="inline-flex size-11 items-center justify-center text-[#5F6B76] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
          >
            <AppIcon name="x" size={18} />
          </button>
        ) : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-[10px] border border-[#D8E0E6] bg-white shadow-[0_2px_10px_rgba(21,50,68,0.04)]" aria-labelledby="help-faq-title">
          <div className="border-b border-[#E3E8EC] px-5 py-4">
            <h2 id="help-faq-title" className="text-[17px] font-extrabold text-[#153244]">Preguntas frecuentes</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">
              {loading ? "Cargando..." : `${visibleTopics.length} ${visibleTopics.length === 1 ? "resultado" : "resultados"}`}
            </p>
          </div>

          {loading ? (
            <HelpTopicsSkeleton />
          ) : loadError ? (
            <HelpLoadError message={loadError} onRetry={() => void loadTopics()} />
          ) : visibleTopics.length > 0 ? (
            visibleTopics.map((topic) => (
              <div key={topic.id} className="flex items-start border-b border-[#E3E8EC] last:border-b-0">
                <details className="group min-w-0 flex-1">
                  <summary className="flex min-h-[68px] cursor-pointer list-none items-center gap-3 px-5 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#0072BC] [&::-webkit-details-marker]:hidden">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDF8F5] text-[#153244]">
                      <AppIcon name={topic.iconName} size={19} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase text-[#5F6B76]">{topic.category}</span>
                        {isAdmin && !topic.isActive ? <HelpStatusBadge label="Borrador" tone="draft" /> : null}
                        {isAdmin && topic.adminOnly ? <HelpStatusBadge label="Solo admins" tone="admin" /> : null}
                      </span>
                      <span className="mt-0.5 block text-[14px] font-extrabold text-[#153244]">{topic.title}</span>
                    </span>
                    <AppIcon name="chevronDown" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-5 pl-[72px] text-[13px] font-semibold leading-relaxed text-[#5F6B76]">{topic.content}</p>
                </details>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => openEditForm(topic)}
                    aria-label={`Editar ${topic.title}`}
                    title="Editar pregunta"
                    className="mr-3 mt-3 inline-flex size-11 shrink-0 items-center justify-center rounded-[7px] border border-[#C7D1DA] bg-white text-[#0072BC] hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
                  >
                    <AppIcon name="edit" size={18} />
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <HelpEmptyState hasQuery={Boolean(query)} isAdmin={isAdmin} onCreate={openCreateForm} />
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-[10px] border border-[#D8E0E6] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF3BF] text-[#153244]"><AppIcon name="help" size={23} /></span>
            <h2 className="mt-4 text-[17px] font-extrabold text-[#153244]">Accesos útiles</h2>
            <div className="mt-4 space-y-2">
              <HelpLink label="Ir al HUB" icon="home" onClick={() => navigate("/")} />
              <HelpLink label="Abrir Directorio" icon="usersGroup" onClick={() => navigate("/directorio")} />
              <HelpLink label="Ver Novedades" icon="bell" onClick={() => navigate("/novedades")} />
            </div>
          </section>

          <section className="rounded-[10px] border border-[#D8E0E6] bg-[#153244] p-5 text-white shadow-[0_2px_10px_rgba(21,50,68,0.08)]">
            <AppIcon name="mail" size={24} className="text-[#8DE2D6]" />
            <h2 className="mt-3 text-[16px] font-extrabold">¿Necesitás asistencia?</h2>
            <p className="mt-2 text-[13px] font-semibold leading-relaxed text-white/80">Contactá a la coordinación de la Red mediante los canales institucionales habituales.</p>
          </section>
        </aside>
      </div>

      {isAdmin ? (
        <HelpFaqFormDialog
          open={formOpen}
          faq={editingFaq}
          defaultSortOrder={nextSortOrder}
          onCancel={() => {
            setFormOpen(false);
            setEditingFaq(null);
          }}
          onSaved={handleSaved}
        />
      ) : null}
    </main>
  );
}

function HelpLink({ label, icon, onClick }: { label: string; icon: AppIconName; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 rounded-[6px] border border-[#D8E0E6] px-3 text-left text-[13px] font-extrabold text-[#153244] hover:bg-[#F5F7F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]">
      <AppIcon name={icon} size={18} />
      {label}
      <AppIcon name="chevronRight" size={16} className="ml-auto" />
    </button>
  );
}

function HelpStatusBadge({ label, tone }: { label: string; tone: "draft" | "admin" }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${tone === "draft" ? "bg-[#FFF3BF] text-[#745A00]" : "bg-[#EAF4FB] text-[#005CB9]"}`}>
      {label}
    </span>
  );
}

function HelpTopicsSkeleton() {
  return (
    <div aria-label="Cargando preguntas frecuentes" className="animate-pulse">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="flex min-h-[68px] items-center gap-3 border-b border-[#E3E8EC] px-5 py-3 last:border-b-0">
          <span className="h-10 w-10 shrink-0 rounded-full bg-[#E8EEF2]" />
          <span className="min-w-0 flex-1">
            <span className="block h-2.5 w-20 rounded bg-[#E8EEF2]" />
            <span className="mt-2 block h-3.5 w-3/5 rounded bg-[#E8EEF2]" />
          </span>
        </div>
      ))}
    </div>
  );
}

function HelpLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F0] text-[#C83232]"><AppIcon name="alert" size={25} /></span>
      <h3 className="mt-3 text-[17px] font-extrabold text-[#153244]">No pudimos cargar Ayuda</h3>
      <p className="mt-2 max-w-[480px] text-[13px] font-semibold text-[#5F6B76]">{message}</p>
      <button type="button" onClick={onRetry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[7px] border border-[#0072BC] px-4 text-[13px] font-extrabold text-[#0072BC] hover:bg-[#EAF4FB]">
        <AppIcon name="refresh" size={18} />
        Reintentar
      </button>
    </div>
  );
}

function HelpEmptyState({ hasQuery, isAdmin, onCreate }: { hasQuery: boolean; isAdmin: boolean; onCreate: () => void }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
      <AppIcon name={hasQuery ? "search" : "help"} size={32} className="text-[#5F6B76]" />
      <h3 className="mt-3 text-[17px] font-extrabold text-[#153244]">{hasQuery ? "No encontramos resultados" : "No hay preguntas frecuentes"}</h3>
      <p className="mt-2 text-[13px] font-semibold text-[#5F6B76]">
        {hasQuery ? "Probá con otra palabra o limpiá la búsqueda." : "Todavía no se publicaron consultas de ayuda."}
      </p>
      {isAdmin && !hasQuery ? (
        <button type="button" onClick={onCreate} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[7px] bg-[#0072BC] px-4 text-[13px] font-extrabold text-white hover:bg-[#005F9E]">
          <AppIcon name="plus" size={18} />
          Añadir primera pregunta
        </button>
      ) : null}
    </div>
  );
}

function compareHelpFaqs(left: HelpFaq, right: HelpFaq) {
  return left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
