import { IconBuilding, IconMail, IconPhone, IconPhoto, IconUsersGroup } from "@tabler/icons-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { DirectoryCompletionMetric, DirectoryStatusMetric } from "../../types/metrics";
import { MetricsPanel } from "./MetricsPanel";

const iconByType = { users: IconUsersGroup, phone: IconPhone, mail: IconMail, building: IconBuilding, photo: IconPhoto };
const toneClasses = {
  blue: "bg-[#E6F2FF] text-[#0878D1]",
  cyan: "bg-[#DDF8F5] text-[#007D95]",
  green: "bg-[#E4F7EF] text-[#16865A]",
  violet: "bg-[#F1E8FC] text-[#7D42CC]",
};

export function DirectoryStatus({ status, completion }: { status: DirectoryStatusMetric[]; completion: DirectoryCompletionMetric }) {
  const { percentage, complete, total } = completion;
  const chartData = [{ value: percentage, color: "#0878D1" }, { value: 100 - percentage, color: "#E5EBF0" }];
  return (
    <MetricsPanel title="Estado del Directorio" actionLabel="Ver directorio">
      <div className="mt-4 grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_150px]">
        <div className="space-y-2.5">
          {status.map((item) => {
            const Icon = iconByType[item.icon];
            return <div key={item.label} className="grid grid-cols-[30px_32px_minmax(0,1fr)] items-center gap-2 text-[11px] text-[#415569]"><span className={`flex h-8 w-8 items-center justify-center rounded-full ${toneClasses[item.tone]}`}><Icon size={17} /></span><strong className="text-[13px] text-[#061947]">{item.value}</strong><span className="font-semibold">{item.label}</span></div>;
          })}
        </div>
        <div className="flex flex-col items-center">
          <div className="relative h-[130px] w-[130px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={chartData} dataKey="value" innerRadius={45} outerRadius={58} startAngle={90} endAngle={-270} stroke="none">{chartData.map((entry) => <Cell key={entry.color} fill={entry.color} />)}</Pie></PieChart>
            </ResponsiveContainer>
            <strong className="absolute inset-0 flex items-center justify-center text-[25px] font-extrabold text-[#061947]">{percentage}%</strong>
          </div>
          <span className="text-center text-[11px] font-semibold text-[#415569]">Perfiles completos</span>
          <strong className="mt-1 text-[12px] text-[#061947]">{complete} de {total}</strong>
        </div>
      </div>
    </MetricsPanel>
  );
}
