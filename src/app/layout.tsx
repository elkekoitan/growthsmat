import type { Metadata, Viewport } from "next";
import { display, sans, mono } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SmartGrowth OS — Organik üretim işletim sistemi",
    template: "%s · SmartGrowth OS",
  },
  description:
    "Doğru ürün seçimi, üretim planı, günlük saha uygulaması, gıda güvenliği, izlenebilirlik ve satış — evdeki üreticiden profesyonel organik çiftliğe kadar tek platformda.",
  manifest: "/manifest.webmanifest",
  applicationName: "SmartGrowth OS",
  keywords: ["organik tarım", "mikro filiz", "üretim planı", "gıda güvenliği", "izlenebilirlik", "tarım yazılımı"],
  icons: {
    icon: "/icons/favicon-32.png",
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    title: "SmartGrowth OS — Organik üretim işletim sistemi",
    description:
      "Konum, alan ve hedefinize göre kanıt seviyeli üretim planı; mikro filizden profesyonel organik çiftliğe.",
    type: "website",
    locale: "tr_TR",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#25573c" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0c" },
  ],
  width: "device-width",
  initialScale: 1,
};

// FOUC önleyici — tema class'ını hidrasyondan önce uygula.
const themeInit = `(function(){try{var t=localStorage.getItem('sg-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
