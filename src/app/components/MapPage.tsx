import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression } from "leaflet";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { AppIcon } from "./AppIcon";

export interface BuildingLocation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  peopleCount: number;
}

export const buildingLocations: BuildingLocation[] = [];

const cabaCenter: [number, number] = [-34.6037, -58.3816];

const cabaBounds: LatLngBoundsExpression = [
  [-34.72, -58.56],
  [-34.51, -58.32],
];

export function MapPage() {
  const peopleCount = 24;
  const buildingCount = buildingLocations.length;
  const linkTypeCount = 0;

  return (
    <main className="mx-auto w-screen max-w-[1888px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(280px,1fr)_minmax(360px,535px)]">
        <div>
          <h1 className="text-[31px] font-extrabold leading-none text-[#061947]">Mapa 2026</h1>
          <p className="mt-4 text-[13px] font-semibold text-[#153244]">
            Ubicación de los enlaces en edificios y oficinas del GCBA dentro de la Ciudad de Buenos Aires.
          </p>
        </div>
        <MapToolbar />
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(300px,355px)]">
        <section className="min-w-0">
          <div className="h-[380px] overflow-hidden rounded-[12px] border border-[#D7E0E7] bg-white shadow-[0_2px_10px_rgba(21,50,68,0.05)] sm:h-[420px] md:h-[460px] xl:h-[540px]">
            <MapContainer
              center={cabaCenter}
              zoom={12}
              minZoom={11}
              maxZoom={16}
              maxBounds={cabaBounds}
              maxBoundsViscosity={0.75}
              scrollWheelZoom
              zoomControl
              className="z-0 h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FullscreenControl />
            </MapContainer>
          </div>

          <section className="mt-5 rounded-[12px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] sm:p-6">
            <h2 className="text-[15px] font-extrabold text-[#153244]">Edificios destacados</h2>
            <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="min-w-[240px] snap-start rounded-[9px] border border-dashed border-[#C7D1DA] bg-[#FCFCFC] px-5 py-6 text-[13px] font-semibold text-[#5F6B76] sm:min-w-0 sm:flex-1">
                Sin edificios cargados todavía.
              </div>
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <SummaryPanel peopleCount={peopleCount} buildingCount={buildingCount} linkTypeCount={linkTypeCount} />
          <ReferencesPanel />
          <SelectedBuildingPanel />
        </aside>
      </div>
    </main>
  );
}

function FullscreenControl() {
  const map = useMap();

  function toggleFullscreen() {
    const container = map.getContainer();
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void container.requestFullscreen();
  }

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className="absolute left-[10px] top-[82px] z-[1000] flex h-11 w-11 items-center justify-center rounded-[4px] border border-[#C7D1DA] bg-white text-[#153244] shadow-[0_1px_4px_rgba(21,50,68,0.16)]"
      aria-label="Pantalla completa"
    >
      <span className="text-[18px] font-extrabold leading-none">⛶</span>
    </button>
  );
}

function MapToolbar() {
  return (
    <div>
      <div className="flex min-h-11 items-center gap-3 rounded-[8px] border border-[#C7D1DA] bg-white px-4 shadow-[0_1px_4px_rgba(21,50,68,0.03)]">
        <AppIcon name="search" size={21} className="text-[#153244]" />
        <input
          className="min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#153244] outline-none placeholder:text-[#6D7A86]"
          placeholder="Buscar edificio, área o persona..."
        />
      </div>
      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap sm:items-center">
        <FilterButton label="Área" />
        <FilterButton label="Tipo de enlace" />
        <FilterButton label="Edificio GCBA" />
        <button className="flex min-h-11 w-full items-center gap-2 text-[13px] font-bold text-[#005CB9] sm:ml-auto sm:w-auto">
          <AppIcon name="refresh" size={18} />
          Limpiar filtros
        </button>
      </div>
    </div>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button className="flex min-h-11 w-full min-w-0 items-center justify-between gap-6 rounded-[10px] border border-[#C7D1DA] bg-white px-4 text-[13px] font-extrabold text-[#153244] shadow-[0_1px_4px_rgba(21,50,68,0.03)] transition hover:border-[#21AFC0] hover:bg-[#FCFCFC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#21AFC0] sm:w-auto sm:min-w-[150px]">
      {label}
      <AppIcon name="chevronDown" size={16} />
    </button>
  );
}

function SummaryPanel({
  peopleCount,
  buildingCount,
  linkTypeCount,
}: {
  peopleCount: number;
  buildingCount: number;
  linkTypeCount: number;
}) {
  return (
    <section className="rounded-[12px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] sm:p-6">
      <h2 className="text-[15px] font-extrabold text-[#153244]">Resumen</h2>
      <div className="mt-7 grid grid-cols-3 divide-x divide-[#E3E8EC]">
        <SummaryItem icon="usersGroup" color="text-[#21AFC0]" value={peopleCount} label="integrantes" />
        <SummaryItem icon="building" color="text-[#0072BC]" value={buildingCount} label="edificios" />
        <SummaryItem icon="target" color="text-[#7A62C5]" value={linkTypeCount} label="tipos de enlace" />
      </div>
    </section>
  );
}

function SummaryItem({
  icon,
  color,
  value,
  label,
}: {
  icon: "usersGroup" | "building" | "target";
  color: string;
  value: number;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <AppIcon name={icon} size={32} className={color} />
      <strong className="mt-3 text-[25px] font-extrabold leading-none text-[#061947]">{value}</strong>
      <span className="mt-3 text-[13px] font-semibold text-[#153244]">{label}</span>
    </div>
  );
}

function ReferencesPanel() {
  return (
    <section className="rounded-[12px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] sm:p-6">
      <h2 className="text-[15px] font-extrabold text-[#153244]">Referencias</h2>
      <div className="mt-5 space-y-4">
        <Reference color="text-[#21AFC0]" label="Capital Humano" />
        <Reference color="text-[#FFBE19]" label="Comunicación Interna" />
        <Reference color="text-[#7A62C5]" label="Discapacidad" />
      </div>
    </section>
  );
}

function Reference({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-4 text-[13px] font-semibold text-[#153244]">
      <AppIcon name="mapPin" size={24} className={color} />
      {label}
    </div>
  );
}

function SelectedBuildingPanel() {
  return (
    <section className="rounded-[12px] border border-[#E3E8EC] bg-white p-4 shadow-[0_2px_10px_rgba(21,50,68,0.04)] sm:p-6">
      <h2 className="text-[15px] font-extrabold text-[#153244]">Edificio seleccionado</h2>
      <div className="mt-6 rounded-[9px] border border-dashed border-[#C7D1DA] bg-[#FCFCFC] px-5 py-6">
        <div className="flex items-start gap-3">
          <AppIcon name="mapPin" size={26} className="text-[#21AFC0]" />
          <div>
            <h3 className="text-[17px] font-extrabold text-[#061947]">Sin edificio seleccionado</h3>
            <p className="mt-2 text-[12px] font-semibold leading-[1.5] text-[#5F6B76]">
              Edificios reales se agregarán después usando estructura tipada.
            </p>
          </div>
        </div>
      </div>
      <button className="mt-5 min-h-11 w-full rounded-[5px] border border-[#005CB9] text-[13px] font-extrabold text-[#005CB9]">
        Ver personas
      </button>
    </section>
  );
}
