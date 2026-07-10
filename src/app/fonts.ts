import { Fraunces, Inter, Geist_Mono } from "next/font/google";

// Display — sıcak, karakterli serif (organik ama premium). opsz + SOFT/WONK ekseni
// hero boyutlarında keskin, küçük boyutlarda sağlam kesim sağlar.
export const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  variable: "--font-display",
  display: "swap",
});

// Body / UI — nötr grotesk, veri yoğun ekranların standardı.
export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Data / mono — sensör, KPI, lot kimlikleri (tabular).
export const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});
