import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BotanicalScene } from "@/components/graphics";
import { Sprout, ArrowRight } from "@/components/icons";

export const metadata = {
  title: "Sayfa bulunamadı",
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main>
        <section
          className="mesh-light grain section"
          style={{ position: "relative", minHeight: "60vh", display: "flex", alignItems: "center" }}
        >
          <BotanicalScene
            style={{
              position: "absolute",
              right: "4%",
              top: "10%",
              width: 260,
              height: 260,
              color: "var(--color-forest-300)",
              opacity: 0.35,
              pointerEvents: "none",
            }}
          />
          <div className="container-x" style={{ position: "relative", textAlign: "center" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
                marginBottom: 24,
              }}
            >
              <Sprout size={34} />
            </div>
            <span className="eyebrow">HATA 404</span>
            <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 16, marginBottom: 14 }} className="text-balance">
              Bu parselde ekili bir şey yok.
            </h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 520, margin: "0 auto 32px" }}>
              Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ana sayfadan veya
              üretim planından devam edelim.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/" className="btn btn-primary btn-lg">
                Ana sayfaya dön
              </Link>
              <Link href="/plan" className="btn btn-secondary btn-lg">
                Planını oluştur <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
