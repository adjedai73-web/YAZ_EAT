import type { RestaurantSettings } from "@/lib/types";
import { FacebookIcon, InstagramIcon, TikTokIcon } from "./brand-icons";
import { cn } from "@/lib/format";

/**
 * Social profiles.
 * - URL + account name → icon + name, clickable (opens in a new tab).
 * - URL only           → round icon link.
 * - Name only          → icon + name as plain text (never a guessed link).
 */
export function SocialLinks({ settings, className }: { settings: RestaurantSettings; className?: string }) {
  const items = [
    { href: settings.instagram_url, name: settings.instagram_name, label: "Instagram", Icon: InstagramIcon },
    { href: settings.facebook_url, name: settings.facebook_name, label: "Facebook", Icon: FacebookIcon },
    { href: settings.tiktok_url, name: null, label: "TikTok", Icon: TikTokIcon },
  ].filter((i) => i.href || i.name);
  if (!items.length) return null;
  const pill = "inline-flex h-10 items-center gap-2 rounded-full border border-current/20 px-3 text-sm font-medium";
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {items.map(({ href, name, label, Icon }) => {
        if (href && name) {
          return (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} : ${name}`} className={cn(pill, "hover:text-sun-400")}>
              <Icon className="size-4" /><span>{name}</span>
            </a>
          );
        }
        if (href) {
          return (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
              className="grid size-10 place-items-center rounded-full border border-current/20 hover:text-sun-400">
              <Icon />
            </a>
          );
        }
        return (
          <span key={label} className={pill}>
            <Icon className="size-4" /><span><span className="sr-only">{label} : </span>{name}</span>
          </span>
        );
      })}
    </div>
  );
}
