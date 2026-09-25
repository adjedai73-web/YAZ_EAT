import { formatDA } from "@/lib/format";

/** Dependency-free SVG bar chart (responsive, accessible via a hidden table). */
export function BarChart({ data, valueKey, label, format = "number" }: {
  data: { day: string; orders: number; revenue: number }[];
  valueKey: "orders" | "revenue"; label: string; format?: "number" | "da";
}) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  const w = 100 / Math.max(1, data.length);
  const fmt = (v: number) => (format === "da" ? formatDA(v) : String(v));
  const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <figure>
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label={label}>
        {[0.25, 0.5, 0.75].map((y) => <line key={y} x1="0" x2="100" y1={50 * y} y2={50 * y} stroke="var(--color-line)" strokeWidth="0.2" />)}
        {data.map((d, i) => {
          const h = (d[valueKey] / max) * 46;
          return (
            <rect key={d.day} x={i * w + w * 0.18} y={50 - h} width={w * 0.64} height={Math.max(h, 0.4)} rx="0.8"
              fill={i === data.length - 1 ? "var(--color-sun-500)" : "var(--color-brand-800)"}>
              <title>{`${day(d.day)} : ${fmt(d[valueKey])}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-ink-soft">
        <span>{data[0] && day(data[0].day)}</span><span>Max {fmt(max)}</span><span>{data.at(-1) && day(data.at(-1)!.day)}</span>
      </div>
      <table className="sr-only"><caption>{label}</caption><tbody>{data.map((d) => <tr key={d.day}><td>{d.day}</td><td>{fmt(d[valueKey])}</td></tr>)}</tbody></table>
    </figure>
  );
}

export function HBars({ rows }: { rows: { label: string; value: number; hint?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-ink-soft">Pas encore de données.</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between text-sm"><span className="font-semibold">{r.label}</span><span className="text-ink-soft">{r.hint ?? r.value}</span></div>
          <div className="mt-1 h-2.5 rounded-full bg-leaf"><div className="h-full rounded-full bg-brand-800" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-card)] border p-4 ${accent ? "border-sun-500 bg-sun-100" : "border-line bg-paper"}`}>
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold md:text-3xl">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
