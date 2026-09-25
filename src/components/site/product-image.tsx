import Image from "next/image";
import { cn } from "@/lib/format";

/** Product/category visual with a branded fallback when no photo has been uploaded yet. */
export function ProductImage({ src, alt, sizes, priority, className }: {
  src: string | null; alt: string; sizes: string; priority?: boolean; className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-leaf", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("relative grid place-items-center overflow-hidden bg-brand-100", className)} role="img" aria-label={alt}>
      <span className="font-display text-5xl font-extrabold text-brand-800/25 select-none" aria-hidden>
        {alt.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
