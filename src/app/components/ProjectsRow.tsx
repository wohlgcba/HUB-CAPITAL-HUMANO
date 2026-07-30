import { ProjectCard } from "./ProjectCard";

const projects = [
  {
    id: 1,
    title: "Ejes de Trabajo",
    badge: "EJES",
    badgeColor: "#153244",
    description: "Conocé los principales ejes de trabajo de la Red y las líneas de acción prioritarias.",
    materials: 12,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Personas trabajando con papeles",
  },
  {
    id: 2,
    title: "Encuentros 2026",
    badge: "ENCUENTROS",
    badgeColor: "#1E6B8C",
    description: "Cronograma, presentaciones y materiales de los encuentros de la Red 2026.",
    materials: 18,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1773828755374-0ee802d9f44b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Auditorio o reunión",
  },
  {
    id: 3,
    title: "Reconocimiento",
    badge: "NUEVO",
    badgeColor: "#2E7D32",
    description: "Información y recursos sobre el Plan de Reconocimiento y las acciones destacadas.",
    materials: 9,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Fondo azul con medalla institucional",
  },
  {
    id: 4,
    title: "Gob Lab",
    badge: undefined,
    badgeColor: undefined,
    description: "Iniciativas colaborativas para innovar en la gestión pública y generar valor.",
    materials: 14,
    buttonLabel: "Ingresar",
    imageUrl: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Gráfica Gob Lab",
  },
  {
    id: 5,
    title: "Salud Mental",
    badge: "SALUD",
    badgeColor: "#6B3FA0",
    description: "Recursos y herramientas para acompañar el bienestar de los equipos de trabajo.",
    materials: 11,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1458501534264-7d326fa0ca04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Piedras apiladas en entorno tranquilo",
  },
  {
    id: 6,
    title: "Guías Operativas",
    badge: "GUÍAS",
    badgeColor: "#B45309",
    description: "Guías, instructivos y buenas prácticas para la gestión del talento.",
    materials: 16,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1695388474402-ed805a890d8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Persona escribiendo sobre documentos",
  },
  {
    id: 7,
    title: "Mentoreo",
    badge: "MENTOREO",
    badgeColor: "#153244",
    description: "Programa de mentoreo y desarrollo profesional dentro de la Red.",
    materials: 7,
    buttonLabel: "Ingresar",
    imageUrl: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Dos personas conversando en entorno laboral",
  },
  {
    id: 8,
    title: "Encuentros 2025",
    badge: "2025",
    badgeColor: "#5F6B76",
    description: "Accedé a los materiales y presentaciones de encuentros anteriores.",
    materials: 22,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1773829020694-413e879d2957?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80",
    imageAlt: "Presentación ante un auditorio",
  },
];

export function ProjectsRow() {
  return (
    <div className="w-full">
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#D5DDE2 transparent" }}>
        {projects.map((p) => (
          <ProjectCard key={p.id} {...p} />
        ))}
      </div>
    </div>
  );
}
