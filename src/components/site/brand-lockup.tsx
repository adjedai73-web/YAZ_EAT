import Image from "next/image";
import { restaurant } from "@/config/restaurant";
import { cn } from "@/lib/format";

/** Intrinsic size of public/brand/yaz-eat-logo-horizontal.png (used as provided). */
export const LOGO_WIDTH = 2172;
export const LOGO_HEIGHT = 724;

/**
 * Official YAZ EAT logo (rooster + "YAZ eat"), transparent background, same proportions.
 * onDark → variant with the big "YAZ" in white (restaurant.logoOnDarkUrl) so it stays visible on black.
 */
export function BrandLockup({ onDark, className, priority, alt }: {
  onDark?: boolean; className?: string; priority?: boolean; alt?: string;
}) {
  const src = (onDark ? restaurant.logoOnDarkUrl ?? restaurant.logoUrl : restaurant.logoUrl) ?? null;
  if (!src) return null;
  return (
    <Image src={src} alt={alt ?? restaurant.name} width={LOGO_WIDTH} height={LOGO_HEIGHT} priority={priority}
      className={cn("block w-auto", className ?? "h-10")} />
  );
}
