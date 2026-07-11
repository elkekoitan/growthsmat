import Link from "next/link";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "Ürün",
    links: [
      { href: "/plan", label: "Üretim planı" },
      { href: "/urunler", label: "Ürün kâşifi" },
      { href: "/gorevler", label: "Görev ve saha günlüğü" },
      { href: "/mikrofiliz", label: "Mikro filiz stüdyosu" },
      { href: "/pazar", label: "Pazar ve ticaret" },
      { href: "/asistan", label: "AI asistan" },
    ],
  },
  {
    title: "Platform",
    links: [
      { href: "/panel", label: "Proje paneli" },
      { href: "/plan", label: "Uygunluk motoru" },
      { href: "/mikrofiliz", label: "Maliyet hesaplayıcı" },
      { href: "/urunler", label: "Bilgi grafiği" },
      { href: "/izlenebilirlik", label: "Lot izlenebilirlik" },
      { href: "/rotasyon", label: "Rotasyon planlayıcı" },
      { href: "/sensor", label: "Sensör ve alarm" },
      { href: "/gorev-sablonu", label: "Görev şablonu" },
      { href: "/roller", label: "Rol ve izin matrisi" },
      { href: "/alan-kalitesi", label: "Alan veri kalitesi" },
    ],
  },
  {
    title: "İlkeler",
    links: [
      { href: "/plan", label: "Sahte kesinlik yok" },
      { href: "/urunler", label: "Kanıt seviyeli öneri" },
      { href: "/", label: "Üretici verinin sahibi" },
      { href: "/izlenebilirlik", label: "Önce gıda güvenliği" },
    ],
  },
];

export function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--border-hair)", background: "var(--bg-surface-2)" }}>
      <div className="container-x" style={{ paddingBlock: "3.5rem 2rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr repeat(3, 1fr)",
            gap: "2.5rem",
          }}
          className="footer-grid"
        >
          <div style={{ maxWidth: 320 }}>
            <Logo size={30} />
            <p style={{ marginTop: 16, color: "var(--text-mid)", fontSize: "var(--fs-base)", lineHeight: 1.6 }}>
              Evde üretim yapan kişiden profesyonel organik çiftliğe kadar üreticiyi doğru ürün seçimi,
              üretim planı, gıda güvenliği ve satış boyunca yöneten küresel organik üretim işletim sistemi.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--fs-xs)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-low)",
                  marginBottom: 14,
                }}
              >
                {col.title}
              </h4>
              <ul style={{ display: "grid", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((l, idx) => (
                  <li key={idx}>
                    <Link
                      href={l.href}
                      style={{ color: "var(--text-mid)", fontSize: "var(--fs-base)" }}
                      className="footer-link"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 40,
            paddingTop: 24,
            borderTop: "1px solid var(--border-hair)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            color: "var(--text-low)",
            fontSize: "var(--fs-sm)",
          }}
        >
          <span>© 2026 SmartGrowth OS · Sürüm 1.0 · Ürün tanımı ve mimari aşaması</span>
          <span className="font-mono" style={{ fontSize: "var(--fs-xs)" }}>
            suitability-v1.0.0 · TR/EN çekirdek
          </span>
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: var(--primary); }
        @media (max-width: 780px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  );
}
