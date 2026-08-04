import { AppIcon } from "./AppIcon";
import { ResourceCard } from "./ResourceCard";

const resources = [
  {
    title: "Ecosistema de iniciativas 2026",
    type: "PDF",
    size: "2.4 MB",
    date: "Hoy",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=crop&h=200&w=140&q=80",
  },
  {
    title: "Bitácora de dinámicas 2023 - ECH",
    type: "XLSX",
    size: "152 KB",
    date: "Ayer",
    imageUrl: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?crop=entropy&cs=tinysrgb&fit=crop&h=200&w=140&q=80",
  },
  {
    title: "Resumen Acompañamiento Crisis Emocional",
    type: "PDF",
    size: "1.1 MB",
    date: "2 días atrás",
    imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?crop=entropy&cs=tinysrgb&fit=crop&h=200&w=140&q=80",
  },
  {
    title: "Encuentros CH 17 de julio 2025",
    type: "PPTX",
    size: "3.7 MB",
    date: "3 días atrás",
    imageUrl: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?crop=entropy&cs=tinysrgb&fit=crop&h=200&w=140&q=80",
  },
  {
    title: "Jornadas Ministeriales 2025",
    type: "PDF",
    size: "1.8 MB",
    date: "5 días atrás",
    imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?crop=entropy&cs=tinysrgb&fit=crop&h=200&w=140&q=80",
  },
];

export function RecentResources({ embedded = false }: { embedded?: boolean }) {
  const wrapperClass = embedded
    ? "border-t border-[#E3E8EC] pt-5"
    : "rounded-[14px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]";

  return (
    <section className={wrapperClass}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-[17px] font-extrabold text-[#153244]">
          <AppIcon name="files" size={24} />
          Recursos recientes
        </h2>
        <button className="flex items-center gap-3 text-[12px] font-bold text-[#153244]">
          Ver todos los recursos
          <AppIcon name="chevronRight" size={17} />
        </button>
      </div>
      <div className="grid grid-cols-[1fr] items-center gap-3 lg:grid-cols-[auto_1fr_auto]">
        <button className="hidden h-11 w-11 items-center justify-center text-[#153244] lg:flex">
          <AppIcon name="chevronLeft" size={24} />
        </button>
        <div className="flex min-w-0 snap-x gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-5 lg:overflow-visible lg:pb-0">
          {resources.map((resource) => (
            <ResourceCard key={resource.title} {...resource} />
          ))}
        </div>
        <button className="hidden h-11 w-11 items-center justify-center text-[#153244] lg:flex">
          <AppIcon name="chevronRight" size={24} />
        </button>
      </div>
    </section>
  );
}
