import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getPublicLotView } from "@/server/repositories/lots";
import { LOT_TYPE_LABELS, type Lot } from "@/lib/traceability";
import { Package, ShieldCheck, Check, X, Calendar, ArrowRight } from "@/components/icons";

export const metadata = {
  title: "Lot Doğrulama",
  description: "Bir lotun kaynağını, sertifikalı organik iddia zincirini ve geriye izini herkese açık olarak doğrula.",
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<Lot["status"], "ok" | "warn" | "danger" | "info"> = {
  aktif: "ok",
  incelemede: "warn",
  karantina: "danger",
  "geri-cagrildi": "danger",
  tuketildi: "info",
};

export default async function PublicLotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = await getPublicLotView(id);

  if (!view) {
    return (
      <>
        <Nav />
        <main>
          <section className="section container-narrow" style={{ textAlign: "center" }}>
            <span className="eyebrow">Lot doğrulama</span>
            <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 16, marginBottom: 14 }}>Lot bulunamadı</h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 480, margin: "0 auto 24px" }}>
              Bu bağlantı geçersiz olabilir ya da lot kaldırılmış olabilir.
            </p>
            <Link href="/" className="btn btn-primary btn-lg">
              Ana sayfaya dön
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const { lot, chain, organicClaim } = view;

  return (
    <>
      <Nav />
      <main>
        <section className="mesh-light grain section" style={{ paddingBottom: "clamp(1.5rem, 3vw, 2.5rem)" }}>
          <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
            <span className="eyebrow">
              <ShieldCheck size={13} /> Herkese açık lot doğrulama
            </span>
            <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
              {lot.label}
            </h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 560, margin: "0 auto" }}>
              Bu sayfa, bu ürünün tohumdan/girdiden bugüne kadarki izlenebilirlik zincirini ve organik
              iddia durumunu gösterir.
            </p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container-x" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} id="lot-public-grid">
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <Package size={20} />
                </span>
                <div>
                  <h3 style={{ fontSize: "var(--fs-lg)", margin: 0 }}>{LOT_TYPE_LABELS[lot.type]}</h3>
                  <span className="font-mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    {lot.id}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, fontSize: "var(--fs-sm)", color: "var(--text-mid)", marginBottom: 16 }}>
                <div>Sahip / işletme: {lot.ownerLabel}</div>
                <div>
                  <Calendar size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                  {lot.producedAt} · <span className="font-mono">{lot.quantity} {lot.unit}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <span className={`chip chip-${STATUS_TONE[lot.status]}`}>{lot.status}</span>
                <span className={`chip ${lot.certifiedOrigin ? "chip-ok" : "chip-warn"}`}>
                  <ShieldCheck size={12} /> {lot.certifiedOrigin ? "Sertifikalı adım" : "Sertifikasız adım"}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Organik iddia kapısı
                </div>
                <span className={`chip ${organicClaim.publishable ? "chip-ok" : "chip-danger"}`}>
                  {organicClaim.publishable ? <Check size={12} /> : <X size={12} />}
                  {organicClaim.publishable ? "Yayınlanabilir" : `Bloklu — kırılma: ${organicClaim.brokenAt}`}
                </span>
              </div>
            </div>

            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 14 }}>Kaynak zinciri</h3>
              {chain.length === 0 ? (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>Kök lot — üst kaynağı yok.</p>
              ) : (
                <ol style={{ display: "grid", gap: 10, paddingLeft: 20, margin: 0 }}>
                  {chain.map((l) => (
                    <li key={l.id} style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
                      <span style={{ fontWeight: 600, color: "var(--text-hi)" }}>{LOT_TYPE_LABELS[l.type]}</span> ·{" "}
                      {l.label} <span className="font-mono" style={{ color: "var(--text-low)" }}>({l.producedAt})</span>
                    </li>
                  ))}
                </ol>
              )}

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-hair)" }}>
                <Link href="/" className="btn btn-secondary btn-sm">
                  Ana sayfaya dön <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <style>{`
          @media (max-width: 860px) { #lot-public-grid { grid-template-columns: 1fr !important; } }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
