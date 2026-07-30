import { ChevronLeft, ChevronRight, FileText, FileSpreadsheet, Presentation } from "lucide-react";
import { useState } from "react";

const resources = [
  {
    id: 1,
    title: "Ecosistema de iniciativas 2026",
    type: "PDF",
    size: "2.4 MB",
    date: "Hoy",
    color: "#E53E3E",
    bgColor: "rgba(229,62,62,0.1)",
  },
  {
    id: 2,
    title: "Bitácora de dinámicas 2023 - ECH",
    type: "XLSX",
    size: "152 KB",
    date: "Ayer",
    color: "#2E7D32",
    bgColor: "rgba(46,125,50,0.1)",
  },
  {
    id: 3,
    title: "Resumen Acompañamiento Crisis Emocional",
    type: "PDF",
    size: "1.1 MB",
    date: "2 días atrás",
    color: "#E53E3E",
    bgColor: "rgba(229,62,62,0.1)",
  },
  {
    id: 4,
    title: "Encuentros CH 17 de julio 2025",
    type: "PPTX",
    size: "3.7 MB",
    date: "3 días atrás",
    color: "#C75B2A",
    bgColor: "rgba(199,91,42,0.1)",
  },
  {
    id: 5,
    title: "Jornadas Ministeriales 2025",
    type: "PDF",
    size: "1.8 MB",
    date: "5 días atrás",
    color: "#E53E3E",
    bgColor: "rgba(229,62,62,0.1)",
  },
];

function ResourceIcon({ type, color, bgColor }: { type: string; color: string; bgColor: string }) {
  const icon =
    type === "XLSX" ? <FileSpreadsheet size={18} style={{ color }} /> :
    type === "PPTX" ? <Presentation size={18} style={{ color }} /> :
    <FileText size={18} style={{ color }} />;

  return (
    <div
      className="w-11 h-11 rounded-lg flex flex-col items-center justify-center shrink-0"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
      <span style={{ fontSize: "7px", fontWeight: 700, color, fontFamily: "'Archivo', sans-serif", marginTop: "1px" }}>
        {type}
      </span>
    </div>
  );
}

export function RecentResources() {
  const [offset, setOffset] = useState(0);
  const visible = 5;

  return (
    <div
      className="rounded-xl flex-1"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E7EA",
        padding: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#153244", fontFamily: "'Archivo', sans-serif" }}>
          Recursos recientes
        </h3>
        <button
          className="flex items-center gap-1 hover:underline"
          style={{ fontSize: "11px", color: "#153244", fontFamily: "'Archivo', sans-serif" }}
        >
          Ver todos los recursos <span>→</span>
        </button>
      </div>

      {/* Resources row with arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOffset(Math.max(0, offset - 1))}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          style={{ border: "1px solid #E2E7EA" }}
        >
          <ChevronLeft size={12} style={{ color: "#153244" }} />
        </button>

        <div className="flex gap-2.5 flex-1 overflow-hidden">
          {resources.slice(offset, offset + visible).map((r) => (
            <div
              key={r.id}
              className="flex flex-col rounded-lg overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
              style={{
                border: "1px solid #E2E7EA",
                flex: "1",
                minWidth: 0,
              }}
            >
              {/* Thumbnail */}
              <div
                className="flex items-center justify-center"
                style={{ height: "60px", backgroundColor: r.bgColor }}
              >
                <ResourceIcon type={r.type} color={r.color} bgColor="transparent" />
              </div>
              {/* Info */}
              <div className="p-2">
                <div
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    color: "#153244",
                    fontFamily: "'Archivo', sans-serif",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {r.title}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className="px-1 py-0.5 rounded"
                    style={{ fontSize: "8px", fontWeight: 700, color: r.color, backgroundColor: r.bgColor, fontFamily: "'Archivo', sans-serif" }}
                  >
                    {r.type}
                  </span>
                  <span style={{ fontSize: "9px", color: "#8A9BA8", fontFamily: "'Archivo', sans-serif" }}>{r.size}</span>
                </div>
                <div style={{ fontSize: "9px", color: "#B0BEC8", fontFamily: "'Archivo', sans-serif", marginTop: "2px" }}>{r.date}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOffset(Math.min(resources.length - visible, offset + 1))}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          style={{ border: "1px solid #E2E7EA" }}
        >
          <ChevronRight size={12} style={{ color: "#153244" }} />
        </button>
      </div>
    </div>
  );
}
