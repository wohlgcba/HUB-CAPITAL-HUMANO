export type MetricTone = "blue" | "green" | "yellow" | "violet";

export type MetricKpi = {
  id: string;
  title: string;
  value: number;
  detail: string;
  change: string;
  tone: MetricTone;
  icon: "users" | "visits" | "resources" | "downloads";
};

export const metricsSummary = {
  period: "03/08/2026 - 10/08/2026",
  directoryCompletion: { percentage: 76, complete: 38, total: 50 },
};

export const metricKpis: MetricKpi[] = [
  { id: "active-users", title: "Usuarios activos", value: 42, detail: "de 50 usuarios habilitados", change: "16% vs. período anterior", tone: "blue", icon: "users" },
  { id: "hub-visits", title: "Visitas al HUB", value: 326, detail: "sesiones en el período", change: "12% vs. período anterior", tone: "green", icon: "visits" },
  { id: "opened-resources", title: "Recursos abiertos", value: 184, detail: "aperturas de recursos", change: "8% vs. período anterior", tone: "yellow", icon: "resources" },
  { id: "downloads", title: "Descargas", value: 73, detail: "archivos descargados", change: "5% vs. período anterior", tone: "violet", icon: "downloads" },
];

export const activitySeries = [
  { day: "Mar 03", activeUsers: 23, visits: 32 },
  { day: "Mié 04", activeUsers: 30, visits: 40 },
  { day: "Jue 05", activeUsers: 39, visits: 41 },
  { day: "Vie 06", activeUsers: 34, visits: 43 },
  { day: "Sáb 07", activeUsers: 23, visits: 37 },
  { day: "Dom 08", activeUsers: 9, visits: 14 },
  { day: "Lun 09", activeUsers: 15, visits: 29 },
  { day: "Mar 10", activeUsers: 31, visits: 39 },
];

export const topSections = [
  { name: "Ejes de Trabajo", visits: 143, percentage: 26, color: "#0878D1" },
  { name: "Reconocimiento", visits: 112, percentage: 20, color: "#62CFC4" },
  { name: "Encuentros 2026", visits: 94, percentage: 17, color: "#FFCC00" },
  { name: "Salud Mental", visits: 71, percentage: 13, color: "#9A6FD1" },
  { name: "Gob Lab", visits: 54, percentage: 10, color: "#F28C28" },
];

export const topResources = [
  { name: "Ecosistema de iniciativas 2026", section: "Ejes de Trabajo", opens: 83, downloads: 31, rate: 37, kind: "pdf" as const, tone: "blue" as const },
  { name: "Plan de Reconocimiento", section: "Reconocimiento", opens: 65, downloads: 22, rate: 34, kind: "presentation" as const, tone: "yellow" as const },
  { name: "Bitácora de dinámicas 2023 - ECH", section: "Encuentros 2026", opens: 49, downloads: 18, rate: 37, kind: "spreadsheet" as const, tone: "cyan" as const },
  { name: "Jornadas Ministeriales 2025", section: "Encuentros 2026", opens: 34, downloads: 12, rate: 35, kind: "pdf" as const, tone: "cyan" as const },
  { name: "Guía operativa para activar el Plan", section: "Reconocimiento", opens: 28, downloads: 9, rate: 32, kind: "word" as const, tone: "yellow" as const },
];

export const userStatusStats = [
  { value: 50, label: "Usuarios registrados", tone: "blue" as const, icon: "registered" as const },
  { value: 42, label: "Usuarios activos", tone: "green" as const, icon: "active" as const },
  { value: 5, label: "Pendientes de primer ingreso", tone: "yellow" as const, icon: "pending" as const },
  { value: 3, label: "Sin actividad en 30 días", tone: "violet" as const, icon: "inactive" as const },
];

export const lowActivityUsers = [
  { name: "Juan Pérez", area: "Hacienda", lastAccess: "Hace 31 días" },
  { name: "María López", area: "Salud", lastAccess: "Nunca ingresó" },
  { name: "Sofía Rivas", area: "Desarrollo Humano", lastAccess: "Hace 29 días" },
];

export const areaParticipation = [
  { area: "Secretaría de Comunicación", users: 6, active: 6, percentage: 100 },
  { area: "Ministerio de Salud", users: 8, active: 6, percentage: 75 },
  { area: "Secretaría de Hacienda", users: 7, active: 4, percentage: 57 },
  { area: "Desarrollo Humano", users: 6, active: 3, percentage: 50 },
  { area: "Secretaría de Ambiente", users: 5, active: 2, percentage: 40 },
];

export const directoryStatus = [
  { value: 50, label: "Integrantes totales", icon: "users" as const, tone: "blue" as const },
  { value: 47, label: "Con celular", icon: "phone" as const, tone: "cyan" as const },
  { value: 50, label: "Con mail", icon: "mail" as const, tone: "green" as const },
  { value: 38, label: "Con edificio", icon: "building" as const, tone: "blue" as const },
  { value: 21, label: "Con foto de perfil", icon: "photo" as const, tone: "violet" as const },
];

export const recentActivity = [
  { text: "Paula Cornejo abrió “Plan de Reconocimiento”", time: "16:42", icon: "open" as const, tone: "violet" as const },
  { text: "Juan Rodríguez ingresó al HUB", time: "16:37", icon: "login" as const, tone: "blue" as const },
  { text: "Laura Méndez descargó “Bitácora de dinámicas 2023”", time: "16:29", icon: "download" as const, tone: "cyan" as const },
  { text: "Admin Hub publicó un nuevo recurso", time: "16:14", icon: "publish" as const, tone: "blue" as const },
  { text: "Natalia Sosa abrió “Ejes de Trabajo”", time: "15:58", icon: "open" as const, tone: "yellow" as const },
];
