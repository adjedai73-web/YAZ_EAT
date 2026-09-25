import { cn } from "@/lib/format";

/**
 * Brand wordmark "YAZ eat": first word uppercase (black, or white on dark),
 * the rest lowercase in brand red — as in the official identity.
 */
export function Wordmark({ name, light, className }: { name: string; light?: boolean; className?: string }) {
  const [first, ...rest] = name.trim().split(/\s+/);
  return (
    <span className={cn("font-display font-extrabold tracking-[-0.03em]", className)}>
      <span className={light ? "text-white" : "text-ink"}>{first?.toUpperCase()}</span>
      {rest.length > 0 && <span className="text-ember-600">{" "}{rest.join(" ").toLowerCase()}</span>}
    </span>
  );
}

/** Stylised flame (decorative), in the brand's yellow → orange → red gradient. */
export function FlameMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="yaz-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#D32F2F" />
          <stop offset=".45" stopColor="#FF6F00" />
          <stop offset="1" stopColor="#FFC107" />
        </linearGradient>
      </defs>
      <path fill="url(#yaz-flame)" d="M16 1c1.6 6.3-3.1 8.9-3.1 13.6 0 2.4 1.5 4 3.3 4.3-1.6-3 .3-5.6 2.6-7.5.1 3.7 3 5 3 8.8 0 1.2-.3 2.2-.8 3 2.1-.9 3.5-3 3.6-5.5 3 3.1 4.4 6.6 4.4 10.1C29 35.4 23.2 39 16 39S3 35.4 3 27.8c0-5.2 3.2-8.6 5.6-11.4C12.3 12 14.9 7.6 16 1Z" />
    </svg>
  );
}
