import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

type FilterChipProps = {
  label: string;
  icon: AppIconName;
  active?: boolean;
  onClick: () => void;
};

export function FilterChip({ label, icon, active = false, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={[
        "flex min-h-11 items-center gap-2 rounded-[8px] border px-4 text-[14px] font-semibold transition-colors",
        active ? "border-[#153244] bg-[#153244] text-white" : "border-[#D8E0E6] bg-white text-[#153244] hover:border-[#153244]",
      ].join(" ")}
    >
      <AppIcon name={icon} size={20} stroke={1.8} />
      {label}
    </button>
  );
}
