import { AppIcon } from "./AppIcon";

export function DirectoryInfoPanel() {
  return (
    <aside className="space-y-4">
      <section className="rounded-[10px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
        <div className="flex items-center gap-4">
          <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#DDEBFF] text-[#005CB9]">
            <AppIcon name="usersGroup" size={28} />
          </span>
          <h2 className="text-[15px] font-extrabold text-[#153244]">Sobre el Directorio</h2>
        </div>
        <p className="mt-7 text-[12px] font-semibold leading-[1.75] text-[#153244]">
          Este directorio conecta a quienes formamos parte de la Red de Capital Humano del GCBA.
        </p>
        <p className="mt-4 text-[12px] font-semibold leading-[1.75] text-[#153244]">
          Mantener la información actualizada nos ayuda a la comunicación y al trabajo colaborativo.
        </p>
        <div className="mt-8 rounded-[8px] bg-[#DFF3FC] p-4">
          <div className="flex gap-3">
            <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border border-[#21AFC0] text-[#008BA3]">
              <AppIcon name="users" size={18} />
            </span>
            <div>
              <p className="text-[11px] font-extrabold text-[#153244]">¿Querés actualizar tus datos?</p>
              <button className="mt-2 text-[12px] font-extrabold text-[#005CB9] underline">Ir a Mi perfil</button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#E3E8EC] bg-white p-5 shadow-[0_2px_10px_rgba(21,50,68,0.04)]">
        <div className="flex items-center gap-4">
          <span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#FFF0C8] text-[#D79A00]">
            <AppIcon name="bulb" size={27} />
          </span>
          <h2 className="text-[15px] font-extrabold text-[#153244]">Consejos</h2>
        </div>
        <div className="mt-7 space-y-7">
          {[
            "Usá los filtros para encontrar rápidamente a la persona que buscás.",
            'Hacé clic en "Ver perfil" para conocer más información de contacto.',
            "Mantené tus datos actualizados desde tu perfil.",
          ].map((tip) => (
            <p key={tip} className="grid grid-cols-[18px_1fr] gap-4 text-[12px] font-semibold leading-[1.5] text-[#153244]">
              <span className="text-[#153244]">✓</span>
              <span>{tip}</span>
            </p>
          ))}
        </div>
      </section>
    </aside>
  );
}
