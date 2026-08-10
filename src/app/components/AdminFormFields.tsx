export const adminInputClass =
  "min-h-11 w-full rounded-[8px] border border-[#C7D1DA] bg-white px-3.5 text-[14px] font-semibold text-[#153244] outline-none transition placeholder:text-[#8B98A4] focus:border-[#21AFC0] focus:ring-4 focus:ring-[#8DE2D6]/30 disabled:bg-[#F2F4F6] disabled:text-[#7C8893]";

export const adminTextAreaClass = `${adminInputClass} min-h-[108px] resize-y py-3 leading-[1.45]`;

export function AdminField({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-[12px] font-extrabold text-[#153244]">
        {label}{required ? <span className="ml-1 text-[#C83232]">*</span> : null}
      </span>
      {children}
      {error ? <span className="mt-1.5 block text-[12px] font-bold text-[#C83232]">{error}</span> : hint ? <span className="mt-1.5 block text-[11px] font-semibold leading-[1.4] text-[#6F7D88]">{hint}</span> : null}
    </label>
  );
}

export function AdminSwitch({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-[62px] cursor-pointer items-center justify-between gap-4 rounded-[9px] border border-[#DCE3E8] bg-[#FAFBFC] px-4 py-3">
      <span>
        <span className="block text-[13px] font-extrabold text-[#153244]">{label}</span>
        <span className="mt-0.5 block text-[11px] font-semibold leading-[1.35] text-[#6F7D88]">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-[#AEBAC4] transition peer-checked:bg-[#0072BC] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0072BC] after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}
