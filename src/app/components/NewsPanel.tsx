import { AppIcon } from "./AppIcon";

const news = [
  {
    dotColor: "#FFCC00",
    title: "Nuevo material disponible en Salud Mental",
    description: 'Se publicó el documento "Acompañamiento en situaciones de crisis o malestar emocional".',
    date: "14 de mayo, 2025",
  },
  {
    dotColor: "#42DCE4",
    title: "Encuentro de mayo 2026 confirmado",
    description: "Ya está disponible la agenda y los materiales preliminares del Encuentro 14 de mayo.",
    date: "12 de mayo, 2025",
  },
  {
    dotColor: "#0072BC",
    title: "Actualización del Directorio 2026",
    description: "Se actualizó la información de contactos de la Red.",
    date: "9 de mayo, 2025",
  },
];

export function NewsPanel() {
  return (
    <section className="rounded-[14px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-[17px] font-extrabold text-[#153244]">
          <AppIcon name="bell" size={24} />
          Novedades
        </h2>
        <button className="flex items-center gap-3 text-[12px] font-bold text-[#153244]">
          Ver todas
          <AppIcon name="chevronRight" size={17} />
        </button>
      </div>
      <div className="space-y-3">
        {news.map((item) => (
          <article key={item.title} className="flex items-start gap-4 rounded-[8px] border border-[#E3E8EC] px-4 py-3">
            <span className="mt-2 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.dotColor }} />
            <div className="min-w-0 flex-1">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <h3 className="text-[14px] font-extrabold leading-tight text-[#153244]">{item.title}</h3>
                <time className="text-[12px] font-semibold text-[#5F6B76]">{item.date}</time>
              </div>
              <p className="mt-1 max-w-[430px] text-[12px] font-semibold leading-[1.25] text-[#5F6B76]">{item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
