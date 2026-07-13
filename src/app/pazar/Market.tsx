"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
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
  type CatalogListing,
} from "@/data/commerce";
import { CROPS, CROP_BY_ID, type CropCategory } from "@/data/crops";
import { cropPhotoPath, primaryCredit } from "@/data/photoCredits";
import { microgreenPhotoPath } from "@/data/microgreenPhotoCredits";
import { NumberedHeading, StampBadge, WaveDivider } from "@/components/graphics";
import { SpotlightCard, KpiCard } from "@/components/visuals";
import { Reveal } from "@/components/ui";
import {
  Store,
  Package,
  Globe,
  Scale,
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Calendar,
  Sparkles,
  Search,
  Grid,
} from "@/components/icons";
import type { Role } from "@/lib/roles";
import { can } from "@/lib/roles";
import type { RealListing } from "@/server/repositories/listings";
import type { RealOrder } from "@/server/repositories/orders";
import type { RealCertificate } from "@/server/repositories/certificates";
import type { Jurisdiction } from "@/lib/rulePacks";
import { JURISDICTION_LABELS } from "@/lib/rulePacks";
import { CERTIFICATE_VERIFICATION_LABELS } from "@/lib/certificateReview";
import {
  createListingAction,
  placeOrderAction,
  toggleListingActiveAction,
  updateOrderStatusAction,
  createCertificateAction,
  reviewCertificateAction,
  type MarketFormState,
  type CertificateFormState,
} from "./actions";

export interface MarketSession {
  role: Role;
  workspaceId: string;
}

export interface MarketProps {
  session: MarketSession | null;
  realListings: RealListing[];
  myListings: RealListing[];
  myOrders: RealOrder[];
  incomingOrdersByListing: Record<string, RealOrder[]>;
  myCertificates: RealCertificate[];
  pendingCertificates: RealCertificate[];
}

const JURISDICTION_ORDER: Jurisdiction[] = ["TR", "EU", "US", "CA", "AU", "JP", "CODEX", "SA", "UK"];
const INITIAL_CERT_FORM_STATE: CertificateFormState = {};

// "Hasat Pazarı" kategori kimliği — ADR-009 (Ekosistem ve görsel kimlik) ve
// docs/design/hasat-pazari-gorsel-yon.html referans önizlemesiyle BİREBİR aynı renkler.
// Yeni palet İCAT EDİLMEDİ — bu tam olarak urunler/Explorer.tsx'teki CATEGORY_META.
const HASAT_CATEGORY_META: Record<CropCategory, { label: string; color: string; emoji: string }> = {
  "meyveli-sebze": { label: "Meyveli sebze", color: "#b23f26", emoji: "🍅" },
  yaprakli: { label: "Yapraklı", color: "#2b7a4b", emoji: "🥬" },
  aromatik: { label: "Aromatik", color: "#0f7a71", emoji: "🌿" },
  "kok-yumru": { label: "Kök & yumru", color: "#9a6410", emoji: "🥕" },
  baklagil: { label: "Baklagil", color: "#5c7a26", emoji: "🫘" },
  meyve: { label: "Meyve", color: "#a83560", emoji: "🍓" },
  "agac-meyve": { label: "Ağaç meyvesi", color: "#6b4226", emoji: "🫒" },
};

// Kategori rozeti gerçek fotoğraf gösterir (emoji-üzerine-emoji değil) — kataloğun kendi
// gerçek fotoğraflı ürünlerinden, kategori başına bir temsilci. Fotoğrafı olmayan bir
// kategori seçilirse (bu kataloğun kapsamadığı) emoji'ye zarifçe düşülür.
const CATEGORY_REPRESENTATIVE_CROP: Partial<Record<CropCategory, string>> = {
  "meyveli-sebze": "cherry-domates-kompakt",
  yaprakli: "roka",
  aromatik: "feslegen",
  meyve: "cilek",
};

const INITIAL_FORM_STATE: MarketFormState = {};

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

function catalogCategory(l: CatalogListing): CropCategory | undefined {
  return l.cropId ? CROP_BY_ID[l.cropId]?.category : undefined;
}

function catalogPhoto(l: CatalogListing): { path?: string; isApprox: boolean } {
  if (l.cropId) return { path: cropPhotoPath(l.cropId), isApprox: primaryCredit(l.cropId)?.isApproximation ?? false };
  if (l.microgreenId) return { path: microgreenPhotoPath(l.microgreenId), isApprox: false };
  return { path: undefined, isApprox: false };
}

function trLower(s: string) {
  return s.toLocaleLowerCase("tr");
}

export function Market({ session, realListings, myListings, myOrders, incomingOrdersByListing, myCertificates, pendingCertificates }: MarketProps) {
  const [createState, createAction, createPending] = useActionState(createListingAction, INITIAL_FORM_STATE);
  const [certState, certAction, certPending] = useActionState(createCertificateAction, INITIAL_CERT_FORM_STATE);
  const [certFormOpen, setCertFormOpen] = useState(false);
  const [orderPending, startOrderTransition] = useTransition();
  const [orderMsg, setOrderMsg] = useState<Record<string, string>>({});
  const [qtyByListing, setQtyByListing] = useState<Record<string, number>>({});
  const [reviewPending, startReviewTransition] = useTransition();
  const [reviewMsg, setReviewMsg] = useState<Record<string, string>>({});

  function handleCertReview(certificateId: string, decision: "onayla" | "reddet") {
    startReviewTransition(async () => {
      const res = await reviewCertificateAction(certificateId, decision);
      setReviewMsg((m) => ({ ...m, [certificateId]: res.error ?? res.success ?? "" }));
    });
  }

  function handlePlaceOrder(listingId: string) {
    const qty = qtyByListing[listingId] ?? 1;
    startOrderTransition(async () => {
      const res = await placeOrderAction(listingId, qty);
      setOrderMsg((m) => ({ ...m, [listingId]: res.error ?? res.success ?? "" }));
    });
  }

  function handleOrderStatus(orderId: string, status: "onaylandi" | "iptal") {
    startOrderTransition(async () => {
      await updateOrderStatusAction(orderId, status);
    });
  }

  const canManageCommerce = session ? can(session.role, "commerce.manage") : false;

  const [channelFilter, setChannelFilter] = useState<ChannelId | "hepsi">("hepsi");
  const [categoryFilter, setCategoryFilter] = useState<CropCategory | "hepsi">("hepsi");
  const [query, setQuery] = useState("");

  const catalogCounts = useMemo(() => {
    const m: Partial<Record<CropCategory, number>> = {};
    for (const l of CATALOG_WITH_EMOJI) {
      const cat = catalogCategory(l);
      if (cat) m[cat] = (m[cat] ?? 0) + 1;
    }
    return m;
  }, []);

  const q = trLower(query.trim());
  const filteredCatalog = useMemo(
    () =>
      CATALOG_WITH_EMOJI.filter((l) => {
        if (channelFilter !== "hepsi" && !l.channels.includes(channelFilter)) return false;
        if (categoryFilter !== "hepsi" && catalogCategory(l) !== categoryFilter) return false;
        if (q && !(trLower(l.title).includes(q) || trLower(l.producer).includes(q))) return false;
        return true;
      }),
    [channelFilter, categoryFilter, q]
  );
  const anyMarketFilter = channelFilter !== "hepsi" || categoryFilter !== "hepsi" || query.trim() !== "";

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
      {/* ---------- HASAT PAZARI HERO + KEŞFET ---------- */}
      {/* Görsel kimlik kaynağı: ADR-009 (Ekosistem önceliklendirmesi ve iki katmanlı görsel
          kimlik) + docs/design/hasat-pazari-gorsel-yon.html referans önizlemesi — kullanıcının
          kendi Pinterest panosu (pin.it/3hy0iVoBY, "Organic Store Website Design" ve ilişkili
          onlarca organik market tasarımı) temel alınarak hazırlandı. "Hasat Pazarı": toprak/
          terracotta birincil + hasat altını aksan + krem zemin; orman yeşili YALNIZ doğrulanmış
          "sertifikalı organik" rozetinde kullanılır (renk = kanıt sinyali). Evergreen Ledger'ın
          orman/altın kimliği profesyonel/üretici yüzeylerinde (plan, rotasyon, izlenebilirlik,
          sensör, kurasyon, uzman danışma, roller) AYNEN kalır — bu yalnız /pazar'a scoped.
          Kullanıcı geri bildirimi (2026-07-13): önce güçlü, alışverişe-hazır bir vitrin —
          kanal/ücret araçları önemli ama ikinci sırada. Tek hero, gerçek fotoğraflı ürün
          grid'i, çalışan arama+kategori+kanal filtresi buraya taşındı. */}
      <section className="market-hero-band">
        <div className="container-x">
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <span className="eyebrow market-hero-eyebrow">HASAT PAZARI</span>
            <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 10, marginBottom: 10 }} className="text-balance">
              Ürettiğini <em style={{ fontStyle: "italic", color: "#A1502E" }}>kaçırmadan</em> sat, aradığını güvenle bul.
            </h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 580, margin: "0 auto" }}>
              Yerel vitrin, restoran aboneliği, CSA kutusu ve Etsy — tek master katalogdan.
              Sertifikasız ürün &quot;organik&quot; olarak yayınlanamaz.
            </p>
          </div>

          <div className="market-category-row">
            <button
              type="button"
              className={`market-category-badge${categoryFilter === "hepsi" ? " is-on" : ""}`}
              onClick={() => setCategoryFilter("hepsi")}
              aria-pressed={categoryFilter === "hepsi"}
            >
              <span className="market-category-badge-icon market-category-badge-icon-all">
                <Grid size={22} />
              </span>
              <span>Tümü</span>
            </button>
            {(Object.keys(HASAT_CATEGORY_META) as CropCategory[])
              .filter((catId) => (catalogCounts[catId] ?? 0) > 0)
              .map((catId) => {
                const meta = HASAT_CATEGORY_META[catId];
                const on = categoryFilter === catId;
                const repCropId = CATEGORY_REPRESENTATIVE_CROP[catId];
                const repPhoto = repCropId ? cropPhotoPath(repCropId) : undefined;
                return (
                  <button
                    key={catId}
                    type="button"
                    className={`market-category-badge${on ? " is-on" : ""}`}
                    onClick={() => setCategoryFilter((cur) => (cur === catId ? "hepsi" : catId))}
                    aria-pressed={on}
                  >
                    <span className="market-category-badge-icon" style={{ background: meta.color }}>
                      {repPhoto ? (
                        <Image src={repPhoto} alt="" fill sizes="56px" style={{ objectFit: "cover" }} />
                      ) : (
                        meta.emoji
                      )}
                    </span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
          </div>

          <div className="market-toolbar">
            <div className="market-search-wrap">
              <span className="market-search-icon" aria-hidden>
                <Search size={17} />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün veya üretici ara…"
                aria-label="Pazarda ara"
                className="market-search-input"
              />
            </div>
            <div className="market-channel-chips">
              <button
                type="button"
                onClick={() => setChannelFilter("hepsi")}
                className={`market-chip${channelFilter === "hepsi" ? " is-on" : ""}`}
                aria-pressed={channelFilter === "hepsi"}
              >
                Tüm kanallar
              </button>
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setChannelFilter((cur) => (cur === c.id ? "hepsi" : c.id))}
                  className={`market-chip${channelFilter === c.id ? " is-on" : ""}`}
                  aria-pressed={channelFilter === c.id}
                >
                  {CHANNEL_LABEL_SHORT[c.id]}
                </button>
              ))}
              {anyMarketFilter && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setChannelFilter("hepsi");
                    setCategoryFilter("hepsi");
                    setQuery("");
                  }}
                >
                  <X size={14} /> Temizle
                </button>
              )}
            </div>
          </div>

          <div className="market-result-bar">
            <strong className="tnum">{filteredCatalog.length}</strong> ürün
            {anyMarketFilter && <span style={{ color: "var(--text-low)" }}> · {CATALOG_WITH_EMOJI.length} içinde</span>}
          </div>

          {/* --- Ana ürün listeleme grid'i (master katalog, gerçek fotoğraflar) --- */}
          {filteredCatalog.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <p style={{ color: "var(--text-mid)", margin: 0 }}>Bu filtrelerle eşleşen ürün yok.</p>
            </div>
          ) : (
            <div className="market-shop-grid">
              {filteredCatalog.map((l) => {
                const photo = catalogPhoto(l);
                const stock = STOCK_LABELS[l.stockType];
                const claim = CLAIM_LABELS[l.claim];
                const cat = catalogCategory(l);
                const catMeta = cat ? HASAT_CATEGORY_META[cat] : undefined;
                return (
                  <div key={l.id} className="market-shop-card">
                    <div className="market-shop-photo">
                      {photo.path ? (
                        <Image src={photo.path} alt={l.title} fill sizes="280px" style={{ objectFit: "cover" }} />
                      ) : (
                        <span className="market-shop-photo-fallback">{l.emoji}</span>
                      )}
                      {catMeta && (
                        <span className="market-shop-cat-tag" style={{ background: catMeta.color }}>
                          {catMeta.label}
                        </span>
                      )}
                      {photo.isApprox && <span className="market-shop-approx">≈ analog görsel</span>}
                    </div>
                    <div className="market-shop-body">
                      <div className="market-shop-producer">{l.producer} · {l.region}</div>
                      <div className="market-shop-title">{l.title}</div>
                      <div className="market-shop-price-row">
                        <span className="market-shop-price">{l.priceTRY.toLocaleString("tr-TR")} ₺</span>
                        <span className="market-shop-unit">{l.unitLabel}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        <span className={`chip chip-${stock.tone}`}>{stock.label}</span>
                        <span className={`chip chip-${claim.tone}`}>
                          <ShieldCheck size={11} /> {claim.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <WaveDivider fill="var(--color-paper-50)" />
      </section>

      {/* ---------- GERÇEK İLANLAR (canlı Postgres — statik katalog değil) ---------- */}
      <section className="section" style={{ paddingTop: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-x">
          <NumberedHeading n="00" eyebrow="Canlı, veritabanından" title="Az önce eklenen gerçek ilanlar" />
          <p style={{ color: "var(--text-mid)", maxWidth: 620, marginBottom: 24 }}>
            Yukarıdaki katalog örnek bir vitrindir; buradaki ilanlar gerçek üreticilerin
            hesaplarından geliyor. Ödeme tahsilatı henüz entegre değil — sipariş iki gerçek
            hesap arasında kalıcı bir talep kaydı oluşturur.
          </p>

          {/* --- Gerçek ilan grid'i (Postgres) --- */}
          <div className="market-real-grid">
            {realListings.length === 0 ? (
              <div className="card" style={{ padding: 28, textAlign: "center", gridColumn: "1 / -1" }}>
                <p style={{ color: "var(--text-mid)", marginBottom: 4 }}>
                  Henüz yayınlanmış gerçek ilan yok — ilk ilanı sen aç.
                </p>
                {!session && (
                  <Link href="/giris" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                    Giriş yap ve ilan aç
                  </Link>
                )}
              </div>
            ) : (
              realListings.map((l) => {
                const crop = l.cropId ? CROPS.find((c) => c.id === l.cropId) : undefined;
                const photoPath = l.cropId ? cropPhotoPath(l.cropId) : undefined;
                const credit = l.cropId ? primaryCredit(l.cropId) : undefined;
                const incoming = incomingOrdersByListing[l.id] ?? [];
                const isMine = myListings.some((m) => m.id === l.id);
                return (
                  <div key={l.id} className="card card-hover market-real-card">
                    {photoPath ? (
                      <div className="market-real-card-photo">
                        <Image src={photoPath} alt={credit?.isApproximation ? `${l.title} (analog görsel)` : l.title} fill sizes="280px" style={{ objectFit: "cover" }} />
                      </div>
                    ) : null}
                    <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      {!photoPath && <span className="market-real-card-emoji">{crop?.emoji ?? "🌱"}</span>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{l.title}</div>
                        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                          {l.producer} · {l.region}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono" style={{ fontSize: "var(--fs-lg)", fontWeight: 600, color: "#7c3b21" }}>
                      {l.priceTRY.toLocaleString("tr-TR")} ₺
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 8 }}>{l.unitLabel}</div>
                    <span className={`chip chip-${CLAIM_LABELS[l.claim].tone}`} style={{ width: "fit-content", marginBottom: 12 }}>
                      <ShieldCheck size={11} /> {CLAIM_LABELS[l.claim].label}
                    </span>

                    {isMine ? (
                      <div style={{ display: "grid", gap: 6 }}>
                        <span className="chip chip-info" style={{ width: "fit-content" }}>Senin ilanın</span>
                        {incoming.length > 0 && (
                          <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                            {incoming.map((o) => (
                              <div key={o.id} style={{ fontSize: "var(--fs-xs)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                                <span>{o.quantity}× · {o.totalPriceTRY.toLocaleString("tr-TR")} ₺ · {o.status}</span>
                                {o.status === "beklemede" && canManageCommerce && (
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button className="btn btn-primary btn-sm" style={{ padding: "4px 8px" }} disabled={orderPending} onClick={() => handleOrderStatus(o.id, "onaylandi")}>
                                      <Check size={12} />
                                    </button>
                                    <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} disabled={orderPending} onClick={() => handleOrderStatus(o.id, "iptal")}>
                                      <X size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input
                          type="number"
                          min={1}
                          defaultValue={1}
                          onChange={(e) => setQtyByListing((q) => ({ ...q, [l.id]: Math.max(1, Number(e.target.value) || 1) }))}
                          style={{ width: 56, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border-soft)" }}
                          aria-label="Miktar"
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={orderPending}
                          onClick={() => handlePlaceOrder(l.id)}
                        >
                          Sipariş ver
                        </button>
                      </div>
                    )}
                    {orderMsg[l.id] && (
                      <p style={{ fontSize: "var(--fs-xs)", marginTop: 8, color: "var(--text-mid)" }}>{orderMsg[l.id]}</p>
                    )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <WaveDivider fill="var(--color-paper-50)" />
      </section>

      {/* --- Vitrinim / Siparişlerim (yalnız giriş yapılmışsa) --- */}
      {session && (
        <section className="section paper-section">
          <div className="container-x" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} id="vitrinim-grid">
            <div>
              <NumberedHeading n="00" eyebrow="Kendi ilanın" title="Vitrinim" />
              <form action={createAction} style={{ display: "grid", gap: 10, marginBottom: 20 }} className="card" >
                <div style={{ padding: 18, display: "grid", gap: 10 }}>
                  <input name="title" placeholder="Ürün adı (ör. Cherry Domates)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="producer" placeholder="Üretici adı" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="region" placeholder="Bölge (ör. İzmir, Ege)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="unitLabel" placeholder="Birim (ör. 500 g file)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="priceTRY" type="number" min={1} step={1} placeholder="Fiyat (₺)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <select name="cropId" className="btn btn-secondary" defaultValue="">
                    <option value="">Ürün kataloğundan seç (opsiyonel)</option>
                    {CROPS.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                  <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
                    Organik iddia durumu
                    <select name="claim" className="btn btn-secondary" defaultValue="yontem-kayitli">
                      {(Object.keys(CLAIM_LABELS) as (keyof typeof CLAIM_LABELS)[]).map((c) => (
                        <option key={c} value={c}>{CLAIM_LABELS[c].label}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      &quot;Sertifikalı organik&quot; veya &quot;Geçiş süreci&quot; seçersen, aşağıdaki
                      Sertifikalarım bölümünde bu ürünü kapsayan, DOĞRULANMIŞ (yalnız &quot;beklemede&quot;
                      değil) bir sertifikan olmalı — yoksa ilan reddedilir ya da gerçek durum
                      istediğinden daha zayıfsa (ör. hâlâ geçiş sürecinde) ilan o durumla yayınlanır,
                      sonuç her zaman aşağıda açıkça belirtilir (FR-126).
                    </span>
                  </label>
                  {createState.error && <span className="chip chip-danger" style={{ width: "fit-content" }}><X size={12} /> {createState.error}</span>}
                  {createState.success && <span className="chip chip-ok" style={{ width: "fit-content" }}><Check size={12} /> {createState.success}</span>}
                  <button type="submit" disabled={createPending} className="btn btn-primary" style={{ justifySelf: "start" }}>
                    {createPending ? "Yayınlanıyor…" : "İlanı yayınla"}
                  </button>
                </div>
              </form>
              {myListings.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  {myListings.map((l) => (
                    <div key={l.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "var(--fs-sm)" }}>{l.title} — {l.priceTRY.toLocaleString("tr-TR")} ₺</span>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className={`chip chip-${CLAIM_LABELS[l.claim].tone}`}>
                          <ShieldCheck size={11} /> {CLAIM_LABELS[l.claim].label}
                        </span>
                        <button
                          className={`chip ${l.active ? "chip-ok" : "chip-danger"}`}
                          style={{ border: "none", cursor: "pointer" }}
                          onClick={() => startOrderTransition(() => toggleListingActiveAction(l.id, !l.active))}
                        >
                          {l.active ? "Aktif" : "Pasif"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <NumberedHeading n="00" eyebrow="Alıcı olarak" title="Siparişlerim" />
              {myOrders.length === 0 ? (
                <p style={{ color: "var(--text-mid)" }}>Henüz sipariş vermedin.</p>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {myOrders.map((o) => (
                    <div key={o.id} className="card" style={{ padding: 12, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "var(--fs-sm)" }}>{o.quantity}× · {o.totalPriceTRY.toLocaleString("tr-TR")} ₺</span>
                      <span className={`chip ${o.status === "onaylandi" ? "chip-ok" : o.status === "iptal" ? "chip-danger" : "chip-warn"}`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* --- Sertifikalarım (organik iddia kanıtı — FR-125/126, rulePacks.ts'e bağlı) --- */}
      {session && (
        <section className="section">
          <div className="container-x">
            <NumberedHeading n="00" eyebrow="Organik iddia kanıtı" title="Sertifikalarım" />
            <p style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 20 }}>
              Bir ilanda &quot;Sertifikalı organik&quot; veya &quot;Geçiş süreci&quot; iddiası
              göstermek için önce gerçek sertifikanı buraya kaydet — kapsamdaki ürünler,
              geçerlilik tarihleri ve yargı alanı burada tutulur, ilan formunda otomatik
              doğrulanır (bkz. src/lib/rulePacks.ts evaluateClaim). <strong>Kayıt, doğrulama
              değildir</strong> — buraya girdiğin hiçbir alan bu aşamada kontrol edilmez.
              Sertifikan &quot;Beklemede&quot; durumundayken hiçbir organik iddiayı açamaz;
              önce compliance.review izinli bağımsız bir rol onaylamalıdır (yalnız kendi
              işletmen değil — bkz. FR-126/ADR-008).
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCertFormOpen((o) => !o)}
              aria-expanded={certFormOpen}
            >
              <Sparkles size={15} /> {certFormOpen ? "Formu kapat" : "Yeni sertifika kaydet"}
            </button>
            {certFormOpen && (
              <form action={certAction} className="card" style={{ padding: 18, marginTop: 12, display: "grid", gap: 10, maxWidth: 560 }}>
                <input name="holder" placeholder="Sertifika sahibi (işletme adı)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                <input name="issuer" placeholder="Sertifikasyon kuruluşu" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                <label style={{ display: "grid", gap: 4 }}>
                  <select name="jurisdiction" className="btn btn-secondary" defaultValue="TR">
                    {JURISDICTION_ORDER.map((j) => (
                      <option key={j} value={j}>{JURISDICTION_LABELS[j]}</option>
                    ))}
                  </select>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Yalnız <strong>Türkiye</strong> için ilan formu şu an otomatik kontrol yapar —
                    diğer yargı alanları kaydedilir ama henüz bir ilanı doğrulamaz.
                  </span>
                </label>
                <input
                  name="scopeCropIds"
                  list="scope-crop-ids"
                  placeholder="Kapsam — virgülle ürün id'leri (ör. cherry-domates-kompakt,feslegen)"
                  required
                  className="btn btn-secondary"
                  style={{ textAlign: "left" }}
                />
                <datalist id="scope-crop-ids">
                  {CROPS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </datalist>
                <div style={{ display: "flex", gap: 10 }}>
                  <label style={{ flex: 1, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Geçerlilik başlangıcı
                    <input name="validFrom" type="date" required className="btn btn-secondary" style={{ textAlign: "left", marginTop: 4 }} />
                  </label>
                  <label style={{ flex: 1, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Geçerlilik bitişi
                    <input name="validTo" type="date" required className="btn btn-secondary" style={{ textAlign: "left", marginTop: 4 }} />
                  </label>
                </div>
                <input name="documentUrl" placeholder="Belge URL'i (opsiyonel)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)" }}>
                  <input name="inTransition" type="checkbox" />
                  Geçiş sürecinde (henüz tam sertifikalı değil)
                </label>
                {certState.error && <span className="chip chip-danger" style={{ width: "fit-content" }}><X size={12} /> {certState.error}</span>}
                {certState.success && <span className="chip chip-ok" style={{ width: "fit-content" }}><Check size={12} /> {certState.success}</span>}
                <button type="submit" disabled={certPending} className="btn btn-primary" style={{ justifySelf: "start" }}>
                  Sertifikayı kaydet
                </button>
              </form>
            )}
            {myCertificates.length > 0 && (
              <div style={{ display: "grid", gap: 8, marginTop: 16, maxWidth: 640 }}>
                {myCertificates.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <strong style={{ fontSize: "var(--fs-sm)" }}>{c.issuer} — {JURISDICTION_LABELS[c.jurisdiction]}</strong>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span className={`chip ${c.inTransition ? "chip-info" : "chip-ok"}`}>
                          {c.inTransition ? "Geçiş sürecinde" : "Tam sertifikalı"}
                        </span>
                        <span
                          className={`chip ${
                            c.verificationStatus === "onaylandi" ? "chip-ok" : c.verificationStatus === "reddedildi" ? "chip-danger" : "chip-warn"
                          }`}
                        >
                          <ShieldCheck size={11} /> {CERTIFICATE_VERIFICATION_LABELS[c.verificationStatus]}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 6 }}>
                      Kapsam: {c.scopeCropIds.join(", ")} · Geçerlilik: {c.validFrom} – {c.validTo}
                    </div>
                    {c.verificationStatus === "reddedildi" && c.verificationNote && (
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-danger, #b23f26)", marginTop: 6 }}>
                        Red gerekçesi: {c.verificationNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- Sertifika İnceleme Kuyruğu (yalnız compliance.review izinli rol) --- */}
      {session && can(session.role, "compliance.review") && (
        <section className="section paper-section">
          <div className="container-x">
            <NumberedHeading n="00" eyebrow="Bağımsız doğrulama" title="Sertifika inceleme kuyruğu" />
            <p style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 20 }}>
              Platform genelinde, başka işletmelerden gelen beklemedeki sertifikalar
              burada listelenir. Kendi işletmenin sertifikaları burada GÖRÜNMEZ ve
              onaylanamaz — kendi kaydını kendin onaylamak kendi-kendini-doğrulama
              sayılır, sunucu tarafında da ayrıca reddedilir.
            </p>
            {pendingCertificates.length === 0 ? (
              <p style={{ color: "var(--text-low)" }}>Beklemede sertifika yok.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
                {pendingCertificates.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <strong style={{ fontSize: "var(--fs-sm)" }}>{c.holder} · {c.issuer} — {JURISDICTION_LABELS[c.jurisdiction]}</strong>
                      <span className={`chip ${c.inTransition ? "chip-info" : "chip-ok"}`}>
                        {c.inTransition ? "Geçiş sürecinde iddia" : "Tam sertifikalı iddia"}
                      </span>
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 6 }}>
                      Kapsam: {c.scopeCropIds.join(", ")} · Geçerlilik: {c.validFrom} – {c.validTo}
                      {c.documentUrl && (
                        <>
                          {" · "}
                          <a href={c.documentUrl} target="_blank" rel="noopener noreferrer">Belge</a>
                        </>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                      <button className="btn btn-primary btn-sm" disabled={reviewPending} onClick={() => handleCertReview(c.id, "onayla")}>
                        <Check size={13} /> Onayla
                      </button>
                      <button className="btn btn-ghost btn-sm" disabled={reviewPending} onClick={() => handleCertReview(c.id, "reddet")}>
                        <X size={13} /> Reddet
                      </button>
                      {reviewMsg[c.id] && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{reviewMsg[c.id]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
                  <div className="card card-hover market-card" style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
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
        /* "Hasat Pazarı" — ADR-009 + docs/design/hasat-pazari-gorsel-yon.html referans
           önizlemesiyle BİREBİR: altın→krem→orman yeşili degrade hero (koyu solid yeşil DEĞİL),
           toprak/terracotta vurgu metni, kategoriye-özel renkli rozetler (Explorer.tsx'teki
           CATEGORY_META ile aynı palet), gerçek ürün fotoğrafları. Yalnız bu bant/kart setine
           scoped — Evergreen Ledger'ın global token'ları değişmedi. */
        .market-hero-band {
          padding: 56px 0 0;
          background: linear-gradient(135deg, #f7de9f 0%, #F9F8F3 55%, #dcede1 100%);
        }
        .market-hero-eyebrow { color: #7c3b21; }
        .market-category-row {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        .market-category-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          font-size: var(--fs-xs);
          color: var(--text-mid);
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 12px;
          transition: transform var(--dur-instant, 100ms) var(--ease-out, ease), background var(--dur-fast, 150ms) ease;
        }
        .market-category-badge:hover { transform: translateY(-2px); }
        .market-category-badge:active { transform: scale(0.97); }
        .market-category-badge.is-on { background: color-mix(in srgb, #A1502E 10%, transparent); color: #7c3b21; }
        .market-category-badge-icon {
          position: relative;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          overflow: hidden;
          font-size: 24px;
          color: #fff;
          box-shadow: var(--shadow-sm, 0 1px 2px rgba(28,36,32,.08));
          transition: box-shadow var(--dur-fast, 150ms) ease, transform var(--dur-fast, 150ms) ease;
        }
        .market-category-badge-icon-all {
          background: linear-gradient(135deg, #7c3b21, #A1502E);
        }
        .market-category-badge.is-on .market-category-badge-icon,
        .market-category-badge:hover .market-category-badge-icon {
          box-shadow: 0 0 0 3px color-mix(in srgb, #A1502E 30%, transparent), var(--shadow-sm, 0 1px 2px rgba(28,36,32,.08));
          transform: scale(1.05);
        }

        /* --- arama + kanal filtre araç çubuğu --- */
        .market-toolbar {
          display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
          justify-content: space-between; margin: 8px 0 18px;
        }
        .market-search-wrap { position: relative; flex: 1; min-width: 240px; max-width: 420px; }
        .market-search-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          color: var(--color-ink-500, var(--text-low)); pointer-events: none;
        }
        .market-search-input {
          width: 100%; height: 46px; padding: 0 16px 0 42px;
          border-radius: 999px; border: 1.5px solid color-mix(in srgb, #A1502E 20%, var(--border-soft));
          background: #fff; color: var(--color-ink-900, var(--text-hi)); font-size: var(--fs-base);
          transition: border-color var(--dur-fast, 150ms) ease, box-shadow var(--dur-fast, 150ms) ease;
        }
        .dark .market-search-input { background: var(--bg-surface); color: var(--text-hi); }
        .market-search-input:focus-visible { outline: none; border-color: #A1502E; box-shadow: 0 0 0 3px color-mix(in srgb, #A1502E 18%, transparent); }
        .market-channel-chips { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .market-chip {
          height: 38px; padding: 0 16px; border-radius: 999px; cursor: pointer;
          font-size: var(--fs-sm); font-weight: 600; white-space: nowrap;
          border: 1.5px solid color-mix(in srgb, #A1502E 20%, var(--border-soft));
          background: #fff; color: var(--color-ink-700, var(--text-mid));
          transition: background var(--dur-fast, 150ms) ease, color var(--dur-fast, 150ms) ease;
        }
        .dark .market-chip { background: var(--bg-surface); }
        .market-chip:hover { border-color: #A1502E; }
        .market-chip.is-on { background: #A1502E; border-color: #A1502E; color: #fff; }
        .market-result-bar { font-size: var(--fs-sm); color: var(--text-mid); margin-bottom: 16px; }

        /* --- ana ürün listeleme grid'i (master katalog) --- */
        .market-shop-grid {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px;
          padding-bottom: 16px;
        }
        @media (max-width: 1100px) { .market-shop-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 560px) { .market-shop-grid { grid-template-columns: 1fr; } }
        .market-shop-card {
          background: #fff; border-radius: var(--radius-card); overflow: hidden;
          border: 1px solid color-mix(in srgb, #A1502E 18%, var(--border-soft));
          box-shadow: var(--shadow-sm); display: flex; flex-direction: column;
          transition: transform var(--dur-fast, 150ms) var(--ease-out, ease), box-shadow var(--dur-fast, 150ms) ease, border-color var(--dur-fast, 150ms) ease;
        }
        .dark .market-shop-card { background: var(--bg-surface); }
        .market-shop-card:hover { transform: translateY(-3px); border-color: #A1502E; box-shadow: 0 10px 26px color-mix(in srgb, #A1502E 18%, transparent); }
        .market-shop-photo { position: relative; width: 100%; height: 148px; background: var(--color-paper-200, var(--bg-surface-2)); flex-shrink: 0; }
        .market-shop-photo-fallback { position: absolute; inset: 0; display: grid; place-items: center; font-size: 40px; }
        .market-shop-cat-tag {
          position: absolute; left: 10px; bottom: 10px; color: #fff; font-weight: 700;
          font-size: 10px; letter-spacing: 0.03em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 999px; box-shadow: var(--shadow-sm);
        }
        .market-shop-approx {
          position: absolute; right: 10px; top: 10px; font-size: 9px; font-weight: 700;
          padding: 3px 8px; border-radius: 999px; color: #fff;
          background: color-mix(in srgb, var(--color-warning) 80%, black 8%);
        }
        .market-shop-body { padding: 14px 16px 16px; }
        .market-shop-producer { font-size: 11px; color: var(--color-ink-500, var(--text-low)); margin-bottom: 6px; }
        .market-shop-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
        .market-shop-price-row { display: flex; align-items: baseline; gap: 8px; }
        .market-shop-price { font-family: var(--font-mono); font-size: 19px; font-weight: 700; color: #7c3b21; }
        .dark .market-shop-price { color: var(--color-gold-300, #A1502E); }
        .market-shop-unit { font-size: 11px; color: var(--color-ink-500, var(--text-low)); }

        .market-real-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          padding-bottom: 8px;
        }
        .market-real-card {
          background: #FDFCF8 !important;
          padding: 0 !important;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .market-real-card-photo {
          position: relative;
          width: 100%;
          height: 132px;
          background: var(--bg-surface-2);
          flex-shrink: 0;
        }
        .market-real-card-emoji {
          width: 40px; height: 40px; border-radius: 999px;
          display: grid; place-items: center; font-size: 20px;
          background: color-mix(in srgb, #A1502E 12%, transparent);
        }
        @media (max-width: 1100px) { .market-real-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 560px) { .market-real-grid { grid-template-columns: 1fr; } }
        @media (max-width: 800px) { #vitrinim-grid { grid-template-columns: 1fr !important; } }

        .catalog-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        @media (max-width: 1100px) { .catalog-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 560px) { .catalog-grid { grid-template-columns: 1fr; } }

        /* "Hasat pazarı" sıcak aksanı — yalnız bu vitrin kartlarına özel, katmanlı (additive).
           Kaynak: Dribbble "Organic Food (Marketplace) V18" (Vitali Zahharov) paylaşılan paleti
           (#F9F8F3 krem, #A1502E toprak/kiremit) — Evergreen Ledger'ın orman yeşili/altın kimliğini
           DEĞİŞTİRMEZ, yalnız pazar sayfasının ürün kartlarına sıcak bir vurgu katmanı ekler. */
        .market-card {
          background: color-mix(in srgb, #F9F8F3 88%, var(--bg-surface));
          border-color: color-mix(in srgb, #A1502E 22%, var(--border-hair));
        }
        .dark .market-card {
          background: color-mix(in srgb, #A1502E 10%, var(--bg-surface));
          border-color: color-mix(in srgb, #A1502E 30%, var(--border-hair));
        }
        .market-card:hover {
          border-color: #A1502E;
          box-shadow: 0 8px 24px color-mix(in srgb, #A1502E 18%, transparent);
        }

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
