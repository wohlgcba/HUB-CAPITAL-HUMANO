import type { MyProfileDetails, ProfileFormDraft } from "../types/profile";
import { AppIcon } from "./AppIcon";

type Props = {
  profile: MyProfileDetails;
  value: ProfileFormDraft;
  disabled: boolean;
  onChange: (next: ProfileFormDraft) => void;
};

export function ProfileDetailsEditor({ profile, value, disabled, onChange }: Props) {
  const update = <Key extends keyof ProfileFormDraft>(key: Key, next: ProfileFormDraft[Key]) => onChange({ ...value, [key]: next });
  const requestDisabled = disabled || Boolean(profile.pendingChangeRequest);

  return (
    <>
      <EditorSection title="Información personal" description="Estos datos se actualizan directamente.">
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField label="Nombre" required><input value={value.firstName} onChange={(event) => update("firstName", event.target.value)} disabled={disabled} autoComplete="given-name" /></ProfileField>
          <ProfileField label="Apellido" required><input value={value.lastName} onChange={(event) => update("lastName", event.target.value)} disabled={disabled} autoComplete="family-name" /></ProfileField>
          <ProfileField label="Celular"><input value={value.phone ?? ""} onChange={(event) => update("phone", event.target.value || null)} disabled={disabled} autoComplete="tel" inputMode="tel" /></ProfileField>
          <ProfileField label="Mail" required><input value={value.email} onChange={(event) => update("email", event.target.value)} disabled={disabled} autoComplete="email" type="email" /></ProfileField>
        </div>
      </EditorSection>

      <EditorSection title="Datos institucionales" description="CUIT, área, edificio y tipo de enlace requieren aprobación administrativa.">
        {profile.pendingChangeRequest ? (
          <div className="mb-4 flex gap-3 rounded-[9px] border border-[#E8C64B] bg-[#FFF9DD] px-4 py-3 text-[12px] font-bold leading-relaxed text-[#735B00]">
            <AppIcon name="alert" size={19} className="mt-0.5 shrink-0" />
            <span>Tenés una solicitud pendiente desde el {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(profile.pendingChangeRequest.createdAt))}. Podrás enviar otra cuando sea revisada.</span>
          </div>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <ProfileField label="CUIT"><input value={value.cuit} onChange={(event) => update("cuit", event.target.value)} disabled={requestDisabled} inputMode="numeric" maxLength={13} /></ProfileField>
          <ProfileField label="Área"><input value={value.area} onChange={(event) => update("area", event.target.value)} disabled={requestDisabled} /></ProfileField>
          <ProfileField label="Edificio GCBA" className="sm:col-span-2"><input value={value.building ?? ""} onChange={(event) => update("building", event.target.value || null)} disabled={requestDisabled} /></ProfileField>
        </div>
        <fieldset disabled={requestDisabled} className="mt-4 rounded-[9px] border border-[#D8E0E6] p-4 disabled:opacity-65">
          <legend className="px-1 text-[12px] font-extrabold text-[#153244]">Tipo de enlace</legend>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {profile.availableLinkTypes.map((linkType) => {
              const checked = value.linkTypeIds.includes(linkType.id);
              return <label key={linkType.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-[7px] border border-[#E3E8EC] px-3 text-[12px] font-bold"><input type="checkbox" checked={checked} onChange={() => update("linkTypeIds", checked ? value.linkTypeIds.filter((id) => id !== linkType.id) : [...value.linkTypeIds, linkType.id])} className="h-4 w-4 accent-[#0072BC]" /><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: linkType.color }} />{linkType.name}</label>;
            })}
          </div>
        </fieldset>
      </EditorSection>
    </>
  );
}

function EditorSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="mt-7"><div className="mb-3"><h4 className="text-[14px] font-extrabold uppercase text-[#153244]">{title}</h4><p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">{description}</p></div>{children}</section>;
}

function ProfileField({ label, required = false, className = "", children }: { label: string; required?: boolean; className?: string; children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>> }) {
  return <label className={`block text-[12px] font-extrabold text-[#153244] ${className}`}>{label}{required ? <span className="text-[#C93B3B]"> *</span> : null}<span className="mt-2 block [&>input]:min-h-11 [&>input]:w-full [&>input]:rounded-[8px] [&>input]:border [&>input]:border-[#C7D1DA] [&>input]:bg-white [&>input]:px-3 [&>input]:text-[13px] [&>input]:font-semibold [&>input]:outline-none [&>input]:focus:border-[#0072BC] [&>input]:focus:ring-2 [&>input]:focus:ring-[#0072BC]/20 [&>input]:disabled:bg-[#F2F4F5]">{children}</span></label>;
}
