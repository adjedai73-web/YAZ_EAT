"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserSupabase } from "@/lib/supabase/browser";
import { toast } from "@/components/ui/toast";

/**
 * Supabase Realtime on public.orders (RLS: admins only). Refreshes the page on any change,
 * beeps + notifies on new orders. Falls back to polling every 30s if the socket drops.
 */
export function OrdersLive() {
  const router = useRouter();
  const [live, setLive] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const liveRef = useRef(false);

  useEffect(() => {
    const sb = browserSupabase();
    const beep = () => {
      try {
        audio.current ??= new AudioContext();
        const ctx = audio.current, o = ctx.createOscillator(), g = ctx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
        g.gain.setValueAtTime(0.2, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        o.start(); o.stop(ctx.currentTime + 0.6);
      } catch { /* audio blocked until first user interaction */ }
    };
    const channel = sb
      .channel("admin-orders")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        beep();
        const n = (payload.new as { order_number?: string }).order_number;
        toast(`Nouvelle commande ${n ?? ""}`);
        if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
          new Notification("Nouvelle commande", { body: n });
        }
        router.refresh();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, () => router.refresh())
      .subscribe((status) => { liveRef.current = status === "SUBSCRIBED"; setLive(liveRef.current); });

    const poll = setInterval(() => { if (!liveRef.current) router.refresh(); }, 30_000);
    if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().catch(() => {});
    return () => { clearInterval(poll); sb.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-soft" role="status">
      <span className={`size-2.5 rounded-full ${live ? "bg-[#25D366]" : "bg-line"}`} aria-hidden />
      {live ? "En direct" : "Actualisation automatique"}
    </span>
  );
}
