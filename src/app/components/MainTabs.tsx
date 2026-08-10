import { useState } from "react";
import type { AppIconName } from "./AppIcon";
import { AppIcon } from "./AppIcon";

const userTabs: Array<{ id: string; label: string; icon: AppIconName }> = [
  { id: "hub", label: "HUB", icon: "home" },
  { id: "directorio", label: "Directorio", icon: "usersGroup" },
  { id: "mapa", label: "Mapa", icon: "mapPin" },
];

const adminTabs: Array<{ id: string; label: string; icon: AppIconName }> = [
  { id: "hub", label: "HUB", icon: "home" },
  { id: "directorio", label: "Directorio", icon: "usersGroup" },
  { id: "metricas", label: "Métricas", icon: "chart" },
];

type MainTabsProps = {
  active?: string;
  isAdmin?: boolean;
  onChange?: (tab: string) => void;
};

export function MainTabs({ active: activeProp, isAdmin = false, onChange }: MainTabsProps) {
  const [internalActive, setInternalActive] = useState("directorio");
  const active = activeProp ?? internalActive;
  const tabs = isAdmin ? adminTabs : userTabs;

  function handleChange(tab: string) {
    setInternalActive(tab);
    onChange?.(tab);
  }

  return (
    <nav className="h-[52px] w-screen max-w-full overflow-hidden border-b border-[#D8E0E6] bg-white">
      <div className="mx-auto flex h-full w-full max-w-[1672px] items-center px-0 sm:px-4">
        <div className="grid h-full w-full grid-cols-3 sm:max-w-[720px]">
          {tabs.map((tab) => {
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleChange(tab.id)}
                className={[
                  "relative flex h-full min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden px-1 text-[12px] font-bold leading-tight sm:flex-row sm:gap-2 sm:text-[15px]",
                  isActive ? "text-[#153244]" : "text-[#5F6B76]",
                ].join(" ")}
              >
                <AppIcon name={tab.icon} className="shrink-0" />
                <span className="min-w-0 truncate">{tab.label}</span>
                {isActive && <span className="absolute bottom-0 left-0 h-[4px] w-full rounded-t bg-[#FFCC00]" />}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
