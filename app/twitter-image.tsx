import { ImageResponse } from "next/og";

export const alt = "YAZ eat — Commandez en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand identity: black #111111, yellow #FFC107, orange #FF6F00, red #D32F2F.
export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 72,
        background: "radial-gradient(circle at 85% 10%, rgba(255,111,0,0.45), transparent 55%), #111111" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 230, fontWeight: 800, letterSpacing: -12, lineHeight: 0.9 }}>
          <span style={{ color: "#ffffff" }}>YAZ</span>
          <span style={{ color: "#D32F2F", marginLeft: 36 }}>eat</span>
        </div>
        <div style={{ display: "flex", marginTop: 36 }}>
          <div style={{ background: "#FFC107", color: "#111111", fontSize: 42, fontWeight: 800, padding: "12px 28px", borderRadius: 14 }}>
            Commandez en ligne
          </div>
        </div>
      </div>
    ),
    size,
  );
}
