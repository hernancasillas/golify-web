import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Keyword-friendly aliases for the World Cup bracket page. These catch
    // typed/shared URLs and funnel them to the canonical localized route — the
    // canonical is what ranks; the aliases just avoid dead ends.
    const bracketAliases = [
      "/mundial-2026-llave",
      "/mundial-2026-bracket",
      "/es/mundial-2026-llave",
      "/es/mundial/llave",
      "/world-cup-2026-bracket",
      "/en/world-cup-2026-bracket",
    ];
    return bracketAliases.map((source) => ({
      source,
      destination: source.startsWith("/en/")
        ? "/en/world-cup/bracket"
        : "/es/world-cup/bracket",
      permanent: true,
    }));
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
