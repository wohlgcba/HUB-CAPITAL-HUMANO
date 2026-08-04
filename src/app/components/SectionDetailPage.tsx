import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import type { HubSection, SectionResource } from "../data/hubSections";
import { getHubSectionBySlug } from "../data/hubSections";
import { AppIcon } from "./AppIcon";

type ResourceFormat = SectionResource["fileType"];

const bannerStyles: Record<string, { glow: string; accentLarge: string; accentMain: string; halo: string }> = {
  cyan: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(0,114,188,0.24),transparent_34%),linear-gradient(115deg,#062A43_0%,#073653_58%,#06304A_100%)]",
    accentLarge: "bg-[#35C8D0]/85",
    accentMain: "bg-[#35C8D0]/95",
    halo: "shadow-[0_0_0_34px_rgba(53,200,208,0.18)]",
  },
  navy: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(141,226,214,0.20),transparent_34%),linear-gradient(115deg,#062A43_0%,#082E4A_58%,#153244_100%)]",
    accentLarge: "bg-[#8DE2D6]/85",
    accentMain: "bg-[#8DE2D6]/95",
    halo: "shadow-[0_0_0_34px_rgba(141,226,214,0.14)]",
  },
  yellow: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(255,204,0,0.18),transparent_34%),linear-gradient(115deg,#062A43_0%,#073653_58%,#102F3F_100%)]",
    accentLarge: "bg-[#FFCC00]/80",
    accentMain: "bg-[#FFCC00]/95",
    halo: "shadow-[0_0_0_34px_rgba(255,204,0,0.12)]",
  },
  soft: {
    glow: "bg-[radial-gradient(circle_at_18%_22%,rgba(141,226,214,0.18),transparent_34%),linear-gradient(115deg,#062A43_0%,#113D51_58%,#153244_100%)]",
    accentLarge: "bg-[#8DE2D6]/80",
    accentMain: "bg-[#8DE2D6]/95",
    halo: "shadow-[0_0_0_34px_rgba(141,226,214,0.16)]",
  },
};

const formatStyles: Record<
  ResourceFormat,
  {
    icon: "fileText" | "presentation" | "files" | "fileDescription";
    iconClass: string;
    bgClass: string;
    labelClass: string;
  }
> = {
  PDF: {
    icon: "fileText",
    iconClass: "text-[#C7352D]",
    bgClass: "bg-[#FDECEC]",
    labelClass: "bg-[#FDECEC] text-[#A62923]",
  },
  PPTX: {
    icon: "presentation",
    iconClass: "text-[#D76F18]",
    bgClass: "bg-[#FFF1E3]",
    labelClass: "bg-[#FFF1E3] text-[#A95110]",
  },
  XLSX: {
    icon: "files",
    iconClass: "text-[#15824B]",
    bgClass: "bg-[#E8F7EF]",
    labelClass: "bg-[#E8F7EF] text-[#116A3E]",
  },
  DOCX: {
    icon: "fileDescription",
    iconClass: "text-[#0072BC]",
    bgClass: "bg-[#EAF4FB]",
    labelClass: "bg-[#EAF4FB] text-[#005A95]",
  },
};

type SectionDetailPageProps = {
  onBack: () => void;
};

export function SectionDetailPage({ onBack }: SectionDetailPageProps) {
  const { slug } = useParams();
  const section = getHubSectionBySlug(slug);
  const [toast, setToast] = useState("");
  const toastTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToast(""), 2800);
  };

  if (!section) {
    return (
      <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Breadcrumb" className="text-[13px] font-bold text-[#5F6B76]">
              <ol className="flex flex-wrap items-center gap-2">
                <li>HUB</li>
                <li className="text-[#9AA6B2]">/</li>
                <li className="text-[#153244]">Sección no encontrada</li>
              </ol>
            </nav>
            <BackButton onBack={onBack} />
          </div>
          <section className="rounded-[14px] border border-[#E3E8EC] bg-white p-8 text-center shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#DDF8F5] text-[#153244]">
              <AppIcon name="help" size={34} />
            </div>
            <h1 className="mt-5 text-[clamp(28px,3vw,42px)] font-extrabold text-[#153244]">Sección no encontrada</h1>
            <p className="mx-auto mt-3 max-w-[560px] text-[15px] font-semibold leading-relaxed text-[#5F6B76]">
              La sección solicitada no está disponible dentro del HUB.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-screen max-w-[1888px] flex-col gap-5 px-4 py-[18px] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Breadcrumb" className="text-[13px] font-bold text-[#5F6B76]">
            <ol className="flex flex-wrap items-center gap-2">
              <li>HUB</li>
              <li className="text-[#9AA6B2]">/</li>
              <li className="text-[#153244]">{section.title}</li>
            </ol>
          </nav>
          <BackButton onBack={onBack} />
        </div>

        <SectionBanner section={section} />

        <section className="flex flex-col gap-4" aria-labelledby="section-resources-title">
          <h2 id="section-resources-title" className="text-[clamp(22px,2vw,30px)] font-extrabold text-[#153244]">
            Recursos de la sección
          </h2>
          {section.resources.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {section.resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} onAction={showToast} />
              ))}
            </div>
          ) : (
            <div className="rounded-[12px] border border-dashed border-[#C9D5DE] bg-white px-5 py-10 text-center text-[15px] font-bold text-[#5F6B76]">
              Todavía no hay recursos publicados en esta sección.
            </div>
          )}
        </section>

        <p className="rounded-[10px] border border-[#E3E8EC] bg-white px-5 py-4 text-[13px] font-semibold leading-relaxed text-[#5F6B76] shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
          Uso interno exclusivo del Gobierno de la Ciudad de Buenos Aires. La información de este portal es confidencial y de uso restringido.
        </p>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-32px)] max-w-[520px] -translate-x-1/2 rounded-[10px] border border-[#8DE2D6] bg-[#153244] px-5 py-4 text-center text-[14px] font-bold text-white shadow-[0_16px_36px_rgba(6,42,67,0.25)]"
        >
          {toast}
        </div>
      )}
    </main>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex min-h-11 w-fit items-center gap-2 rounded-[6px] border border-[#C9D5DE] bg-white px-4 text-[13px] font-extrabold text-[#153244] shadow-[0_2px_8px_rgba(21,50,68,0.05)] transition-colors hover:bg-[#F1F6F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
    >
      <AppIcon name="chevronLeft" size={18} />
      Volver al HUB
    </button>
  );
}

export function SectionBanner({ section }: { section: HubSection }) {
  const variant = bannerStyles[section.bannerVariant] ?? bannerStyles.cyan;

  return (
    <section className="relative min-h-[350px] overflow-hidden rounded-[14px] bg-[#062A43] px-7 py-8 text-white shadow-[0_4px_16px_rgba(21,50,68,0.12)] sm:px-10 lg:min-h-[380px] lg:px-12 lg:py-10">
      <div className={`absolute inset-0 ${variant.glow}`} />
      <div className="absolute right-[18%] top-8 hidden h-[125px] w-[190px] opacity-70 [background-image:radial-gradient(#15D5E6_1.2px,transparent_1.2px)] [background-size:12px_12px] md:block" />
      <div className={`absolute -right-16 bottom-[-88px] h-[250px] w-[250px] rounded-full ${variant.accentLarge}`} />
      <div className={`absolute right-[12%] top-[78px] h-[160px] w-[160px] rounded-full ${variant.accentMain} ${variant.halo}`} />
      <div className="absolute right-[16%] top-[116px] flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[#FFCC00] text-[#062A43]">
        <AppIcon name={section.icon} size={44} stroke={1.8} />
      </div>
      <div className="absolute -right-4 top-0 h-[360px] w-[520px] opacity-40">
        <div className="absolute right-6 top-0 h-[360px] w-[360px] rounded-full border border-white/45" />
        <div className="absolute right-28 top-16 h-[360px] w-[360px] rounded-full border border-white/30" />
        <div className="absolute right-[-120px] top-28 h-[360px] w-[360px] rounded-full border border-white/25" />
      </div>

      <div className="relative z-10 flex min-h-[286px] max-w-[660px] flex-col justify-between gap-8">
        <div>
          <h1 className="text-[clamp(34px,4vw,56px)] font-extrabold leading-[1.03] tracking-[0]">{section.title}</h1>
          <p className="mt-5 max-w-[600px] text-[clamp(16px,1.5vw,20px)] font-semibold leading-[1.45] text-white">
            {section.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-[#153244]">
          <span className="inline-flex min-h-11 items-center rounded-[7px] bg-[#8DE2D6] px-4 text-[14px] font-extrabold">
            {section.resources.length} recursos
          </span>
          <span className="inline-flex min-h-11 items-center rounded-[7px] bg-white px-4 text-[14px] font-extrabold">
            Actualizado el {section.updatedAt}
          </span>
        </div>
      </div>
    </section>
  );
}

type ResourceCardProps = {
  resource: SectionResource;
  onAction: (message: string) => void;
};

export function ResourceCard({ resource, onAction }: ResourceCardProps) {
  const style = formatStyles[resource.fileType];

  return (
    <article className="flex h-full min-h-[245px] flex-col rounded-[12px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)] transition-shadow hover:shadow-[0_8px_22px_rgba(21,50,68,0.09)]">
      <div className="flex items-start gap-4">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] ${style.bgClass}`}>
          <AppIcon name={style.icon} size={30} stroke={1.8} className={style.iconClass} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-[5px] px-2 py-1 text-[12px] font-extrabold leading-none ${style.labelClass}`}>
              {resource.fileType}
            </span>
            <span className="text-[12px] font-bold text-[#5F6B76]">{resource.fileSize}</span>
            {resource.featured && (
              <span className="rounded-[5px] bg-[#FFCC00] px-2 py-1 text-[12px] font-extrabold leading-none text-[#153244]">
                Destacado
              </span>
            )}
          </div>
          <h3 className="mt-3 text-[20px] font-extrabold leading-tight text-[#153244]">{resource.title}</h3>
        </div>
      </div>

      <p className="mt-4 flex-1 text-[14px] font-semibold leading-[1.45] text-[#5F6B76]">{resource.description}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => onAction(resource.url ? `Abriendo recurso: ${resource.title}` : `Apertura pendiente de recurso: ${resource.title}`)}
          className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-[#0072BC] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white transition-colors hover:bg-[#005A95] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
        >
          Abrir recurso
        </button>
        <button
          type="button"
          onClick={() => onAction(resource.url ? `Descargando recurso: ${resource.title}` : `Descarga pendiente de recurso: ${resource.title}`)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] px-4 text-[13px] font-extrabold text-[#0072BC] transition-colors hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC]"
          aria-label={`Descargar ${resource.title}`}
        >
          <AppIcon name="download" size={18} />
          Descargar
        </button>
      </div>
    </article>
  );
}
