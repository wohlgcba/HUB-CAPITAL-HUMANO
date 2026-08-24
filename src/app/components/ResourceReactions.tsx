import { useState } from "react";
import {
  resourceReactionEmojis,
  type ResourceReaction,
  type ResourceReactionSummary,
} from "../types/resources";

type ResourceReactionsProps = {
  resourceTitle: string;
  summary?: ResourceReactionSummary;
  onChange: (reaction: ResourceReaction | null) => Promise<void>;
};

export function ResourceReactions({ resourceTitle, summary, onChange }: ResourceReactionsProps) {
  const [pending, setPending] = useState<ResourceReaction | null | undefined>();

  const handleReaction = async (reaction: ResourceReaction) => {
    if (pending !== undefined) return;
    const nextReaction = summary?.userReaction === reaction ? null : reaction;
    setPending(reaction);
    try {
      await onChange(nextReaction);
    } finally {
      setPending(undefined);
    }
  };

  return (
    <div className="mt-4 border-t border-[#E8ECEF] pt-3">
      <p className="mb-2 text-[11px] font-extrabold uppercase text-[#5F6B76]">Reacciones</p>
      <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1" role="group" aria-label={`Reacciones a ${resourceTitle}`}>
        {resourceReactionEmojis.map((reaction) => {
          const selected = summary?.userReaction === reaction;
          const count = summary?.counts[reaction] ?? 0;
          return (
            <button
              key={reaction}
              type="button"
              onClick={() => void handleReaction(reaction)}
              disabled={pending !== undefined}
              aria-pressed={selected}
              aria-label={selected ? `Quitar reacción ${reaction}` : `Reaccionar con ${reaction}`}
              className={`inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-full border px-2 text-[19px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC] disabled:cursor-wait disabled:opacity-60 ${selected ? "border-[#0072BC] bg-[#EAF4FB]" : "border-[#D7E0E6] bg-white hover:bg-[#F5F8FA]"}`}
            >
              <span aria-hidden="true">{reaction}</span>
              {count > 0 ? <span className="text-[11px] font-extrabold text-[#153244]">{count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
