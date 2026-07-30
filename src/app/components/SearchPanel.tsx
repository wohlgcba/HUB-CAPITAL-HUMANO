import { Search, LayoutGrid, BookOpen, Calendar, FileText, Newspaper } from "lucide-react";
import { useState } from "react";

const filters = [
  { id: "todas", label: "Todas", icon: LayoutGrid },
  { id: "programas", label: "Programas", icon: BookOpen },
  { id: "encuentros", label: "Encuentros", icon: Calendar },
  { id: "recursos", label: "Recursos", icon: FileText },
  { id: "novedades", label: "Novedades", icon: Newspaper },
];

export function SearchPanel() {
  const [activeFilter, setActiveFilter] = useState("todas");
  const [query, setQuery] = useState("");

  return (
    <div
      className="rounded-xl flex flex-col"
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E7EA",
        padding: "18px",
        flex: "0 0 32%",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Search input */}
      <div
        className="flex items-center gap-2 rounded-lg px-3"
        style={{ border: "1px solid #E2E7EA", height: "38px", backgroundColor: "#F8FAFB" }}
      >
        <Search size={15} style={{ color: "#8A9BA8", flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Buscar recursos, iniciativas o materiales..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          style={{ fontSize: "12px", color: "#153244", fontFamily: "'Archivo', sans-serif" }}
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 mt-3 flex-wrap">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md cursor-pointer transition-all"
              style={{
                backgroundColor: isActive ? "#153244" : "#FFFFFF",
                border: `1px solid ${isActive ? "#153244" : "#D5DDE2"}`,
                color: isActive ? "#FFFFFF" : "#153244",
                fontSize: "11px",
                fontFamily: "'Archivo', sans-serif",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={11} style={{ color: isActive ? "#FFFFFF" : "#8A9BA8" }} />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Empty search area */}
      <div className="flex-1 mt-4 flex items-center justify-center" style={{ minHeight: "80px" }}>
        <div className="text-center">
          <Search size={24} style={{ color: "#D5DDE2", margin: "0 auto 8px" }} />
          <p style={{ color: "#B0BEC8", fontSize: "11px", fontFamily: "'Archivo', sans-serif" }}>
            Ingresá un término para buscar
          </p>
        </div>
      </div>
    </div>
  );
}
