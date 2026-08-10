import type { DirectoryLinkType } from "../types/directory";

export function LinkTypeBadge({ type }: { type: DirectoryLinkType }) {
  return (
    <span
      className="rounded-[4px] px-3 py-[3px] text-[11px] font-extrabold leading-none text-[#153244]"
      style={{ backgroundColor: type.color }}
    >
      {type.name}
    </span>
  );
}
