import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      // The two evergreen boards. "partidos de hoy" and "resultados en vivo"
      // are typed straight into the address bar often enough to be worth
      // catching.
      "/es/today": [
        "/partidos-de-hoy",
        "/es/partidos-de-hoy",
        "/es/hoy",
        "/hoy",
      ],
      "/en/today": ["/todays-matches", "/en/todays-matches", "/en/hoy"],
      "/es/live": [
        "/resultados-en-vivo",
        "/es/resultados-en-vivo",
        "/es/en-vivo",
        "/en-vivo",
      ],
      "/en/live": ["/live-scores", "/en/live-scores", "/en/en-vivo"],
    };

    return Object.entries(aliases).flatMap(([destination, sources]) =>
      sources.map((source) => ({ source, destination, permanent: true })),
    );
  },
  async headers() {
    return [
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
