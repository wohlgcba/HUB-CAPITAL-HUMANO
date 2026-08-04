type ResourceCardProps = {
  title: string;
  type: string;
  size: string;
  date: string;
  imageUrl: string;
};

export function ResourceCard({ title, type, size, date, imageUrl }: ResourceCardProps) {
  return (
    <div className="min-w-[220px] flex-1 snap-start lg:min-w-0">
      <article className="flex h-[115px] gap-3 rounded-[8px] border border-[#E3E8EC] bg-white p-3">
        <img src={imageUrl} alt="" className="h-[92px] w-[63px] shrink-0 rounded-[3px] border border-[#E3E8EC] object-cover" />
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <h3 className="line-clamp-3 text-[11px] font-extrabold leading-[1.25] text-[#153244]">{title}</h3>
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-[3px] bg-[#EEF1F3] px-2 py-1 text-[10px] font-extrabold text-[#5F6B76]">{type}</span>
            <span className="text-[11px] font-semibold text-[#5F6B76]">{size}</span>
          </div>
        </div>
      </article>
      <p className="mt-3 text-right text-[11px] font-semibold text-[#7C8792]">{date}</p>
    </div>
  );
}
