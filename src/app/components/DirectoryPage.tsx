import { useCallback, useMemo, useRef, useState } from "react";
import { AppIcon } from "./AppIcon";
import { DirectoryFilters } from "./DirectoryFilters";
import { DirectoryInfoPanel } from "./DirectoryInfoPanel";
import { DirectorySearch } from "./DirectorySearch";
import { PersonCard, type DirectoryPerson } from "./PersonCard";
import { PersonDetailModal } from "./PersonDetailModal";

const pageSize = 10;

const people: DirectoryPerson[] = [
  {
    id: "paula-cornejo",
    initials: "PC",
    name: "Paula Cornejo",
    area: "SECRETARÍA DE COMUNICACIÓN",
    role: "Referente institucional",
    phone: "11 5575-3622",
    email: "paulacorn83@gmail.com",
    building: "Sin especificar",
    linkTypes: ["Capital Humano", "Comunicación Interna"],
    avatar: "bg-[#BFEFED]",
  },
  {
    id: "laura-mendez",
    initials: "LM",
    name: "Laura Méndez",
    area: "MINISTERIO DE SALUD",
    role: "Analista de RRHH",
    phone: "11 4411-2233",
    email: "laura.mendez@buenosaires.gob.ar",
    building: "Edificio Uspallata Uspallata 3100",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FFD957]",
  },
  {
    id: "juan-rodriguez",
    initials: "JR",
    name: "Juan Rodríguez",
    area: "MINISTERIO DE EDUCACIÓN",
    role: "Referente de Capacitación",
    phone: "11 3305-7788",
    email: "juan.rodriguez@buenosaires.gob.ar",
    building: "Edificio de GCBA Paseo Colón Av. Paseo Colón 255",
    linkTypes: ["Discapacidad"],
    avatar: "bg-[#D4C2EF]",
  },
  {
    id: "maria-clara-silva",
    initials: "MC",
    name: "María Clara Silva",
    area: "SECRETARÍA DE HACIENDA",
    role: "Coordinadora de Gestión",
    phone: "11 5599-4655",
    email: "mc.silva@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#C8F0DF]",
  },
  {
    id: "agustin-fernandez",
    initials: "AF",
    name: "Agustín Fernández",
    area: "SECRETARÍA DE AMBIENTE",
    role: "Referente Institucional",
    phone: "11 6577-8899",
    email: "afernandez@buenosaires.gob.ar",
    building: "Edificio Los Patos Av. Del Libertador 4050",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FFD7C9]",
  },
  {
    id: "natalia-sosa",
    initials: "NS",
    name: "Natalia Sosa",
    area: "MINISTERIO DE DESARROLLO HUMANO",
    role: "Analista de Programas",
    phone: "11 2233-9900",
    email: "natalia.sosa@buenosaires.gob.ar",
    building: "Esteban de Luca Av. Martín García 346",
    linkTypes: ["Discapacidad"],
    avatar: "bg-[#DCEAFF]",
  },
  {
    id: "sofia-rivas",
    initials: "SR",
    name: "Sofía Rivas",
    area: "JEFATURA DE GABINETE",
    role: "Referente de Enlaces",
    phone: "11 4488-2100",
    email: "sofia.rivas@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FEE6A8]",
  },
  {
    id: "diego-castro",
    initials: "DC",
    name: "Diego Castro",
    area: "SECRETARÍA DE TRANSPORTE",
    role: "Coordinador Operativo",
    phone: "11 6188-2390",
    email: "diego.castro@buenosaires.gob.ar",
    building: "Paseo Colón Av. Paseo Colón 255",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#BFEFED]",
  },
  {
    id: "camila-torres",
    initials: "CT",
    name: "Camila Torres",
    area: "MINISTERIO DE SALUD",
    role: "Referente de Bienestar",
    phone: "11 3344-9201",
    email: "camila.torres@buenosaires.gob.ar",
    building: "Edificio Uspallata Uspallata 3100",
    linkTypes: ["Capital Humano", "Discapacidad"],
    avatar: "bg-[#AFD6F8]",
  },
  {
    id: "martin-lopez",
    initials: "ML",
    name: "Martín López",
    area: "SECRETARÍA DE COMUNICACIÓN",
    role: "Comunicación Interna",
    phone: "11 7022-1198",
    email: "martin.lopez@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#FFD957]",
  },
  {
    id: "valentina-diaz",
    initials: "VD",
    name: "Valentina Díaz",
    area: "MINISTERIO DE EDUCACIÓN",
    role: "Analista de Capacitación",
    phone: "11 5644-2788",
    email: "valentina.diaz@buenosaires.gob.ar",
    building: "Paseo Colón Av. Paseo Colón 255",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#CDE9BD]",
  },
  {
    id: "federico-nunez",
    initials: "FN",
    name: "Federico Núñez",
    area: "SECRETARÍA DE HACIENDA",
    role: "Gestión de Personas",
    phone: "11 3377-1020",
    email: "federico.nunez@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#DDF8F5]",
  },
  {
    id: "florencia-acosta",
    initials: "FA",
    name: "Florencia Acosta",
    area: "MINISTERIO DE DESARROLLO HUMANO",
    role: "Referente Institucional",
    phone: "11 4099-3821",
    email: "florencia.acosta@buenosaires.gob.ar",
    building: "Esteban de Luca Av. Martín García 346",
    linkTypes: ["Discapacidad"],
    avatar: "bg-[#D4C2EF]",
  },
  {
    id: "tomas-herrera",
    initials: "TH",
    name: "Tomás Herrera",
    area: "SECRETARÍA DE AMBIENTE",
    role: "Coordinador de Programas",
    phone: "11 5222-3890",
    email: "tomas.herrera@buenosaires.gob.ar",
    building: "Edificio Los Patos Av. Del Libertador 4050",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FFD7C9]",
  },
  {
    id: "lucia-benitez",
    initials: "LB",
    name: "Lucía Benítez",
    area: "JEFATURA DE GABINETE",
    role: "Referente de Equipo",
    phone: "11 6110-7450",
    email: "lucia.benitez@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#BFEFED]",
  },
  {
    id: "pablo-medina",
    initials: "PM",
    name: "Pablo Medina",
    area: "MINISTERIO DE SALUD",
    role: "Analista de Salud Laboral",
    phone: "11 4788-3611",
    email: "pablo.medina@buenosaires.gob.ar",
    building: "Edificio Uspallata Uspallata 3100",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#AFD6F8]",
  },
  {
    id: "carolina-ruiz",
    initials: "CR",
    name: "Carolina Ruiz",
    area: "SECRETARÍA DE COMUNICACIÓN",
    role: "Contenidos Internos",
    phone: "11 6200-9134",
    email: "carolina.ruiz@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Comunicación Interna", "Capital Humano"],
    avatar: "bg-[#FFD957]",
  },
  {
    id: "gonzalo-pereyra",
    initials: "GP",
    name: "Gonzalo Pereyra",
    area: "MINISTERIO DE EDUCACIÓN",
    role: "Referente de Formación",
    phone: "11 3566-8217",
    email: "gonzalo.pereyra@buenosaires.gob.ar",
    building: "Paseo Colón Av. Paseo Colón 255",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#CDE9BD]",
  },
  {
    id: "micaela-vidal",
    initials: "MV",
    name: "Micaela Vidal",
    area: "SECRETARÍA DE HACIENDA",
    role: "Administración de Personal",
    phone: "11 4401-7802",
    email: "micaela.vidal@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#DDF8F5]",
  },
  {
    id: "joaquin-molina",
    initials: "JM",
    name: "Joaquín Molina",
    area: "SECRETARÍA DE TRANSPORTE",
    role: "Gestión Operativa",
    phone: "11 5833-4488",
    email: "joaquin.molina@buenosaires.gob.ar",
    building: "Paseo Colón Av. Paseo Colón 255",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#BFEFED]",
  },
  {
    id: "antonella-farias",
    initials: "AF",
    name: "Antonella Farías",
    area: "MINISTERIO DE DESARROLLO HUMANO",
    role: "Inclusión y Accesibilidad",
    phone: "11 5991-2800",
    email: "antonella.farias@buenosaires.gob.ar",
    building: "Esteban de Luca Av. Martín García 346",
    linkTypes: ["Discapacidad"],
    avatar: "bg-[#D4B9EA]",
  },
  {
    id: "ramiro-salas",
    initials: "RS",
    name: "Ramiro Salas",
    area: "SECRETARÍA DE AMBIENTE",
    role: "Referente de Proyectos",
    phone: "11 6011-2034",
    email: "ramiro.salas@buenosaires.gob.ar",
    building: "Edificio Los Patos Av. Del Libertador 4050",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FFD7C9]",
  },
  {
    id: "julieta-campos",
    initials: "JC",
    name: "Julieta Campos",
    area: "JEFATURA DE GABINETE",
    role: "Coordinación Institucional",
    phone: "11 7008-3119",
    email: "julieta.campos@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Capital Humano"],
    avatar: "bg-[#FEE6A8]",
  },
  {
    id: "leandro-suarez",
    initials: "LS",
    name: "Leandro Suárez",
    area: "SECRETARÍA DE COMUNICACIÓN",
    role: "Soporte de Red",
    phone: "11 4555-9908",
    email: "leandro.suarez@buenosaires.gob.ar",
    building: "Sede Central Av. Martín García 346",
    linkTypes: ["Comunicación Interna"],
    avatar: "bg-[#DCEAFF]",
  },
];

export function DirectoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPerson, setSelectedPerson] = useState<DirectoryPerson | null>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const totalPages = Math.ceil(people.length / pageSize);
  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, people.length);
  const visiblePeople = useMemo(() => people.slice(firstItem - 1, lastItem), [firstItem, lastItem]);

  const handleViewMore = (person: DirectoryPerson, trigger: HTMLButtonElement) => {
    lastTriggerRef.current = trigger;
    setSelectedPerson(person);
  };

  const handleCloseModal = useCallback(() => {
    setSelectedPerson(null);
    window.setTimeout(() => lastTriggerRef.current?.focus(), 0);
  }, []);

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="hidden">
        <div>
          <h1 className="text-[31px] font-extrabold leading-none text-[#061947]">Directorio 2026</h1>
          <p className="mt-4 text-[13px] font-semibold text-[#153244]">
            Buscá y conectá con los integrantes de la Red de Capital Humano del GCBA.
          </p>
        </div>
        <div className="self-center">
          <DirectorySearch />
        </div>
      </div>

      <div className="xl:hidden">
        <details className="mb-4 rounded-[10px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] xl:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[15px] font-extrabold text-[#153244]">
            Filtros
            <AppIcon name="adjustments" size={20} />
          </summary>
          <div className="mt-4">
            <DirectoryFilters />
          </div>
        </details>
      </div>

      <div className="grid gap-6 xl:grid-cols-[270px_minmax(0,1fr)_270px]">
        <div className="hidden xl:block">
          <DirectoryFilters />
        </div>
        <section className="min-w-0">
          <div className="mb-4 grid items-end gap-4 lg:grid-cols-[minmax(220px,auto)_minmax(360px,620px)]">
            <div>
              <h2 className="text-[16px] font-extrabold text-[#061947]">{people.length} integrantes</h2>
              <p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">
                Mostrando {firstItem}-{lastItem} de {people.length}
              </p>
            </div>
            <div className="min-w-0">
              <DirectorySearch />
            </div>
            <span className="hidden rounded-full border border-[#E3E8EC] bg-white px-3 py-2 text-[12px] font-extrabold text-[#153244]">
              10 por página
            </span>
          </div>
          <div className="space-y-2.5">
            {visiblePeople.map((person) => (
              <PersonCard key={person.id} person={person} onViewMore={handleViewMore} />
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          <p className="mt-3 flex flex-wrap items-center justify-center gap-2 text-center text-[13px] font-semibold text-[#5F6B76]">
            <AppIcon name="clipboard" size={16} />
            Información de uso interno. No compartas credenciales ni datos sensibles.
          </p>
        </section>
        <DirectoryInfoPanel />
      </div>

      {selectedPerson && <PersonDetailModal person={selectedPerson} onClose={handleCloseModal} />}
    </main>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <nav className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Paginación del directorio">
      <PageButton disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} ariaLabel="Página anterior">
        <AppIcon name="chevronLeft" size={18} />
      </PageButton>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <PageButton key={page} active={page === currentPage} onClick={() => onPageChange(page)} ariaLabel={`Página ${page}`}>
          {page}
        </PageButton>
      ))}
      <PageButton disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} ariaLabel="Página siguiente">
        <AppIcon name="chevronRight" size={18} />
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  active,
  disabled,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`flex h-11 min-w-11 items-center justify-center rounded-[8px] border px-3 text-[13px] font-extrabold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9] ${
        active
          ? "border-[#153244] bg-[#153244] text-white"
          : "border-[#C7D1DA] bg-white text-[#153244] hover:border-[#21AFC0] hover:bg-[#DDF8F5]"
      } disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-[#C7D1DA] disabled:hover:bg-white`}
    >
      {children}
    </button>
  );
}
