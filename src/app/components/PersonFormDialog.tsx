import { useEffect, useState } from "react";
import type { AdminPersonInput } from "../types/admin";
import type { DirectoryFilterOptions, DirectoryPersonDetail } from "../types/directory";
import { AdminForm } from "./AdminForm";
import { AdminField, AdminSwitch, adminInputClass } from "./AdminFormFields";

type PersonFormDialogProps = {
  open: boolean;
  person?: DirectoryPersonDetail | null;
  options: DirectoryFilterOptions;
  loading?: boolean;
  onCancel: () => void;
  onSubmitRequest: (person: AdminPersonInput) => void;
};

type PersonFormState = {
  name: string;
  area: string;
  role: string;
  linkTypeIds: string[];
  phone: string;
  email: string;
  building: string;
  cuit: string;
  isActive: boolean;
  systemRole: "user" | "admin";
};

export function PersonFormDialog({
  open,
  person = null,
  options,
  loading = false,
  onCancel,
  onSubmitRequest,
}: PersonFormDialogProps) {
  const [form, setForm] = useState<PersonFormState>(() => createInitialState(person));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setForm(createInitialState(person));
    setErrors({});
  }, [open, person]);

  const update = <K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const toggleLinkType = (linkTypeId: string) => {
    setForm((current) => ({
      ...current,
      linkTypeIds: current.linkTypeIds.includes(linkTypeId)
        ? current.linkTypeIds.filter((id) => id !== linkTypeId)
        : [...current.linkTypeIds, linkTypeId],
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(form, Boolean(person), Boolean(person?.hasAccount));
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    onSubmitRequest({
      name: form.name.trim(),
      area: form.area.trim(),
      role: form.role.trim() || null,
      linkTypeIds: form.linkTypeIds,
      phone: form.phone.trim() || null,
      email: form.email.trim().toLowerCase() || null,
      building: form.building.trim() || null,
      cuit: form.cuit.replace(/\D/g, "") || null,
      isActive: form.isActive,
      systemRole: form.systemRole,
    });
  };

  return (
    <AdminForm
      open={open}
      title={person ? "Editar persona" : "Añadir persona"}
      description={person ? "Actualizá los datos del Directorio y del acceso al HUB." : "El email será el usuario y el CUIT la contraseña temporal inicial."}
      submitLabel={person ? "Continuar" : "Añadir persona"}
      loading={loading}
      wide
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      <datalist id="directory-area-options">
        {options.areas.map((option) => <option key={option.value} value={option.value} />)}
      </datalist>
      <datalist id="directory-building-options">
        {options.buildings.map((option) => <option key={option.value} value={option.value} />)}
      </datalist>

      <div className="grid gap-5 sm:grid-cols-2">
        <AdminField label="Nombre" required error={errors.name}>
          <input value={form.name} onChange={(event) => update("name", event.target.value)} className={adminInputClass} maxLength={160} />
        </AdminField>
        <AdminField label="Área" required error={errors.area}>
          <input value={form.area} onChange={(event) => update("area", event.target.value)} list="directory-area-options" className={adminInputClass} maxLength={180} />
        </AdminField>
        <AdminField label="Rol" error={errors.role}>
          <input value={form.role} onChange={(event) => update("role", event.target.value)} className={adminInputClass} maxLength={180} placeholder="Sin especificar" />
        </AdminField>
        <AdminField label="Celular" error={errors.phone}>
          <input value={form.phone} onChange={(event) => update("phone", event.target.value)} className={adminInputClass} maxLength={80} inputMode="tel" />
        </AdminField>
        <AdminField label="Mail" required={!person || person.hasAccount} error={errors.email}>
          <input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} className={adminInputClass} maxLength={320} autoComplete="off" />
        </AdminField>
        <AdminField label="CUIT" required={!person} hint={person?.hasAccount ? "Cambiar el CUIT no modifica la contraseña personal actual." : "11 dígitos. Se usará solo como contraseña temporal inicial."} error={errors.cuit}>
          <input value={form.cuit} onChange={(event) => update("cuit", event.target.value)} className={adminInputClass} maxLength={14} inputMode="numeric" autoComplete="off" />
        </AdminField>
        <AdminField label="Edificio GCBA" error={errors.building}>
          <input value={form.building} onChange={(event) => update("building", event.target.value)} list="directory-building-options" className={adminInputClass} maxLength={200} />
        </AdminField>
        <AdminField label="Rol del sistema" required error={errors.systemRole}>
          <select value={form.systemRole} onChange={(event) => update("systemRole", event.target.value as "user" | "admin")} className={adminInputClass}>
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </AdminField>
        <div className="sm:col-span-2">
          <fieldset>
            <legend className="mb-2 text-[12px] font-extrabold text-[#153244]">Tipo de enlace</legend>
            <div className="grid gap-2 rounded-[9px] border border-[#DCE3E8] bg-[#FAFBFC] p-3 sm:grid-cols-2 lg:grid-cols-3">
              {options.linkTypes.map((option) => (
                <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[7px] px-2 hover:bg-white">
                  <input type="checkbox" checked={form.linkTypeIds.includes(option.value)} onChange={() => toggleLinkType(option.value)} className="h-4 w-4 accent-[#0072BC]" />
                  <span className="rounded-[4px] px-2.5 py-1 text-[11px] font-extrabold text-[#153244]" style={{ backgroundColor: option.color }}>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="sm:col-span-2">
          <AdminSwitch checked={form.isActive} onChange={(checked) => update("isActive", checked)} label={form.isActive ? "Usuario activo" : "Usuario inactivo"} description={form.isActive ? "Puede ingresar al HUB cuando tiene una cuenta vinculada." : "No podrá acceder hasta ser reactivado."} />
        </div>
      </div>
    </AdminForm>
  );
}

function createInitialState(person: DirectoryPersonDetail | null | undefined): PersonFormState {
  return {
    name: person?.name ?? "",
    area: person?.area ?? "",
    role: person?.role ?? "",
    linkTypeIds: person?.linkTypes.map((linkType) => linkType.id) ?? [],
    phone: person?.phone ?? "",
    email: person?.email ?? "",
    building: person?.building ?? "",
    cuit: person?.cuit ?? "",
    isActive: person?.isActive ?? true,
    systemRole: person?.systemRole ?? "user",
  };
}

function validate(form: PersonFormState, isEditing: boolean, hasAccount: boolean) {
  const errors: Record<string, string> = {};
  const email = form.email.trim();
  const cuit = form.cuit.replace(/\D/g, "");
  if (!form.name.trim()) errors.name = "Ingresá el nombre.";
  if (!form.area.trim()) errors.area = "Ingresá el área.";
  if (!isEditing && !email) errors.email = "Ingresá el email.";
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Ingresá un email válido.";
  if (!isEditing && !cuit) errors.cuit = "Ingresá el CUIT.";
  if (hasAccount && !email) errors.email = "Una cuenta vinculada debe conservar su email.";
  if (cuit && !isValidCuit(cuit)) errors.cuit = "Ingresá un CUIT válido.";
  if (form.systemRole === "admin" && (!email || !cuit)) errors.systemRole = "Un administrador necesita email y CUIT.";
  return errors;
}

function isValidCuit(value: string) {
  if (!/^\d{11}$/.test(value)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const sum = value.slice(0, 10).split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
  const result = 11 - (sum % 11);
  return (result === 11 ? 0 : result === 10 ? 9 : result) === Number(value.at(-1));
}
