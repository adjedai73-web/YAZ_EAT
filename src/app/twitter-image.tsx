import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "YAZ eat — Commandez en ligne";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand identity: black #111111, yellow #FFC107, orange #FF6F00, red #D32F2F.
// The official logo, dark-background variant ("YAZ" in white), 2172×724, embedded as-is with no background.
export default async function OgImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/yaz-eat-logo-horizontal-dark.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  const logoW = 900;
  const logoH = Math.round((724 / 2172) * logoW);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44,
        background: "radial-gradient(circle at 85% 10%, rgba(255,111,0,0.45), transparent 55%), #111111" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={logoW} height={logoH} alt="" />
        <div style={{ display: "flex", background: "#FFC107", color: "#111111", fontSize: 42, fontWeight: 800, padding: "12px 28px", borderRadius: 14 }}>
          Commandez en ligne
        </div>
      </div>
    ),
    size,
  );
}
