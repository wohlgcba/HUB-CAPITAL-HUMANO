import { useEffect, useState } from "react";

export function AvatarImage({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;
  return <img src={src} alt={alt} onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />;
}
