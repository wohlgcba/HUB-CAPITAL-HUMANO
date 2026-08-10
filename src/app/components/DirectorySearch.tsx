import { AppIcon } from "./AppIcon";

export function DirectorySearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex min-h-11 items-center gap-3 rounded-[8px] border border-[#C7D1DA] bg-white px-4 shadow-[0_1px_4px_rgba(21,50,68,0.03)]">
      <AppIcon name="search" size={21} className="text-[#153244]" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Buscar integrantes"
        className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#153244] outline-none placeholder:text-[#6D7A86]"
        placeholder="Buscar por nombre, área, mail o edificio..."
      />
    </div>
  );
}
