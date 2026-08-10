import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { logAuditEvent } from "../services/auditService";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

type HelpTopic = {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: AppIconName;
  adminOnly?: boolean;
};

const helpTopics: HelpTopic[] = [
  {
    id: "access",
    title: "No puedo ingresar a mi cuenta",
    content: "Verificá que estés usando el correo registrado. Si no recordás la contraseña, utilizá la opción de recuperación disponible en la pantalla de ingreso.",
    category: "Acceso",
    icon: "lock",
  },
  {
    id: "resources",
    title: "¿Cómo consulto un recurso?",
    content: "Ingresá a una sección del HUB, elegí el recurso y abrí el archivo disponible. Los PDF y las imágenes pueden visualizarse dentro de la aplicación.",
    category: "Recursos",
    icon: "fileDescription",
  },
  {
    id: "downloads",
    title: "No aparece la opción de descarga",
    content: "La descarga depende de la configuración definida para cada archivo. Cuando no está habilitada, el recurso puede consultarse únicamente desde el visor.",
    category: "Recursos",
    icon: "download",
  },
  {
    id: "directory",
    title: "Necesito actualizar mis datos del Directorio",
    content: "Solicitá la actualización a la coordinación de la Red por los canales institucionales habituales. Los cambios deben ser validados por un administrador.",
    category: "Directorio",
    icon: "usersGroup",
  },
  {
    id: "search",
    title: "¿Cómo encuentro una persona?",
    content: "En Directorio podés buscar por nombre, área, rol, correo o edificio y combinar la búsqueda con los filtros disponibles.",
    category: "Directorio",
    icon: "search",
  },
  {
    id: "notifications",
    title: "¿Qué aparece en Novedades?",
    content: "Novedades informa la publicación de secciones y recursos. Cada actualización puede marcarse como leída y, cuando corresponde, abrir directamente su contenido.",
    category: "Novedades",
    icon: "bell",
  },
  {
    id: "admin-content",
    title: "¿Cómo publico contenido?",
    content: "Desde el HUB administrativo podés crear secciones y añadir recursos. Una publicación activa genera automáticamente una novedad para los integrantes.",
    category: "Administración",
    icon: "upload",
    adminOnly: true,
  },
];

export function HelpPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [query, setQuery] = useState("");
  const isAdmin = auth.profile?.role === "admin";

  useEffect(() => {
    void logAuditEvent("help_view", "help");
  }, []);

  const visibleTopics = useMemo(() => {
    const normalizedQuery = normalize(query);
    return helpTopics.filter((topic) => {
      if (topic.adminOnly && !isAdmin) return false;
      if (!normalizedQuery) return true;
      return normalize(`${topic.title} ${topic.content} ${topic.category}`).includes(normalizedQuery);
    });
  }, [isAdmin, query]);

  return (
    <main className="mx-auto w-screen max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="border-b border-[#D8E0E6] pb-5">
        <p className="text-[11px] font-extrabold uppercase text-[#5F6B76]">Centro de asistencia</p>
        <h1 className="mt-1 text-[30px] font-extrabold leading-tight text-[#153244]">Ayuda</h1>
        <p className="mt-2 max-w-[720px] text-[14px] font-semibold text-[#5F6B76]">Información para resolver consultas sobre el acceso y el uso institucional del HUB.</p>
      </div>

      <div className="mt-5 flex min-h-12 items-center gap-3 rounded-[8px] border border-[#C7D1DA] bg-white px-4 shadow-[0_1px_4px_rgba(21,50,68,0.03)] focus-within:border-[#21AFC0] focus-within:ring-4 focus-within:ring-[#8DE2D6]/30">
        <AppIcon name="search" size={21} className="shrink-0 text-[#153244]" />
        <label htmlFor="help-search" className="sr-only">Buscar en Ayuda</label>
        <input id="help-search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-[#153244] outline-none placeholder:text-[#77838E]" placeholder="Buscar una consulta..." />
        {query ? <button type="button" onClick={() => setQuery("")} aria-label="Limpiar búsqueda" title="Limpiar búsqueda" className="inline-flex size-11 items-center justify-center text-[#5F6B76]"><AppIcon name="x" size={18} /></button> : null}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="overflow-hidden rounded-[10px] border border-[#D8E0E6] bg-white shadow-[0_2px_10px_rgba(21,50,68,0.04)]" aria-labelledby="help-faq-title">
          <div className="border-b border-[#E3E8EC] px-5 py-4">
            <h2 id="help-faq-title" className="text-[17px] font-extrabold text-[#153244]">Preguntas frecuentes</h2>
            <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">{visibleTopics.length} {visibleTopics.length === 1 ? "resultado" : "resultados"}</p>
          </div>
          {visibleTopics.length > 0 ? visibleTopics.map((topic) => (
            <details key={topic.id} className="group border-b border-[#E3E8EC] last:border-b-0">
              <summary className="flex min-h-[68px] cursor-pointer list-none items-center gap-3 px-5 py-3 text-left [&::-webkit-details-marker]:hidden">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#DDF8F5] text-[#153244]"><AppIcon name={topic.icon} size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-extrabold uppercase text-[#5F6B76]">{topic.category}</span>
                  <span className="mt-0.5 block text-[14px] font-extrabold text-[#153244]">{topic.title}</span>
                </span>
                <AppIcon name="chevronDown" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 pl-[72px] text-[13px] font-semibold leading-relaxed text-[#5F6B76]">{topic.content}</p>
            </details>
          )) : (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
              <AppIcon name="search" size={32} className="text-[#5F6B76]" />
              <h3 className="mt-3 text-[17px] font-extrabold text-[#153244]">No encontramos resultados</h3>
              <p className="mt-2 text-[13px] font-semibold text-[#5F6B76]">Probá con otra palabra o limpiá la búsqueda.</p>
            </div>
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
    </main>
  );
}

function HelpLink({ label, icon, onClick }: { label: string; icon: AppIconName; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-11 w-full items-center gap-3 rounded-[6px] border border-[#D8E0E6] px-3 text-left text-[13px] font-extrabold text-[#153244] hover:bg-[#F5F7F8]"><AppIcon name={icon} size={18} />{label}<AppIcon name="chevronRight" size={16} className="ml-auto" /></button>;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
