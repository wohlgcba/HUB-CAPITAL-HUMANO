import { ProjectCard } from "./ProjectCard";

const projects = [
  {
    id: 1,
    title: "Ejes de Trabajo",
    badge: "EJES",
    badgeColor: "#1B89B4",
    description: "Conocé los principales ejes de trabajo de la Red y las líneas de acción prioritarias.",
    materials: 12,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Personas trabajando con papeles",
  },
  {
    id: 2,
    title: "Encuentros 2026",
    badge: "ENCUENTROS",
    badgeColor: "#007D95",
    description: "Cronograma, presentaciones y materiales de los encuentros de la Red 2026.",
    materials: 18,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Auditorio o reunión",
  },
  {
    id: 3,
    title: "Reconocimiento",
    badge: "NUEVO",
    badgeColor: "#FFCC00",
    description: "Información y recursos sobre el Plan de Reconocimiento y las acciones destacadas.",
    materials: 9,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Fondo azul con medalla institucional",
  },
  {
    id: 4,
    title: "Gob Lab",
    description: "Iniciativas colaborativas para innovar en la gestión pública y generar valor.",
    materials: 14,
    buttonLabel: "Ingresar",
    imageUrl: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Gráfica Gob Lab",
  },
  {
    id: 5,
    title: "Salud Mental",
    badge: "SALUD",
    badgeColor: "#2CA6B6",
    description: "Recursos y herramientas para acompañar el bienestar de los equipos de trabajo.",
    materials: 11,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1458501534264-7d326fa0ca04?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Piedras apiladas en entorno tranquilo",
  },
  {
    id: 6,
    title: "Guías Operativas",
    badge: "GUÍAS",
    badgeColor: "#2CA6B6",
    description: "Guías, instructivos y buenas prácticas para la gestión del talento.",
    materials: 16,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1695388474402-ed805a890d8d?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Persona escribiendo sobre documentos",
  },
  {
    id: 7,
    title: "Mentoreo",
    badge: "MENTOREO",
    badgeColor: "#FFCC00",
    description: "Programa de mentoreo y desarrollo profesional dentro de la Red.",
    materials: 7,
    buttonLabel: "Ingresar",
    imageUrl: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Dos personas conversando en entorno laboral",
  },
  {
    id: 8,
    title: "Encuentros 2025",
    badge: "2025",
    badgeColor: "#007D95",
    description: "Accedé a los materiales y presentaciones de encuentros anteriores.",
    materials: 22,
    buttonLabel: "Ver sección",
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
    imageAlt: "Presentación ante un auditorio",
  },
];

export function ProjectsRow() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} {...project} />
      ))}
    </section>
  );
}
