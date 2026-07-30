import { Bell, HelpCircle, ChevronDown } from "lucide-react";

export function Header() {
  return (
    <header
      style={{ backgroundColor: "#06243A", fontFamily: "'Archivo', sans-serif", height: "88px" }}
      className="w-full px-6 flex items-center justify-between shrink-0"
    >
      {/* LEFT: Logo + separator + institutional text */}
      <div className="flex items-center gap-4 shrink-0">
        <BaLogo />
        <div className="w-px h-10" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />
        <div className="text-white leading-tight">
          <div style={{ fontSize: "10px", opacity: 0.8 }}>Secretaría de</div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>Comunicación</div>
          <div style={{ fontSize: "10px", opacity: 0.8 }}>Institucional</div>
        </div>
      </div>

      {/* CENTER: Title + subtitle */}
      <div className="flex flex-col items-center flex-1 px-8">
        <div className="text-white text-center" style={{ fontSize: "17px", fontWeight: 700, letterSpacing: "0.01em", lineHeight: 1.2 }}>
          <span>HUB </span>
          <span style={{ color: "#FFCC00" }}>|</span>
          <span> RED ENLACES CAPITAL HUMANO </span>
          <span style={{ color: "#FFCC00" }}>|</span>
          <span> 2026</span>
        </div>
        <div className="text-center mt-1" style={{ color: "rgba(255,255,255,0.6)", fontSize: "11px", maxWidth: "520px", lineHeight: 1.4 }}>
          Espacio de consulta para la Red de Capital Humano del GCBA. Información actualizada sobre programas, iniciativas, recursos y novedades.
        </div>
      </div>

      {/* RIGHT: Actions + user */}
      <div className="flex items-center gap-4 shrink-0">
        <button className="flex flex-col items-center gap-0.5 cursor-pointer relative hover:opacity-80 transition-opacity">
          <div className="relative">
            <Bell size={18} className="text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: "#FFCC00" }} />
          </div>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px" }}>Novedades</span>
        </button>

        <button className="flex flex-col items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity">
          <HelpCircle size={18} className="text-white" />
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: "10px" }}>Ayuda</span>
        </button>

        <div className="w-px h-10" style={{ backgroundColor: "rgba(255,255,255,0.3)" }} />

        <div className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1.5px solid rgba(255,255,255,0.45)" }}
          >
            <span className="text-white" style={{ fontSize: "12px", fontWeight: 700 }}>ME</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white" style={{ fontSize: "12px", fontWeight: 600 }}>María Eugenia</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px" }}>Coordinadora</span>
          </div>
          <ChevronDown size={14} className="text-white opacity-60" />
        </div>
      </div>
    </header>
  );
}

function BaLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" rx="3" fill="rgba(255,255,255,0.12)" />
        <text x="5" y="15" fill="white" fontSize="11" fontWeight="800" fontFamily="Arial, sans-serif">BA</text>
        <line x1="5" y1="19" x2="31" y2="19" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
        <text x="4" y="27" fill="rgba(255,255,255,0.85)" fontSize="5.5" fontFamily="Arial, sans-serif">Buenos Aires</text>
        <text x="7" y="33" fill="rgba(255,255,255,0.85)" fontSize="5.5" fontFamily="Arial, sans-serif">Ciudad</text>
      </svg>
    </div>
  );
}
