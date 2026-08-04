export type DirectoryLinkType = "Capital Humano" | "Comunicación Interna" | "Discapacidad";

const badgeStyles: Record<DirectoryLinkType, string> = {
  "Capital Humano": "bg-[#BFEFED] text-[#153244]",
  "Comunicación Interna": "bg-[#FFD957] text-[#153244]",
  Discapacidad: "bg-[#D4B9EA] text-[#153244]",
};

export function LinkTypeBadge({ type }: { type: DirectoryLinkType }) {
  return <span className={`rounded-[4px] px-3 py-[3px] text-[11px] font-extrabold leading-none ${badgeStyles[type]}`}>{type}</span>;
}
