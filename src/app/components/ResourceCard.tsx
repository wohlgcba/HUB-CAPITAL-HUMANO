import { formatFileKind, formatFileSize, formatRelativeDate } from "../lib/formatters";
import type { RecentResource } from "../types/resources";

export function ResourceCard({ resource, onOpen }: { resource: RecentResource; onOpen: () => void }) {
  const file = resource.files[0];
  const thumbnailUrl = resource.coverImageUrl ?? file?.thumbnailUrl ?? null;
  const type = file ? formatFileKind(file.fileKind) : "SIN ARCHIVO";

  return (
    <div className="min-w-[220px] flex-1 snap-start lg:min-w-0">
      <button
        type="button"
        onClick={onOpen}
        className="flex h-[115px] w-full gap-3 rounded-[8px] border border-[#E3E8EC] bg-white p-3 text-left transition hover:border-[#B9C7D1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005CB9]"
      >
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="h-[92px] w-[63px] shrink-0 rounded-[3px] border border-[#E3E8EC] object-cover" />
        ) : (
          <span className="flex h-[92px] w-[63px] shrink-0 items-center justify-center rounded-[3px] bg-[#153244] px-1 text-center text-[10px] font-extrabold text-white">
            {type}
          </span>
        )}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <h3 className="line-clamp-3 text-[11px] font-extrabold leading-[1.25] text-[#153244]">{resource.title}</h3>
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-[3px] bg-[#EEF1F3] px-2 py-1 text-[10px] font-extrabold text-[#5F6B76]">{type}</span>
            <span className="text-[11px] font-semibold text-[#5F6B76]">{file ? formatFileSize(file.fileSizeBytes) : ""}</span>
          </div>
        </div>
      </button>
      <p className="mt-3 text-right text-[11px] font-semibold text-[#7C8792]">{formatRelativeDate(resource.publishedAt)}</p>
    </div>
  );
}
