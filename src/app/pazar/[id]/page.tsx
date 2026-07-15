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
import { Package, ShieldCheck, MapPin, ArrowRight, Store } from "@/components/icons";
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
                ) : crop ? (
                  <span className="listing-detail-photo-fallback">{crop.emoji}</span>
                ) : (
                  // CSA kutu / abonelik gibi katalogsuz ilanlar: özgün Hasat Pazarı illüstrasyonu.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src="/brand/harvest-box.svg" alt="" className="listing-detail-photo-illust" />
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
                  <span className="font-mono" style={{ fontSize: 28, fontWeight: 700, color: "#A1502E" }}>
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

                {/* --- Satın alma eylemleri (buy-box) --- */}
                <div className="card" style={{ padding: 18, marginBottom: 14 }}>
                  <DetailActions
                    listing={{
                      id: listing.id,
                      title: listing.title,
                      priceTRY: listing.priceTRY,
                      unitLabel: listing.unitLabel,
                      stockQty: listing.stockQty,
                      // Katalogsuz (CSA kutu vb.) ilanlarda sepet/sticky-bar küçük görseli
                      // Market grid'iyle aynı fallback'i kullansın (Market.tsx handleAddToCart).
                      photoPath:
                        photoPath ??
                        (listing.cropId || listing.microgreenId ? undefined : "/brand/harvest-box.svg"),
                    }}
                    isOwn={isOwn}
                  />
                </div>

                {/* --- Üretici kartı: küçük ve dürüst — ad + bölge + (varsa) sertifika rozeti.
                       Forest green /pazar'da YALNIZ bu doğrulama rozetinde (ADR-009). --- */}
                <div className="card" style={{ padding: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <Store size={17} style={{ color: "#A1502E", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--text-hi)" }}>{listing.producer}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      <MapPin size={11} style={{ verticalAlign: -1, marginRight: 3 }} />
                      {listing.region}
                    </div>
                  </div>
                  {listing.claim === "sertifikali" && (
                    <span className="listing-cert-badge">
                      <ShieldCheck size={12} /> Sertifikalı organik
                    </span>
                  )}
                </div>

                {/* --- Spec tablosu: etiket %35 muted / değer mono, hairline satır arası --- */}
                <div className="listing-spec-table">
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Format</span>
                    <span className="listing-spec-value">{FORMAT_LABELS[listing.format]} · {listing.unitLabel}</span>
                  </div>
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Raf ömrü</span>
                    <span className="listing-spec-value">{listing.shelfLifeDays} gün</span>
                  </div>
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Stok tipi</span>
                    <span className="listing-spec-value">{stock.label}</span>
                  </div>
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Stok adedi</span>
                    <span className="listing-spec-value">{listing.stockQty} adet</span>
                  </div>
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Organik iddia</span>
                    <span className="listing-spec-value">{claim.label}</span>
                  </div>
                  <div className="listing-spec-row">
                    <span className="listing-spec-label">Satış kanalları</span>
                    <span className="listing-spec-value">
                      {listing.channels.map((ch) => CHANNEL_LABEL_SHORT[ch] ?? ch).join(" · ")}
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
          .listing-detail-photo-illust {
            position: absolute; inset: 0; width: 100%; height: 100%;
            object-fit: contain; padding: 12%;
          }
          .listing-cert-badge {
            margin-left: auto; height: 24px;
            display: inline-flex; align-items: center; gap: 4px; padding: 0 10px;
            border-radius: 999px; background: #2C6B49; color: #fff;
            font-size: 10.5px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase;
          }
          .listing-spec-table { max-width: 540px; font-size: var(--fs-sm); border-top: 1px solid var(--border-hair); }
          .listing-spec-row {
            display: grid; grid-template-columns: 35% 1fr; gap: 12px;
            padding: 9px 0; border-bottom: 1px solid var(--border-hair); align-items: baseline;
          }
          .listing-spec-label { color: var(--text-low); }
          .listing-spec-value { font-family: var(--font-mono); font-size: 13px; color: var(--text-hi); }
          .listing-detail-approx {
            position: absolute; right: 12px; top: 12px; font-size: 10px; font-weight: 700;
            padding: 4px 9px; border-radius: 999px; color: #fff;
            background: color-mix(in srgb, var(--color-warning) 80%, black 8%);
          }
          @media (max-width: 860px) {
            #listing-detail-grid { grid-template-columns: 1fr; }
            /* Mobil sticky bar (56px) içeriği örtmesin. */
            main { padding-bottom: 64px; }
          }
        `}</style>
      </main>
      <Footer />
    </>
  );
}
