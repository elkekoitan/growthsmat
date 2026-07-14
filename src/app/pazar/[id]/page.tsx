import Link from "next/link";
import Image from "next/image";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { getListingById } from "@/server/repositories/listings";
import { getOptionalMembership } from "@/server/session";
import {
  STOCK_LABELS,
  CLAIM_LABELS,
  FORMAT_LABELS,
  type ChannelId,
} from "@/data/commerce";
import { CROP_BY_ID } from "@/data/crops";
import { cropPhotoPath, primaryCredit } from "@/data/photoCredits";
import { microgreenPhotoPath } from "@/data/microgreenPhotoCredits";
import { Package, ShieldCheck, MapPin, Calendar, ArrowRight, Store } from "@/components/icons";
import { DetailActions } from "./DetailActions";

export const metadata = {
  title: "Ürün detayı",
  description: "Bir pazar ilanının üreticisi, fiyatı, stok ve organik iddia durumu.",
};

export const dynamic = "force-dynamic";

const CHANNEL_LABEL_SHORT: Record<ChannelId, string> = {
  "yerel-vitrin": "Yerel Vitrin",
  "restoran-b2b": "Restoran/B2B",
  "csa-kutu": "CSA Kutu",
  etsy: "Etsy",
};

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing || !listing.active) {
    return (
      <>
        <Nav />
        <main>
          <section className="section container-narrow" style={{ textAlign: "center" }}>
            <span className="eyebrow">Hasat Pazarı</span>
            <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 16, marginBottom: 14 }}>Ürün bulunamadı</h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 480, margin: "0 auto 24px" }}>
              Bu ilan kaldırılmış, pasife alınmış ya da bağlantı geçersiz olabilir.
            </p>
            <Link href="/pazar" className="btn btn-primary btn-lg">
              Pazara dön
            </Link>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const session = await getOptionalMembership();
  const isOwn = session ? session.membership.workspaceId === listing.workspaceId : false;

  const crop = listing.cropId ? CROP_BY_ID[listing.cropId] : undefined;
  const photoPath = listing.cropId
    ? cropPhotoPath(listing.cropId)
    : listing.microgreenId
      ? microgreenPhotoPath(listing.microgreenId)
      : undefined;
  const isApprox = listing.cropId ? primaryCredit(listing.cropId)?.isApproximation ?? false : false;

  const stock = STOCK_LABELS[listing.stockType];
  const claim = CLAIM_LABELS[listing.claim];
  const inStock = listing.stockQty > 0;

  return (
    <>
      <Nav />
      <main>
        <section className="section" style={{ paddingTop: "clamp(1.5rem, 3vw, 2.25rem)" }}>
          <div className="container-x">
            <Link
              href="/pazar"
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 18 }}
            >
              <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} /> Pazara dön
            </Link>

            <div className="listing-detail-grid" id="listing-detail-grid">
              {/* --- Görsel --- */}
              <div className="listing-detail-photo">
                {photoPath ? (
                  <Image
                    src={photoPath}
                    alt={isApprox ? `${listing.title} (analog görsel)` : listing.title}
                    fill
                    sizes="(max-width: 860px) 100vw, 480px"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="listing-detail-photo-fallback">{crop?.emoji ?? "🌱"}</span>
                )}
                {isApprox && <span className="listing-detail-approx">≈ analog görsel</span>}
              </div>

              {/* --- Bilgi --- */}
              <div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)", marginBottom: 8 }}>
                  {listing.producer}
                  <span style={{ margin: "0 6px" }}>·</span>
                  <MapPin size={13} style={{ verticalAlign: -2, marginRight: 3 }} />
                  {listing.region}
                </div>
                <h1 style={{ fontSize: "var(--fs-h2)", marginBottom: 14 }} className="text-balance">
                  {listing.title}
                </h1>

                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                  <span className="font-mono" style={{ fontSize: "var(--fs-h2)", fontWeight: 700, color: "#7c3b21" }}>
                    {listing.priceTRY.toLocaleString("tr-TR")} ₺
                  </span>
                  <span style={{ fontSize: "var(--fs-base)", color: "var(--text-mid)" }}>{listing.unitLabel}</span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
                  <span className={`chip chip-${stock.tone}`}>{stock.label}</span>
                  <span className={`chip ${inStock ? (listing.stockQty <= 3 ? "chip-warn" : "chip-ok") : "chip-danger"}`}>
                    <Package size={12} /> {inStock ? `${listing.stockQty} adet stokta` : "Tükendi"}
                  </span>
                  <span className={`chip chip-${claim.tone}`}>
                    <ShieldCheck size={12} /> {claim.label}
                  </span>
                </div>

                {!claim.publishable && (
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)", maxWidth: 460, marginBottom: 16 }}>
                    Bu ürünün organik iddiası henüz doğrulanmadı; &quot;organik&quot; filtresinde
                    gösterilmez. İddia durumu her zaman olduğu gibi dürüstçe belirtilir (FR-126).
                  </p>
                )}

                {/* --- Satın alma eylemleri --- */}
                <div className="card" style={{ padding: 18, marginBottom: 20 }}>
                  <DetailActions
                    listing={{
                      id: listing.id,
                      title: listing.title,
                      priceTRY: listing.priceTRY,
                      unitLabel: listing.unitLabel,
                      stockQty: listing.stockQty,
                    }}
                    isOwn={isOwn}
                  />
                </div>

                {/* --- Ürün özellikleri --- */}
                <div style={{ display: "grid", gap: 10, fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Package size={14} style={{ color: "var(--primary)" }} />
                    Format: <strong style={{ color: "var(--text-hi)" }}>{FORMAT_LABELS[listing.format]}</strong> · {listing.unitLabel}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Calendar size={14} style={{ color: "var(--primary)" }} />
                    Raf ömrü: <strong style={{ color: "var(--text-hi)" }}>{listing.shelfLifeDays} gün</strong>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                    <Store size={14} style={{ color: "var(--primary)", marginTop: 3 }} />
                    Satış kanalları:
                    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {listing.channels.map((ch) => (
                        <span key={ch} className="chip" style={{ fontSize: 11 }}>
                          {CHANNEL_LABEL_SHORT[ch] ?? ch}
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <style>{`
          .listing-detail-grid {
            display: grid;
            grid-template-columns: minmax(0, 480px) 1fr;
            gap: 32px;
            align-items: start;
          }
          .listing-detail-photo {
            position: relative;
            width: 100%;
            aspect-ratio: 4 / 3;
            border-radius: var(--radius-card);
            overflow: hidden;
            background: var(--color-paper-200, var(--bg-surface-2));
            border: 1px solid color-mix(in srgb, #A1502E 16%, var(--border-soft));
          }
          .listing-detail-photo-fallback {
            position: absolute; inset: 0; display: grid; place-items: center; font-size: 88px;
          }
          .listing-detail-approx {
            position: absolute; right: 12px; top: 12px; font-size: 10px; font-weight: 700;
            padding: 4px 9px; border-radius: 999px; color: #fff;
            background: color-mix(in srgb, var(--color-warning) 80%, black 8%);
          }
          @media (max-width: 860px) {
            #listing-detail-grid { grid-template-columns: 1fr; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
