import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

const accesos: Array<{ title: string; desc: string; icon: AppIconName; color: string }> = [
  {
    title: "Formularios",
    desc: "Accedé a formularios institucionales",
    icon: "clipboard",
    color: "text-[#FFCC00]",
  },
  {
    title: "Material digital",
    desc: "Guías, instructivos y documentación clave",
    icon: "fileDescription",
    color: "text-[#21AFC0]",
  },
  {
    title: "Directorio 2026",
    desc: "Contactos de la Red de Capital Humano del GCBA",
    icon: "users",
    color: "text-[#0072BC]",
  },
  {
    title: "Novedades",
    desc: "Enterate de las últimas noticias y actualizaciones",
    icon: "bell",
    color: "text-[#0072BC]",
  },
];

export function QuickAccessPanel() {
  return (
    <section className="rounded-[14px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
      <h2 className="mb-5 text-[16px] font-extrabold text-[#153244]">Accesos rápidos</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
        {accesos.map((acceso) => (
          <button
            key={acceso.title}
            className="flex min-h-[157px] flex-col items-center justify-start rounded-[8px] border border-[#E3E8EC] bg-[#FCFCFC] px-3 py-5 text-center shadow-[0_1px_4px_rgba(21,50,68,0.03)] transition-shadow hover:shadow-[0_4px_14px_rgba(21,50,68,0.08)]"
          >
            <AppIcon name={acceso.icon} size={38} stroke={1.8} className={acceso.color} />
            <span className="mt-5 text-[12px] font-extrabold leading-tight text-[#153244]">{acceso.title}</span>
            <span className="mt-3 max-w-[92px] text-[9px] font-semibold leading-[1.35] text-[#5F6B76]">{acceso.desc}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
