import { ThemeProvider } from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Golify - Football Tracker • Retas • EA FC Catalog",
  description: "Follow your favorite matches, compete in retas with friends, and explore the complete EA FC catalog.",
  openGraph: {
    title: "Golify - Football Tracker • Retas • EA FC Catalog",
    description: "Follow your favorite matches, compete in retas with friends, and explore the complete EA FC catalog.",
    siteName: "Golify",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Golify - Football Tracker • Retas • EA FC Catalog",
    description: "Follow your favorite matches, compete in retas with friends, and explore the complete EA FC catalog.",
  },
  other: {
    "apple-itunes-app": "app-id=6772339872",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('golify-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}})();`,
          }}
        />
        <ThemeProvider defaultTheme="dark">
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
