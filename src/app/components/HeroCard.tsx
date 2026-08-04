import { AppIcon } from "./AppIcon";

export function HeroCard() {
  return (
    <section className="relative flex min-h-[300px] flex-col overflow-hidden rounded-[14px] bg-[#062A43] px-6 py-8 text-white shadow-[0_2px_10px_rgba(21,50,68,0.08)] sm:px-10 sm:py-10 md:min-h-[350px] xl:min-h-[380px] xl:px-14 xl:py-14">
      <HeroArt />
      <div className="relative z-10 max-w-[520px]">
        <h2 className="text-[clamp(30px,3.2vw,44px)] font-extrabold leading-[1.18]">
          Bienvenida al HUB de la
          <br />
          Red de Capital Humano
        </h2>
      </div>
      <div className="relative z-10 mt-auto flex max-w-[760px] flex-wrap items-center gap-x-9 gap-y-5 pt-12 xl:flex-nowrap xl:gap-x-10">
        <Stat icon="usersGroup" value="50" label="Integrantes en la red" />
        <Divider />
        <Stat icon="fileText" value="120+" label="Recursos disponibles" />
        <Divider />
        <Stat icon="target" value="8" label="Iniciativas y secciones" />
      </div>
    </section>
  );
}

type StatProps = {
  icon: "usersGroup" | "fileText" | "target";
  value: string;
  label: string;
};

function Stat({ icon, value, label }: StatProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AppIcon name={icon} size={42} stroke={1.8} className="shrink-0 text-[#42DCE4]" />
      <div className="min-w-0">
        <div className="text-[32px] font-extrabold leading-none text-[#42DCE4]">{value}</div>
        <div className="mt-2 max-w-[124px] text-[14px] font-semibold leading-[1.2] text-white">{label}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-[62px] w-px shrink-0 bg-white/45 sm:block" />;
}

function HeroArt() {
  const dots = Array.from({ length: 88 }, (_, index) => index);

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] overflow-hidden sm:block">
      <div className="absolute right-[40%] top-[18px] grid grid-cols-11 gap-[8px]">
        {dots.map((dot) => (
          <span key={dot} className="h-[2px] w-[2px] rounded-full bg-[#33B9C8]/55" />
        ))}
      </div>
      <div className="absolute right-[-34px] top-[-138px] h-[440px] w-[440px] rounded-full border border-white/25" />
      <div className="absolute right-[118px] top-[100px] h-[360px] w-[360px] rounded-full border border-white/25" />
      <div className="absolute right-[230px] top-[142px] h-[185px] w-[185px] rounded-full bg-[#4BCFE0]/15" />
      <div className="absolute right-[-78px] bottom-[-72px] h-[278px] w-[278px] rounded-full bg-[#42DCE4]/75" />
      <div className="absolute right-[265px] top-[72px] flex h-[140px] w-[140px] items-center justify-center rounded-full bg-[#42C8D6]">
        <span className="flex h-[82px] w-[82px] items-center justify-center rounded-full bg-[#FFCC00] text-[#153244]">
          <AppIcon name="usersGroup" size={45} stroke={1.8} />
        </span>
      </div>
    </div>
  );
}
