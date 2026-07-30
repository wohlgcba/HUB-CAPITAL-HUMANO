const news = [
  {
    id: 1,
    dotColor: "#8DE2D6",
    title: "Nuevo material disponible en Salud Mental",
    description: 'Se publicó el documento "Acompañamiento en situaciones de crisis o malestar emocional".',
    date: "14 de mayo, 2025",
  },
  {
    id: 2,
    dotColor: "#FFCC00",
    title: "Encuentro de mayo 2026 confirmado",
    description: "Ya está disponible la agenda y los materiales preliminares del Encuentro 14 de mayo.",
    date: "12 de mayo, 2025",
  },
  {
    id: 3,
    dotColor: "#153244",
    title: "Actualización del Directorio 2026",
    description: "Se actualizó la información de contactos de la Red.",
    date: "9 de mayo, 2025",
  },
];

export function NewsPanel() {
  return (
    <div
      className="rounded-xl shrink-0"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E7EA",
        padding: "16px",
        width: "280px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#153244", fontFamily: "'Archivo', sans-serif" }}>
          Novedades
        </h3>
        <button
          className="hover:underline"
          style={{ fontSize: "11px", color: "#153244", fontFamily: "'Archivo', sans-serif" }}
        >
          Ver todas →
        </button>
      </div>

      {/* News items */}
      <div className="flex flex-col">
        {news.map((item, idx) => (
          <div
            key={item.id}
            className="py-3 cursor-pointer hover:bg-gray-50 transition-colors rounded px-1"
            style={{ borderBottom: idx < news.length - 1 ? "1px solid #F0F3F5" : "none" }}
          >
            <div className="flex items-start gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: item.dotColor }}
              />
              <div className="flex-1 min-w-0">
                <div
                  style={{
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#153244",
                    fontFamily: "'Archivo', sans-serif",
                    lineHeight: 1.3,
                    marginBottom: "3px",
                  }}
                >
                  {item.title}
                </div>
                <p
                  style={{
                    fontSize: "10.5px",
                    color: "#5F6B76",
                    fontFamily: "'Archivo', sans-serif",
                    lineHeight: 1.45,
                    marginBottom: "4px",
                  }}
                >
                  {item.description}
                </p>
                <div
                  className="text-right"
                  style={{ fontSize: "9.5px", color: "#B0BEC8", fontFamily: "'Archivo', sans-serif" }}
                >
                  {item.date}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
