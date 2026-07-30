import { Users, FileText, Target } from "lucide-react";

export function HeroCard() {
  return (
    <div
      className="relative overflow-hidden rounded-xl flex flex-col justify-between"
      style={{ backgroundColor: "#153244", padding: "24px", minHeight: "220px", flex: "0 0 42%" }}
    >
      {/* Decorative shapes */}
      <DecorativeShapes />

      {/* Content */}
      <div className="relative z-10">
        <h2
          className="text-white mb-3"
          style={{ fontSize: "20px", fontWeight: 700, lineHeight: 1.25, fontFamily: "'Archivo', sans-serif", maxWidth: "280px" }}
        >
          Bienvenida al HUB de la<br />Red de Capital Humano
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", lineHeight: 1.55, maxWidth: "280px", fontFamily: "'Archivo', sans-serif" }}>
          Un espacio colaborativo para compartir información,<br />
          promover el aprendizaje y fortalecer el trabajo en red<br />
          entre las áreas de Capital Humano del GCBA.
        </p>
      </div>

      {/* Stats */}
      <div className="relative z-10 flex items-center gap-0 mt-5">
        <StatItem icon={<Users size={14} />} value="50" label="Integrantes en la red" />
        <div className="w-px h-8 mx-4" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        <StatItem icon={<FileText size={14} />} value="120+" label="Recursos disponibles" />
        <div className="w-px h-8 mx-4" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
        <StatItem icon={<Target size={14} />} value="8" label="Iniciativas y secciones" />
      </div>
    </div>
  );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div style={{ color: "#8DE2D6" }}>{icon}</div>
      <div>
        <div className="text-white" style={{ fontSize: "16px", fontWeight: 700, lineHeight: 1, fontFamily: "'Archivo', sans-serif" }}>{value}</div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px", lineHeight: 1.3, fontFamily: "'Archivo', sans-serif" }}>{label}</div>
      </div>
    </div>
  );
}

function DecorativeShapes() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Large cyan circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: "160px", height: "160px",
          right: "20px", top: "-30px",
          backgroundColor: "rgba(141,226,214,0.15)",
          border: "1px solid rgba(141,226,214,0.2)",
        }}
      />
      {/* Medium darker circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: "110px", height: "110px",
          right: "80px", top: "20px",
          backgroundColor: "rgba(141,226,214,0.1)",
          border: "1px solid rgba(141,226,214,0.15)",
        }}
      />
      {/* Small yellow circle */}
      <div
        className="absolute rounded-full"
        style={{
          width: "32px", height: "32px",
          right: "60px", bottom: "40px",
          backgroundColor: "rgba(255,204,0,0.35)",
        }}
      />
      {/* Dot pattern */}
      <DotPattern />
      {/* Person icon */}
      <div
        className="absolute flex items-center justify-center rounded-full"
        style={{
          width: "64px", height: "64px",
          right: "55px", top: "50%", transform: "translateY(-50%)",
          backgroundColor: "rgba(141,226,214,0.18)",
          border: "1.5px solid rgba(141,226,214,0.3)",
        }}
      >
        <Users size={28} style={{ color: "#8DE2D6" }} />
      </div>
    </div>
  );
}

function DotPattern() {
  const dots = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      dots.push(
        <div
          key={`${row}-${col}`}
          className="absolute rounded-full"
          style={{
            width: "3px", height: "3px",
            right: `${160 + col * 12}px`,
            bottom: `${20 + row * 12}px`,
            backgroundColor: "rgba(255,255,255,0.15)",
          }}
        />
      );
    }
  }
  return <>{dots}</>;
}
