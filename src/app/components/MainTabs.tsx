import { LayoutGrid, BookUser, Map } from "lucide-react";
import { useState } from "react";

const tabs = [
  { id: "hub", label: "HUB", icon: LayoutGrid },
  { id: "directorio", label: "Directorio", icon: BookUser },
  { id: "mapa", label: "Mapa", icon: Map },
];

export function MainTabs() {
  const [active, setActive] = useState("hub");

  return (
    <div
      className="w-full flex items-center px-6 shrink-0"
      style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E7EA", height: "50px" }}
    >
      <div className="flex items-center gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className="flex items-center gap-1.5 px-4 h-full relative cursor-pointer transition-colors"
              style={{
                height: "50px",
                color: isActive ? "#153244" : "#5F6B76",
                fontWeight: isActive ? 700 : 400,
                fontSize: "13px",
                fontFamily: "'Archivo', sans-serif",
                background: "transparent",
                border: "none",
                borderBottom: isActive ? "3px solid #FFCC00" : "3px solid transparent",
              }}
            >
              <Icon size={14} style={{ color: isActive ? "#153244" : "#8A9BA8" }} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
