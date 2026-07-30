import { FileText } from "lucide-react";

interface ProjectCardProps {
  number?: string;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  materials: number;
  buttonLabel: string;
  imageUrl: string;
  imageAlt: string;
}

export function ProjectCard({
  title,
  badge,
  badgeColor = "#153244",
  description,
  materials,
  buttonLabel,
  imageUrl,
  imageAlt,
}: ProjectCardProps) {
  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden shrink-0 hover:shadow-md transition-shadow cursor-pointer"
      style={{
        width: "180px",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E7EA",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      {/* Image */}
      <div className="relative" style={{ height: "90px", overflow: "hidden" }}>
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-full h-full object-cover"
        />
        {badge && (
          <div
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-white"
            style={{
              backgroundColor: badgeColor,
              fontSize: "9px",
              fontWeight: 700,
              fontFamily: "'Archivo', sans-serif",
              letterSpacing: "0.05em",
            }}
          >
            {badge}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3">
        <div
          className="mb-1"
          style={{ fontSize: "12px", fontWeight: 700, color: "#153244", fontFamily: "'Archivo', sans-serif", lineHeight: 1.25 }}
        >
          {title}
        </div>
        <p
          className="flex-1"
          style={{ fontSize: "10.5px", color: "#5F6B76", fontFamily: "'Archivo', sans-serif", lineHeight: 1.45 }}
        >
          {description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid #F0F3F5" }}>
          <div className="flex items-center gap-1">
            <FileText size={10} style={{ color: "#8A9BA8" }} />
            <span style={{ fontSize: "10px", color: "#8A9BA8", fontFamily: "'Archivo', sans-serif" }}>
              {materials} materiales
            </span>
          </div>
          <button
            className="px-2 py-0.5 rounded transition-colors hover:bg-[#153244] hover:text-white"
            style={{
              border: "1px solid #153244",
              color: "#153244",
              fontSize: "10px",
              fontFamily: "'Archivo', sans-serif",
              fontWeight: 500,
              backgroundColor: "transparent",
            }}
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
