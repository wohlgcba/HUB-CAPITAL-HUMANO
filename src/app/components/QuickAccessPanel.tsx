import { ClipboardList, BookOpen, Users, Newspaper } from "lucide-react";

const accesos = [
  {
    id: 1,
    title: "Formularios",
    desc: "Accedé a formularios institucionales",
    icon: ClipboardList,
    iconColor: "#FFCC00",
    iconBg: "rgba(255,204,0,0.12)",
  },
  {
    id: 2,
    title: "Material digital",
    desc: "Guías, instructivos y documentación clave",
    icon: BookOpen,
    iconColor: "#8DE2D6",
    iconBg: "rgba(141,226,214,0.15)",
  },
  {
    id: 3,
    title: "Directorio 2026",
    desc: "Contactos de la Red de Capital Humano del GCBA",
    icon: Users,
    iconColor: "#153244",
    iconBg: "rgba(21,50,68,0.08)",
  },
  {
    id: 4,
    title: "Novedades",
    desc: "Enterate de las últimas noticias y actualizaciones",
    icon: Newspaper,
    iconColor: "#153244",
    iconBg: "rgba(21,50,68,0.08)",
  },
];

export function QuickAccessPanel() {
  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E7EA",
        padding: "18px",
        flex: "0 0 24%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        className="mb-3"
        style={{ fontSize: "13px", fontWeight: 700, color: "#153244", fontFamily: "'Archivo', sans-serif" }}
      >
        Accesos rápidos
      </h3>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {accesos.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              className="flex flex-col items-center text-center p-2.5 rounded-lg cursor-pointer transition-all hover:shadow-sm"
              style={{
                border: "1px solid #E2E7EA",
                backgroundColor: "#FCFCFC",
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                style={{ backgroundColor: a.iconBg }}
              >
                <Icon size={18} style={{ color: a.iconColor }} />
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#153244", fontFamily: "'Archivo', sans-serif", lineHeight: 1.2 }}>
                {a.title}
              </div>
              <div style={{ fontSize: "9.5px", color: "#5F6B76", fontFamily: "'Archivo', sans-serif", lineHeight: 1.3, marginTop: "3px" }}>
                {a.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
