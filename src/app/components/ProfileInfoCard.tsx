import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

export function ProfileInfoCard({ icon, label, value }: { icon: AppIconName; label: string; value: string | null | undefined }) {
  return (
    <div className="grid min-h-[86px] grid-cols-[24px_minmax(0,1fr)] gap-3 rounded-[9px] border border-[#D8E0E6] bg-[#FCFCFC] px-4 py-4">
      <AppIcon name={icon} size={21} className="mt-0.5 text-[#0072BC]" />
      <div className="min-w-0">
        <p className="text-[12px] font-bold text-[#5F6B76]">{label}</p>
        <p className="mt-1 break-words text-[14px] font-extrabold leading-snug text-[#153244]">{value || "Sin especificar"}</p>
      </div>
    </div>
  );
}
