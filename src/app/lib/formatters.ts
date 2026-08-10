import type { ResourceFileKind } from "../types/resources";

const dateFormatter = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" });
const relativeFormatter = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });

export function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin fecha" : dateFormatter.format(date);
}

export function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  const now = new Date();
  const differenceInDays = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (Math.abs(differenceInDays) <= 30) return relativeFormatter.format(differenceInDays, "day");
  return formatDate(value);
}

export function formatFileSize(bytes: number | null) {
  if (bytes === null || !Number.isFinite(bytes)) return "Tamaño no informado";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export function formatFileKind(kind: ResourceFileKind) {
  const labels: Record<ResourceFileKind, string> = {
    pdf: "PDF",
    word: "DOCX",
    powerpoint: "PPTX",
    spreadsheet: "XLSX",
    image: "IMAGEN",
    other: "ARCHIVO",
  };
  return labels[kind];
}
