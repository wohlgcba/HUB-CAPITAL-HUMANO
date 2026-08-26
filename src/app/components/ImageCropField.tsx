import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { validateSectionBanner } from "../services/storageService";
import { AppIcon } from "./AppIcon";

type Props = {
  label: string;
  currentUrl?: string | null;
  value: File | null;
  disabled?: boolean;
  error?: string;
  onChange: (file: File | null) => void;
};

type Position = { x: number; y: number };

export function ImageCropField({ label, currentUrl = null, value, disabled = false, error, onChange }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const selectFile = (file: File | null) => {
    if (!file) return;
    try {
      validateSectionBanner(file);
      const url = URL.createObjectURL(file);
      setSource({ file, url });
    } catch (validationError) {
      toast.error("Imagen no válida", { description: validationError instanceof Error ? validationError.message : "Revisá el archivo." });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return <div>
    <div className={`overflow-hidden rounded-[9px] border bg-[#F2F5F7] ${error ? "border-[#C93B3B]" : "border-[#C7D1DA]"}`}>
      <div className="relative aspect-[16/9] max-h-[250px] w-full overflow-hidden bg-[#DCE6EC]">
        {previewUrl || currentUrl ? <img src={previewUrl || currentUrl || ""} alt={`Vista previa de ${label}`} className="h-full w-full object-cover" /> : <div className="flex h-full min-h-[150px] flex-col items-center justify-center gap-2 text-[#5F6B76]"><AppIcon name="photo" size={34} /><span className="text-[12px] font-bold">Sin imagen de portada</span></div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D8E0E6] bg-white p-3">
        <p className="text-[11px] font-semibold text-[#5F6B76]">JPG, PNG o WEBP · Máx. 10 MB · Formato 16:9</p>
        <div className="flex flex-wrap gap-2">
          {value ? <button type="button" onClick={() => onChange(null)} disabled={disabled} className="min-h-11 rounded-[6px] border border-[#C7D1DA] px-3 text-[12px] font-extrabold text-[#153244] disabled:opacity-50">Descartar cambio</button> : null}
          <button type="button" onClick={() => inputRef.current?.click()} disabled={disabled} className="inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#0072BC] px-3 text-[12px] font-extrabold text-[#005CB9] hover:bg-[#EAF4FB] disabled:opacity-50"><AppIcon name="photo" size={17} />{previewUrl || currentUrl ? "Cambiar y encuadrar" : "Elegir y encuadrar"}</button>
        </div>
      </div>
    </div>
    <input ref={inputRef} id={inputId} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} className="sr-only" tabIndex={-1} />
    {error ? <p role="alert" className="mt-1 text-[11px] font-bold text-[#C93B3B]">{error}</p> : null}
    {source ? <ImageCropDialog source={source} onCancel={() => { URL.revokeObjectURL(source.url); setSource(null); }} onConfirm={(file) => { onChange(file); URL.revokeObjectURL(source.url); setSource(null); }} /> : null}
  </div>;
}

function ImageCropDialog({ source, onCancel, onConfirm }: { source: { file: File; url: string }; onCancel: () => void; onConfirm: (file: File) => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 50, y: 50 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; position: Position } | null>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !saving) onCancel(); };
    document.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", close); };
  }, [onCancel, saving]);

  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, position };
  };
  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPosition({ x: clamp(drag.position.x - ((event.clientX - drag.x) / rect.width) * 100, 0, 100), y: clamp(drag.position.y - ((event.clientY - drag.y) / rect.height) * 100, 0, 100) });
  };

  const save = async () => {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    setSaving(true);
    try {
      const file = await cropImage(image, source.file.name, zoom, position);
      onConfirm(file);
    } catch {
      toast.error("No se pudo procesar la imagen", { description: "Probá con otra imagen." });
      setSaving(false);
    }
  };

  return createPortal(<div className="fixed inset-0 z-[260] flex items-center justify-center bg-[#061947]/70 p-3 sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onCancel(); }}>
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="crop-title" className="w-full max-w-[820px] overflow-hidden rounded-[14px] border border-[#D8E0E6] bg-white text-[#153244] shadow-[0_24px_90px_rgba(6,42,67,0.35)]">
      <header className="flex items-center justify-between border-b border-[#D8E0E6] px-5 py-4 sm:px-6"><div><h2 id="crop-title" className="text-[21px] font-extrabold text-[#061947]">Encuadrar portada</h2><p className="mt-1 text-[12px] font-semibold text-[#5F6B76]">Arrastrá la imagen y ajustá el zoom para elegir el enfoque.</p></div><button type="button" onClick={onCancel} disabled={saving} aria-label="Cerrar editor" className="flex h-11 w-11 items-center justify-center rounded-full border border-[#C7D1DA]"><AppIcon name="x" size={21} /></button></header>
      <div className="p-5 sm:p-6">
        <div onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={() => { dragRef.current = null; }} className="relative aspect-[16/9] w-full touch-none cursor-move overflow-hidden rounded-[8px] bg-[#153244] select-none">
          <img ref={imageRef} src={source.url} alt="Imagen a encuadrar" draggable={false} className="pointer-events-none h-full w-full object-cover" style={{ objectPosition: `${position.x}% ${position.y}%`, transform: `scale(${zoom})`, transformOrigin: `${position.x}% ${position.y}%` }} />
          <div className="pointer-events-none absolute inset-0 border-[1px] border-white/60 shadow-[inset_0_0_0_999px_rgba(6,25,71,0.06)]" />
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="text-[12px] font-extrabold">Zoom <span className="ml-2 text-[#5F6B76]">{Math.round(zoom * 100)}%</span><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="mt-2 block h-11 w-full accent-[#0072BC]" /></label>
          <button type="button" onClick={() => { setZoom(1); setPosition({ x: 50, y: 50 }); }} className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-4 text-[12px] font-extrabold">Centrar</button>
        </div>
      </div>
      <footer className="flex flex-col-reverse gap-3 border-t border-[#D8E0E6] px-5 py-4 sm:flex-row sm:justify-end sm:px-6"><button type="button" onClick={onCancel} disabled={saving} className="min-h-11 rounded-[7px] border border-[#C7D1DA] px-5 text-[13px] font-extrabold">Cancelar</button><button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0072BC] px-5 text-[13px] font-extrabold text-white disabled:opacity-60">{saving ? <AppIcon name="loader" size={17} className="animate-spin" /> : <AppIcon name="check" size={17} />} Usar portada</button></footer>
    </div>
  </div>, document.body);
}

async function cropImage(image: HTMLImageElement, originalName: string, zoom: number, position: Position) {
  const outputWidth = 1600;
  const outputHeight = 900;
  const baseScale = Math.max(outputWidth / image.naturalWidth, outputHeight / image.naturalHeight);
  const scale = baseScale * zoom;
  const sourceWidth = outputWidth / scale;
  const sourceHeight = outputHeight / scale;
  const sourceX = (image.naturalWidth - sourceWidth) * (position.x / 100);
  const sourceY = (image.naturalHeight - sourceHeight) * (position.y / 100);
  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas no disponible.");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, outputWidth, outputHeight);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputWidth, outputHeight);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("No se pudo generar la portada.");
  const baseName = originalName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-") || "portada";
  return new File([blob], `${baseName}-16x9.jpg`, { type: "image/jpeg" });
}

function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, value)); }
