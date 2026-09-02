import { useEffect, useId, useState } from "react";
import { resourceReactionEmojis, type ResourceReaction, type ResourceReactionSummary } from "../types/resources";
import { AppIcon } from "./AppIcon";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type Props = { resourceTitle: string; summary?: ResourceReactionSummary; canViewReactors?: boolean; onChange: (reaction: ResourceReaction | null) => Promise<void> };
const emptySummary: ResourceReactionSummary = { counts: {}, userReaction: null };

export function ResourceReactions({ resourceTitle, summary, canViewReactors = false, onChange }: Props) {
  const [local, setLocal] = useState<ResourceReactionSummary>(summary ?? emptySummary);
  const [pending, setPending] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showReactors, setShowReactors] = useState(false);
  const reactorDetailsId = useId();
  useEffect(() => { if (!pending) setLocal(summary ?? emptySummary); }, [pending, summary]);

  const active = resourceReactionEmojis.filter((reaction) => (local.counts[reaction] ?? 0) > 0);
  const reactors = resourceReactionEmojis.flatMap((reaction) => {
    const actors = local.reactors?.[reaction] ?? [];
    return actors.length ? [{ reaction, actors }] : [];
  });

  const react = async (reaction: ResourceReaction) => {
    if (pending) return;
    const previous = local;
    const next = local.userReaction === reaction ? null : reaction;
    setLocal(updateSummary(previous, next));
    setPickerOpen(false);
    setPending(true);
    try { await onChange(next); } catch { setLocal(previous); } finally { setPending(false); }
  };

  return <div className="mt-4 border-t border-[#E8ECEF] pt-3">
    <p className="mb-2 text-[11px] font-extrabold uppercase text-[#5F6B76]">Reacciones</p>
    <div className="flex max-w-full flex-wrap gap-1.5" role="group" aria-label={`Reacciones a ${resourceTitle}`}>
      {active.map((reaction) => <ReactionButton key={reaction} reaction={reaction} count={local.counts[reaction] ?? 0} selected={local.userReaction === reaction} pending={pending} onClick={react} />)}
      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          <button type="button" disabled={pending} aria-label="Elegir una reacción" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#AFC0CC] bg-white text-[#153244] transition-colors hover:border-[#0072BC] hover:bg-[#EAF4FB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0072BC] disabled:opacity-60"><AppIcon name="reaction" size={20} /></button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" sideOffset={8} collisionPadding={12} className="z-[300] w-auto rounded-[10px] border border-[#C7D1DA] bg-white p-2 text-[#153244] shadow-[0_14px_35px_rgba(21,50,68,0.2)]">
          <div className="grid grid-cols-5 gap-1" role="group" aria-label="Opciones de reacción">
            {resourceReactionEmojis.map((reaction) => <button key={reaction} type="button" disabled={pending} onClick={() => void react(reaction)} aria-label={`Reaccionar con ${reaction}`} aria-pressed={local.userReaction === reaction} className={`flex h-11 w-11 items-center justify-center rounded-full text-[21px] transition-colors hover:bg-[#F2F6F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0072BC] ${local.userReaction === reaction ? "bg-[#EAF4FB] ring-1 ring-[#0072BC]" : ""}`}>{reaction}</button>)}
          </div>
        </PopoverContent>
      </Popover>
    </div>
    {canViewReactors && reactors.length ? <div className="mt-2"><button type="button" onClick={() => setShowReactors((value) => !value)} aria-expanded={showReactors} aria-controls={reactorDetailsId} className="inline-flex min-h-11 items-center gap-2 text-[12px] font-extrabold text-[#005CB9]"><AppIcon name="users" size={17} />{showReactors ? "Ocultar quién reaccionó" : "Ver quién reaccionó"}</button>{showReactors ? <ul id={reactorDetailsId} className="space-y-2 border-l-2 border-[#D9E7EF] pl-3 text-[12px]">{reactors.map(({ reaction, actors }) => <li key={reaction}><span className="mr-2 text-[18px]">{reaction}</span><strong>{actors.map((actor) => actor.fullName).join(", ")}</strong></li>)}</ul> : null}</div> : null}
  </div>;
}

function ReactionButton({ reaction, count, selected, pending, onClick }: { reaction: ResourceReaction; count: number; selected: boolean; pending: boolean; onClick: (reaction: ResourceReaction) => Promise<void> }) {
  return <button type="button" onClick={() => void onClick(reaction)} disabled={pending} aria-pressed={selected} className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-full border px-2 text-[19px] ${selected ? "border-[#0072BC] bg-[#EAF4FB]" : "border-[#D7E0E6] bg-white"}`}><span>{reaction}</span><span className="text-[11px] font-extrabold">{count}</span></button>;
}

function updateSummary(summary: ResourceReactionSummary, next: ResourceReaction | null): ResourceReactionSummary {
  const counts = { ...summary.counts };
  if (summary.userReaction) counts[summary.userReaction] = Math.max(0, (counts[summary.userReaction] ?? 1) - 1);
  if (next) counts[next] = (counts[next] ?? 0) + 1;
  return { ...summary, counts, userReaction: next };
}
