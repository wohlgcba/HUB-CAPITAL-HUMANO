import type { AppIconName } from "../components/AppIcon";

export interface SectionResource {
  id: string;
  title: string;
  description: string;
  fileType: "PDF" | "PPTX" | "DOCX" | "XLSX";
  fileSize: string;
  url?: string;
  featured?: boolean;
}

export interface HubSection {
  id: string;
  slug: string;
  title: string;
  description: string;
  bannerVariant: string;
  icon: AppIconName;
  updatedAt: string;
  resources: SectionResource[];
}

export interface HubSectionCard {
  id: number;
  badge?: string;
  badgeColor?: string;
  materials: number;
  buttonLabel: string;
  imageUrl: string;
  imageAlt: string;
}

export type HubSectionWithCard = HubSection & {
  card: HubSectionCard;
};

export const hubSections: HubSectionWithCard[] = [
  {
    id: "ejes-de-trabajo",
    slug: "ejes-de-trabajo",
    title: "Ejes de Trabajo",
    description: "Conocé los principales ejes de trabajo de la Red y las líneas de acción prioritarias.",
    bannerVariant: "cyan",
    icon: "target",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 1,
      badge: "EJES",
      badgeColor: "#1B89B4",
      materials: 12,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Personas trabajando con papeles",
    },
    resources: [
      {
        id: "matriz-ejes",
        title: "Matriz de ejes prioritarios",
        description: "Síntesis de líneas de acción, objetivos y criterios de seguimiento para equipos de la Red.",
        fileType: "PDF",
        fileSize: "1.8 MB",
        featured: true,
      },
      {
        id: "planificacion-operativa",
        title: "Planificación operativa por área",
        description: "Modelo editable para organizar acciones, responsables, hitos y entregables por eje de trabajo.",
        fileType: "XLSX",
        fileSize: "620 KB",
      },
      {
        id: "presentacion-ejes",
        title: "Presentación institucional de ejes",
        description: "Material para compartir el marco de trabajo y las prioridades de Capital Humano.",
        fileType: "PPTX",
        fileSize: "2.9 MB",
      },
    ],
  },
  {
    id: "encuentros-2026",
    slug: "encuentros-2026",
    title: "Encuentros 2026",
    description: "Cronograma, presentaciones y materiales de los encuentros de la Red 2026.",
    bannerVariant: "navy",
    icon: "calendar",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 2,
      badge: "ENCUENTROS",
      badgeColor: "#007D95",
      materials: 18,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Auditorio o reunión",
    },
    resources: [
      {
        id: "cronograma-2026",
        title: "Cronograma anual de encuentros",
        description: "Fechas previstas, modalidad, temas centrales y responsables de cada instancia de trabajo.",
        fileType: "PDF",
        fileSize: "980 KB",
        featured: true,
      },
      {
        id: "kit-dinamicas",
        title: "Kit de dinámicas para encuentros",
        description: "Actividades sugeridas para facilitar conversaciones, acuerdos y seguimiento entre áreas.",
        fileType: "DOCX",
        fileSize: "760 KB",
      },
      {
        id: "presentacion-apertura",
        title: "Presentación de apertura 2026",
        description: "Material base para el inicio del ciclo de encuentros de la Red de Capital Humano.",
        fileType: "PPTX",
        fileSize: "4.2 MB",
      },
    ],
  },
  {
    id: "reconocimiento",
    slug: "reconocimiento",
    title: "Reconocimiento",
    description: "Recursos, guías y materiales vinculados al Plan de Reconocimiento y sus acciones destacadas.",
    bannerVariant: "cyan",
    icon: "certificate",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 3,
      badge: "NUEVO",
      badgeColor: "#FFCC00",
      materials: 9,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1568992688065-536aad8a12f6?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Fondo azul con medalla institucional",
    },
    resources: [
      {
        id: "guia-operativa",
        title: "Guía operativa para activar el Plan de Reconocimiento",
        description: "Pasos, criterios y recomendaciones para implementar el Plan de Reconocimiento en tu área.",
        fileType: "PDF",
        fileSize: "2.4 MB",
        featured: true,
      },
      {
        id: "plan-2026",
        title: "Plan de Reconocimiento 2026",
        description: "Presentación del Plan de Reconocimiento 2026, objetivos, pilares y líneas de acción.",
        fileType: "PPTX",
        fileSize: "3.1 MB",
      },
      {
        id: "bitacora",
        title: "Bitácora de acciones destacadas",
        description: "Registro de acciones destacadas por organismo y equipo. Actualización periódica.",
        fileType: "XLSX",
        fileSize: "480 KB",
      },
      {
        id: "preguntas-frecuentes",
        title: "Preguntas frecuentes sobre reconocimiento interno",
        description: "Respuestas a las dudas más comunes sobre el Plan de Reconocimiento y su implementación.",
        fileType: "DOCX",
        fileSize: "1.2 MB",
      },
    ],
  },
  {
    id: "gob-lab",
    slug: "gob-lab",
    title: "Gob Lab",
    description: "Iniciativas colaborativas para innovar en la gestión pública y generar valor.",
    bannerVariant: "yellow",
    icon: "briefcase",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 4,
      materials: 14,
      buttonLabel: "Ingresar",
      imageUrl: "https://images.unsplash.com/photo-1568992687947-868a62a9f521?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Gráfica Gob Lab",
    },
    resources: [
      {
        id: "manual-laboratorio",
        title: "Manual para laboratorios de innovación",
        description: "Guía para formular desafíos, prototipar soluciones y documentar aprendizajes compartidos.",
        fileType: "PDF",
        fileSize: "2.2 MB",
        featured: true,
      },
      {
        id: "canvas-iniciativas",
        title: "Canvas de iniciativas colaborativas",
        description: "Plantilla para describir hipótesis, usuarios, valor público y métricas de avance.",
        fileType: "DOCX",
        fileSize: "510 KB",
      },
    ],
  },
  {
    id: "salud-mental",
    slug: "salud-mental",
    title: "Salud Mental",
    description: "Recursos y herramientas para acompañar el bienestar de los equipos de trabajo.",
    bannerVariant: "soft",
    icon: "bulb",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 5,
      badge: "SALUD",
      badgeColor: "#2CA6B6",
      materials: 11,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1458501534264-7d326fa0ca04?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Piedras apiladas en entorno tranquilo",
    },
    resources: [
      {
        id: "guia-acompanamiento",
        title: "Guía de acompañamiento emocional",
        description: "Orientaciones para detectar señales de alerta y derivar consultas dentro de canales institucionales.",
        fileType: "PDF",
        fileSize: "1.7 MB",
        featured: true,
      },
      {
        id: "taller-bienestar",
        title: "Taller de bienestar para equipos",
        description: "Presentación para facilitar espacios de conversación sobre cuidado, escucha y prevención.",
        fileType: "PPTX",
        fileSize: "3.6 MB",
      },
      {
        id: "checklist-cuidado",
        title: "Checklist de prácticas de cuidado",
        description: "Herramienta de seguimiento para responsables de equipos y enlaces de Capital Humano.",
        fileType: "XLSX",
        fileSize: "340 KB",
      },
    ],
  },
  {
    id: "guias-operativas",
    slug: "guias-operativas",
    title: "Guías Operativas",
    description: "Guías, instructivos y buenas prácticas para la gestión del talento.",
    bannerVariant: "cyan",
    icon: "clipboard",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 6,
      badge: "GUÍAS",
      badgeColor: "#2CA6B6",
      materials: 16,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1695388474402-ed805a890d8d?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Persona escribiendo sobre documentos",
    },
    resources: [
      {
        id: "instructivo-solicitudes",
        title: "Instructivo para solicitudes frecuentes",
        description: "Circuitos básicos, responsables y documentación requerida para trámites internos habituales.",
        fileType: "PDF",
        fileSize: "1.4 MB",
        featured: true,
      },
      {
        id: "modelo-comunicacion",
        title: "Modelo de comunicación interna",
        description: "Plantilla editable para informar novedades, cambios de circuito y recordatorios institucionales.",
        fileType: "DOCX",
        fileSize: "430 KB",
      },
      {
        id: "tablero-seguimiento",
        title: "Tablero de seguimiento operativo",
        description: "Planilla base para monitorear pedidos, estados, vencimientos y responsables.",
        fileType: "XLSX",
        fileSize: "890 KB",
      },
    ],
  },
  {
    id: "mentoreo",
    slug: "mentoreo",
    title: "Mentoreo",
    description: "Programa de mentoreo y desarrollo profesional dentro de la Red.",
    bannerVariant: "yellow",
    icon: "usersGroup",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 7,
      badge: "MENTOREO",
      badgeColor: "#FFCC00",
      materials: 7,
      buttonLabel: "Ingresar",
      imageUrl: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Dos personas conversando en entorno laboral",
    },
    resources: [
      {
        id: "guia-mentores",
        title: "Guía para mentores y mentoreados",
        description: "Pautas para organizar encuentros, definir objetivos y registrar acuerdos de desarrollo.",
        fileType: "PDF",
        fileSize: "1.6 MB",
        featured: true,
      },
      {
        id: "registro-sesiones",
        title: "Registro de sesiones de mentoreo",
        description: "Planilla para documentar avances, compromisos y próximas conversaciones.",
        fileType: "XLSX",
        fileSize: "280 KB",
      },
    ],
  },
  {
    id: "encuentros-2025",
    slug: "encuentros-2025",
    title: "Encuentros 2025",
    description: "Accedé a los materiales y presentaciones de encuentros anteriores.",
    bannerVariant: "navy",
    icon: "calendar",
    updatedAt: "4 de agosto de 2026",
    card: {
      id: 8,
      badge: "2025",
      badgeColor: "#007D95",
      materials: 22,
      buttonLabel: "Ver sección",
      imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?crop=entropy&cs=tinysrgb&fit=crop&h=230&w=360&q=80",
      imageAlt: "Presentación ante un auditorio",
    },
    resources: [
      {
        id: "memoria-2025",
        title: "Memoria de encuentros 2025",
        description: "Resumen de temas trabajados, principales acuerdos y próximos pasos identificados.",
        fileType: "PDF",
        fileSize: "2.7 MB",
        featured: true,
      },
      {
        id: "presentaciones-2025",
        title: "Presentaciones consolidadas 2025",
        description: "Material utilizado durante los encuentros del ciclo anterior.",
        fileType: "PPTX",
        fileSize: "5.8 MB",
      },
      {
        id: "asistencia-2025",
        title: "Registro de participación 2025",
        description: "Planilla de asistencia y participación por organismo durante el ciclo anual.",
        fileType: "XLSX",
        fileSize: "730 KB",
      },
    ],
  },
];

export function getHubSectionBySlug(slug: string | undefined) {
  return hubSections.find((section) => section.slug === slug);
}
