"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CATALOG_WITH_EMOJI,
  CHANNELS,
  DELIVERY_ZONES,
  B2B_FLOW,
  FORMAT_LABELS,
  STOCK_LABELS,
  CLAIM_LABELS,
  simulateEtsyFees,
  simulateLocalFees,
  ETSY_LISTING_FEE_USD,
  ETSY_TRANSACTION_FEE_PCT,
  PAYMENT_PROCESSING,
  USD_TO_TRY_REFERENCE,
  type ChannelId,
  type PaymentCountry,
} from "@/data/commerce";
import { NumberedHeading, StampBadge, WaveDivider } from "@/components/graphics";
import { SpotlightCard, KpiCard } from "@/components/visuals";
import { Reveal } from "@/components/ui";
import {
  Store,
  Package,
  Globe,
  Scale,
  Check,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
} from "@/components/icons";

const CHANNEL_ICON: Record<ChannelId, typeof Store> = {
  "yerel-vitrin": Store,
  "restoran-b2b": Scale,
  "csa-kutu": Package,
  etsy: Globe,
};

const CHANNEL_LABEL_SHORT: Record<ChannelId, string> = {
  "yerel-vitrin": "Yerel Vitrin",
  "restoran-b2b": "Restoran/B2B",
  "csa-kutu": "CSA Kutu",
  etsy: "Etsy",
};

const COUNTRY_LABELS: Record<PaymentCountry, string> = {
  TR: "Türkiye",
  US: "ABD",
  EU: "Avrupa Birliği",
  UK: "Birleşik Krallık",
};

export function Market() {
  const [channelFilter, setChannelFilter] = useState<ChannelId | "hepsi">("hepsi");
  const filteredCatalog = useMemo(
    () =>
      channelFilter === "hepsi"
        ? CATALOG_WITH_EMOJI
        : CATALOG_WITH_EMOJI.filter((l) => l.channels.includes(channelFilter)),
    [channelFilter]
  );

  // --- Etsy ücret simülatörü ---
  const [etsyPrice, setEtsyPrice] = useState(12);
  const [etsyQty, setEtsyQty] = useState(3);
  const [etsyShip, setEtsyShip] = useState(6);
  const [etsyCountry, setEtsyCountry] = useState<PaymentCountry>("TR");
  const etsyResult = useMemo(
    () => simulateEtsyFees({ priceUSD: etsyPrice, quantity: etsyQty, shippingUSD: etsyShip, country: etsyCountry }),
    [etsyPrice, etsyQty, etsyShip, etsyCountry]
  );

  // --- Yerel vitrin komisyon simülatörü ---
  const [localPrice, setLocalPrice] = useState(89);
  const [localQty, setLocalQty] = useState(4);
  const [localZoneId, setLocalZoneId] = useState(DELIVERY_ZONES[0].id);
  const [localCommission, setLocalCommission] = useState(4);
  const localZone = DELIVERY_ZONES.find((z) => z.id === localZoneId) ?? DELIVERY_ZONES[0];
  const localResult = useMemo(
    () =>
      simulateLocalFees({
        priceTRY: localPrice,
        quantity: localQty,
        deliveryFeeTRY: localZone.deliveryFeeTRY,
        commissionPct: localCommission,
      }),
    [localPrice, localQty, localZone, localCommission]
  );

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ position: "relative", overflow: "hidden" }}>
        <div className="container-x hero-stagger" style={{ position: "relative", maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <span className="eyebrow">TİCARET VE KANAL MERKEZİ</span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 16 }} className="text-balance">
            Ürettiğini <em style={{ fontStyle: "italic", color: "var(--primary)" }}>kaçırmadan</em> sat.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 640, margin: "0 auto 28px" }} className="text-pretty">
            Yerel vitrin, restoran aboneliği, topluluk destekli tarım kutusu ve Etsy — tek master
            katalogdan yönet. Her kanalın ücreti ayrı ve şeffaf gösterilir; sertifikasız ürün
            &quot;organik&quot; olarak yayınlanamaz.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/plan" className="btn btn-accent btn-lg">
              Üretim planını oluştur <ArrowRight size={16} />
            </Link>
            <a href="#kanallar" className="btn btn-secondary btn-lg">
              Kanalları karşılaştır
            </a>
          </div>
        </div>
      </section>
      <WaveDivider fill="var(--color-paper-50)" />

      {/* ---------- KANAL KARŞILAŞTIRMA ---------- */}
      <section id="kanallar" className="section paper-section">
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Dört kanal, tek merkez" title="Hangi kanal senin için uygun?" />
          <div className="bento" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
            {CHANNELS.map((c, i) => {
              const Icon = CHANNEL_ICON[c.id];
              return (
                <Reveal key={c.id} i={i} as="div">
                  <SpotlightCard style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column" }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                        color: "var(--primary)",
                        marginBottom: 16,
                      }}
                    >
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 6 }}>{c.name}</h3>
                    <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", marginBottom: 14, flex: 1 }}>
                      {c.tagline}
                    </p>
                    <div className="chip" style={{ marginBottom: 12, width: "fit-content" }}>
                      <Scale size={13} /> {c.feePct[0] === c.feePct[1] ? `%${c.feePct[0]}` : `%${c.feePct[0]}–${c.feePct[1]}`}
                    </div>
                    <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 14 }}>{c.feeNote}</p>
                    <ul style={{ display: "grid", gap: 6, listStyle: "none", padding: 0, margin: 0, fontSize: "var(--fs-xs)" }}>
                      {c.requirements.map((r, ri) => (
                        <li key={ri} style={{ display: "flex", gap: 6, color: "var(--text-mid)" }}>
                          <Check size={13} style={{ color: "var(--color-success)", flexShrink: 0, marginTop: 2 }} />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <p style={{ marginTop: 14, fontSize: "var(--fs-xs)", fontWeight: 600, color: "var(--primary)" }}>
                      {c.bestFor}
                    </p>
                  </SpotlightCard>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- MASTER KATALOG ---------- */}
      <section className="section">
        <div className="container-x">
          <NumberedHeading n="02" eyebrow="Tek kayıt, çoklu kanal" title="Master katalog" />
          <p style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 24 }}>
            Her ürün tek yerde tanımlanır; hangi kanalda satılacağını sen seçersin. Stok durumu
            (mevcut / tahmini hasat / ön sipariş) ve organik iddia durumu her kartta açıkça
            görünür — kanıt olmadan rozet verilmez.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
            <button
              onClick={() => setChannelFilter("hepsi")}
              className="chip"
              aria-pressed={channelFilter === "hepsi"}
              style={{
                cursor: "pointer",
                border: "none",
                background: channelFilter === "hepsi" ? "var(--primary)" : "var(--bg-surface-2)",
                color: channelFilter === "hepsi" ? "var(--primary-fg)" : "var(--text-mid)",
              }}
            >
              Tüm kanallar ({CATALOG_WITH_EMOJI.length})
            </button>
            {CHANNELS.map((c) => {
              const count = CATALOG_WITH_EMOJI.filter((l) => l.channels.includes(c.id)).length;
              const active = channelFilter === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setChannelFilter(c.id)}
                  className="chip"
                  aria-pressed={active}
                  style={{
                    cursor: "pointer",
                    border: "none",
                    background: active ? "var(--primary)" : "var(--bg-surface-2)",
                    color: active ? "var(--primary-fg)" : "var(--text-mid)",
                  }}
                >
                  {CHANNEL_LABEL_SHORT[c.id]} ({count})
                </button>
              );
            })}
          </div>

          <div className="catalog-grid">
            {filteredCatalog.map((l, i) => {
              const stock = STOCK_LABELS[l.stockType];
              const claim = CLAIM_LABELS[l.claim];
              return (
                <Reveal key={l.id} i={i % 4} as="div">
                  <div className="card card-hover" style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 20,
                          background: "var(--bg-surface-2)",
                        }}
                        aria-hidden="true"
                      >
                        {l.emoji}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "var(--fs-base)" }}>{l.title}</div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                          {l.producer} · {l.region}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      <span className={`chip chip-${stock.tone}`}>{stock.label}</span>
                      <span className="chip">{FORMAT_LABELS[l.format]}</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: "var(--fs-lg)", fontWeight: 600, marginBottom: 4 }}>
                      {l.priceTRY.toLocaleString("tr-TR")} ₺
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 12 }}>{l.unitLabel}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                      {l.channels.map((ch) => (
                        <span key={ch} className="chip" style={{ fontSize: 11 }}>
                          {CHANNEL_LABEL_SHORT[ch]}
                        </span>
                      ))}
                    </div>
                    <div
                      className={`chip chip-${claim.tone}`}
                      style={{ marginTop: "auto", display: "flex", alignItems: "flex-start", gap: 6 }}
                    >
                      <ShieldCheck size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{claim.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      <span>
                        <Calendar size={12} style={{ verticalAlign: -2, marginRight: 3 }} />
                        Raf ömrü {l.shelfLifeDays} gün
                      </span>
                      <span className="font-mono">%{Math.round(l.repeatOrderRate * 100)} tekrar sipariş</span>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- TESLİMAT BÖLGELERİ ---------- */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading n="03" eyebrow="Bölgesel teslimat yarıçapı" title="Nerede teslim edebilirsin?" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {DELIVERY_ZONES.map((z, i) => (
              <Reveal key={z.id} i={i} as="div" className="card" style={{ padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <MapPin size={16} style={{ color: "var(--primary)" }} />
                  <strong style={{ fontSize: "var(--fs-base)" }}>{z.region}</strong>
                </div>
                <div style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
                  <div>Yarıçap: <span className="font-mono">{z.radiusKm} km</span></div>
                  <div>Min. sipariş: <span className="font-mono">{z.minOrderTRY} ₺</span></div>
                  <div>Teslimat: <span className="font-mono">{z.deliveryFeeTRY} ₺</span></div>
                </div>
                <span className={`chip ${z.sameDay ? "chip-ok" : "chip-info"}`} style={{ marginTop: 12 }}>
                  {z.sameDay ? "Aynı gün teslimat" : "Ertesi gün teslimat"}
                </span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ÜCRET SİMÜLATÖRLERİ ---------- */}
      <section className="section">
        <div className="container-x">
          <NumberedHeading n="04" eyebrow="Satmadan önce gör" title="Ücret simülatörleri" />
          <p style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 28 }}>
            Her işlemde toplam ücret ve net üretici geliri ödeme öncesi görünür. Etsy ve
            SmartGrowth ücretleri her zaman ayrı gösterilir.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="sim-grid">
            {/* Etsy simülatörü */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <Globe size={20} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "var(--fs-lg)", margin: 0 }}>Etsy ücret simülatörü</h3>
              </div>
              <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Ürün fiyatı (USD)
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={etsyPrice}
                    onChange={(e) => setEtsyPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="sim-input"
                  />
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Adet
                  <input
                    type="number"
                    min={1}
                    value={etsyQty}
                    onChange={(e) => setEtsyQty(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="sim-input"
                  />
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Kargo (USD)
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={etsyShip}
                    onChange={(e) => setEtsyShip(Math.max(0, Number(e.target.value) || 0))}
                    className="sim-input"
                  />
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Ödeme ülkesi
                  <select value={etsyCountry} onChange={(e) => setEtsyCountry(e.target.value as PaymentCountry)} className="sim-input">
                    {(Object.keys(PAYMENT_PROCESSING) as PaymentCountry[]).map((c) => (
                      <option key={c} value={c}>
                        {COUNTRY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <KpiCard label="Brüt gelir" value={etsyResult.revenueUSD.toFixed(2)} unit="USD" />
                <KpiCard label="Net üretici geliri" value={etsyResult.netToSellerUSD.toFixed(2)} unit="USD" color="var(--color-success)" />
              </div>
              <div style={{ display: "grid", gap: 6, fontSize: "var(--fs-xs)", color: "var(--text-mid)", marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Listing ücreti ({ETSY_LISTING_FEE_USD.toFixed(2)} USD × {etsyQty})</span>
                  <span className="font-mono">{etsyResult.listingFeeUSD.toFixed(2)} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Transaction ücreti (%{ETSY_TRANSACTION_FEE_PCT})</span>
                  <span className="font-mono">{etsyResult.transactionFeeUSD.toFixed(2)} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Ödeme işleme ({COUNTRY_LABELS[etsyCountry]})</span>
                  <span className="font-mono">{etsyResult.paymentProcessingUSD.toFixed(2)} USD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-hi)", paddingTop: 6, borderTop: "1px solid var(--border-hair)" }}>
                  <span>Toplam ücret (gelirin %{etsyResult.feePercentOfRevenue}&apos;i)</span>
                  <span className="font-mono">{etsyResult.totalFeesUSD.toFixed(2)} USD</span>
                </div>
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                ≈ {etsyResult.netToSellerTRY.toLocaleString("tr-TR")} ₺ (referans kur {USD_TO_TRY_REFERENCE} — temsili; gerçek sistemde işlem tarihli kur kaydı tutulur)
              </p>
            </div>

            {/* Yerel vitrin simülatörü */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <Store size={20} style={{ color: "var(--primary)" }} />
                <h3 style={{ fontSize: "var(--fs-lg)", margin: 0 }}>Yerel vitrin komisyon simülatörü</h3>
              </div>
              <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Ürün fiyatı (₺)
                  <input
                    type="number"
                    min={0}
                    value={localPrice}
                    onChange={(e) => setLocalPrice(Math.max(0, Number(e.target.value) || 0))}
                    className="sim-input"
                  />
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Adet
                  <input
                    type="number"
                    min={1}
                    value={localQty}
                    onChange={(e) => setLocalQty(Math.max(1, Math.round(Number(e.target.value) || 1)))}
                    className="sim-input"
                  />
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Teslimat bölgesi
                  <select value={localZoneId} onChange={(e) => setLocalZoneId(e.target.value)} className="sim-input">
                    {DELIVERY_ZONES.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.region} (+{z.deliveryFeeTRY} ₺)
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: "var(--fs-sm)" }}>
                  Hizmet bedeli: <span className="font-mono">%{localCommission.toFixed(1)}</span>
                  <input
                    type="range"
                    min={2.5}
                    max={6}
                    step={0.5}
                    value={localCommission}
                    onChange={(e) => setLocalCommission(Number(e.target.value))}
                    style={{ width: "100%", marginTop: 6 }}
                    aria-label="Hizmet bedeli yüzdesi"
                  />
                </label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <KpiCard label="Brüt gelir" value={localResult.revenueTRY.toFixed(0)} unit="₺" />
                <KpiCard label="Net üretici geliri" value={localResult.netToProducerTRY.toFixed(0)} unit="₺" color="var(--color-success)" />
              </div>
              <div style={{ display: "grid", gap: 6, fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Teslimat ücreti ({localZone.region})</span>
                  <span className="font-mono">{localZone.deliveryFeeTRY.toFixed(0)} ₺</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, color: "var(--text-hi)", paddingTop: 6, borderTop: "1px solid var(--border-hair)" }}>
                  <span>Hizmet bedeli (gelirin %{localResult.feePercentOfRevenue}&apos;i)</span>
                  <span className="font-mono">{localResult.commissionTRY.toFixed(0)} ₺</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- B2B TALEP AKIŞI ---------- */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading n="05" eyebrow="Restoran ve şef talebi" title="B2B talep nasıl işler?" />
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${B2B_FLOW.length}, 1fr)`, gap: 16 }} className="b2b-grid">
            {B2B_FLOW.map((s, i) => (
              <Reveal key={s.stage} i={i} as="div" className="card" style={{ padding: 18, position: "relative" }}>
                <span
                  className="font-mono"
                  style={{
                    display: "inline-block",
                    fontSize: "var(--fs-sm)",
                    fontWeight: 700,
                    color: "var(--accent)",
                    marginBottom: 10,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h4 style={{ fontSize: "var(--fs-base)", marginBottom: 6 }}>{s.stage}</h4>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)", margin: 0 }}>{s.detail}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- DÜRÜSTLÜK / UYUM KAPISI ---------- */}
      <section className="pine-band grain section" style={{ position: "relative" }}>
        <div className="container-x" style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
          <StampBadge
            center={
              <div style={{ textAlign: "center" }}>
                <Sparkles size={20} />
                <div style={{ fontSize: 11, marginTop: 4, fontWeight: 600 }}>DÜRÜST<br />TİCARET</div>
              </div>
            }
          />
          <div style={{ flex: 1, minWidth: 280 }}>
            <h2 style={{ fontSize: "var(--fs-h2)", marginBottom: 12 }}>Sertifika yoksa &quot;organik&quot; rozeti yok.</h2>
            <p style={{ color: "rgba(232,237,233,.78)", maxWidth: 620, marginBottom: 8 }}>
              Sponsorlu ürün organik sıralamayı değiştirmez, &quot;en uygun&quot; rozeti satın
              alınamaz. Etsy&apos;de başlayan işlem platform dışına yönlendirilmez; her işlemde
              toplam ücret ve net üretici geliri ödeme öncesi görünür. Her satış lotu tohumdan
              sevkiyata izlenebilir.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", flexShrink: 0 }}>
            <Link href="/izlenebilirlik" className="btn btn-secondary btn-lg">
              Lot zincirini gör
            </Link>
            <Link href="/plan" className="btn btn-accent btn-lg">
              Satışa hazır plan oluştur <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1100px) { .catalog-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 560px) { .catalog-grid { grid-template-columns: 1fr; } }

        .sim-input {
          display: block;
          width: 100%;
          margin-top: 6px;
          padding: 10px 12px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border-soft);
          background: var(--bg-surface);
          color: var(--text-hi);
          font-size: var(--fs-base);
        }
        .sim-input:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }

        @media (max-width: 900px) {
          .sim-grid { grid-template-columns: 1fr !important; }
          .b2b-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          .b2b-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}
