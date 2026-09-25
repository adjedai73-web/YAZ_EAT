"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui", textAlign: "center", padding: "4rem 1rem" }}>
        <h1>Une erreur est survenue</h1>
        <p>Rechargez la page. Si le problème persiste, contactez le restaurant.</p>
        <button onClick={reset} style={{ marginTop: 16, padding: "12px 20px", borderRadius: 12, border: 0, background: "#FFC107", fontWeight: 700 }}>
          Réessayer
        </button>
      </body>
    </html>
  );
}
