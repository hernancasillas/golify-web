import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF generation for the printable downloads runs in route handlers; the
  // renderer ships its own font/layout engines and must not be bundled.
  serverExternalPackages: ["@react-pdf/renderer"],
  images: {
    // API-Football CDN — league and team logos.
    remotePatterns: [
      { protocol: "https", hostname: "media.api-sports.io" },
    ],
  },
  async redirects() {
    // Keyword-friendly aliases. These catch typed and shared URLs and funnel
    // them to the canonical localized route — the canonical is what ranks, the
    // aliases only exist so none of these guesses dead-ends.
    //
    // Every destination here must be a real route. These aliases pointed at
    // /world-cup/bracket for months after the route was deleted, so the best
    // performing URL in Search Console was a 308 into a 404.
    const aliases: Record<string, string[]> = {
      "/es/world-cup/bracket": [
        "/mundial-2026-llave",
        "/mundial-2026-bracket",
        "/llaves-del-mundial",
        "/es/mundial-2026-llave",
        "/es/mundial/llave",
        "/es/llaves-del-mundial",
      ],
      "/en/world-cup/bracket": [
        "/world-cup-2026-bracket",
        "/en/world-cup-2026-bracket",
      ],
      "/es/world-cup": ["/mundial-2026", "/es/mundial-2026", "/es/mundial"],
      "/en/world-cup": ["/world-cup-2026", "/en/world-cup-2026"],
      // The two evergreen boards. Their canonical URLs are localized now
      // (/es/partidos-de-hoy, /es/en-vivo — see src/lib/routes.ts); these
      // catch the other spellings people type. A destination here must be the
      // FINAL canonical URL: these run before the proxy, so pointing one at a
      // path the proxy redirects again would be a chain (or a loop).
      "/es/partidos-de-hoy": ["/es/hoy", "/hoy"],
      "/en/today": ["/todays-matches", "/en/todays-matches", "/en/hoy"],
      "/pt/jogos-de-hoje": ["/pt/hoje", "/pt/jogos-hoje"],
      "/es/en-vivo": ["/resultados-en-vivo", "/es/resultados-en-vivo"],
      "/en/live": ["/live-scores", "/en/live-scores", "/en/en-vivo"],
      "/pt/ao-vivo": ["/pt/placar-ao-vivo", "/pt/resultados-ao-vivo"],
    };

    return Object.entries(aliases).flatMap(([destination, sources]) =>
      sources.map((source) => ({ source, destination, permanent: true })),
    );
  },
  async headers() {
    return [
      {
        // Printable downloads (PDF, CSV, XLSX, ICS) must not compete in search
        // with the HTML page that hosts them — the page is what ranks.
        source: "/files/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/.well-known/apple-app-site-association",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
