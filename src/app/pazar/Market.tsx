"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  CHANNELS,
  DELIVERY_ZONES,
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
import { CROPS, CROP_BY_ID, type CropCategory } from "@/data/crops";
import { cropPhotoPath, primaryCredit } from "@/data/photoCredits";
import { microgreenPhotoPath } from "@/data/microgreenPhotoCredits";
import { NumberedHeading, WaveDivider } from "@/components/graphics";
import { KpiCard } from "@/components/visuals";
import {
  Store,
  Package,
  Globe,
  Check,
  X,
  ShieldCheck,
  Calendar,
  Sparkles,
  Search,
  Grid,
} from "@/components/icons";
import type { Role } from "@/lib/roles";
import { can } from "@/lib/roles";
import { CartProvider, useCart } from "./CartContext";
import { CartDrawer } from "./CartDrawer";
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
  setListingStockAction,
  updateOrderStatusAction,
  createCertificateAction,
  reviewCertificateAction,
  revokeCertificateAction,
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
  revocableCertificates: RealCertificate[];
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

// Kategori rozeti gerçek fotoğraf gösterir (emoji-üzerine-emoji değil) — kategori başına bir
// temsilci. Fotoğrafı olmayan bir kategori seçilirse emoji'ye zarifçe düşülür.
const CATEGORY_REPRESENTATIVE_CROP: Partial<Record<CropCategory, string>> = {
  "meyveli-sebze": "cherry-domates-kompakt",
  yaprakli: "roka",
  aromatik: "feslegen",
  meyve: "cilek",
};

const INITIAL_FORM_STATE: MarketFormState = {};

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

// Gerçek ilanın kategorisi/fotoğrafı — statik CATALOG değil, canlı RealListing üzerinden.
function listingCategory(l: RealListing): CropCategory | undefined {
  return l.cropId ? CROP_BY_ID[l.cropId]?.category : undefined;
}

function listingPhoto(l: RealListing): { path?: string; isApprox: boolean } {
  if (l.cropId) return { path: cropPhotoPath(l.cropId), isApprox: primaryCredit(l.cropId)?.isApproximation ?? false };
  if (l.microgreenId) return { path: microgreenPhotoPath(l.microgreenId), isApprox: false };
  return { path: undefined, isApprox: false };
}

function trLower(s: string) {
  return s.toLocaleLowerCase("tr");
}

export function Market(props: MarketProps) {
  return (
    <CartProvider>
      <MarketInner {...props} />
      <CartDrawer />
    </CartProvider>
  );
}

function MarketInner({ session, realListings, myListings, myOrders, incomingOrdersByListing, myCertificates, pendingCertificates, revocableCertificates }: MarketProps) {
  const { addItem } = useCart();
  const [createState, createAction, createPending] = useActionState(createListingAction, INITIAL_FORM_STATE);
  const [certState, certAction, certPending] = useActionState(createCertificateAction, INITIAL_CERT_FORM_STATE);
  const [certFormOpen, setCertFormOpen] = useState(false);
  const [orderPending, startOrderTransition] = useTransition();
  const [orderMsg, setOrderMsg] = useState<Record<string, string>>({});
  const [qtyByListing, setQtyByListing] = useState<Record<string, number>>({});
  const [reviewPending, startReviewTransition] = useTransition();
  const [reviewMsg, setReviewMsg] = useState<Record<string, string>>({});
  const [revokeNoteDraft, setRevokeNoteDraft] = useState<Record<string, string>>({});
  const [revokePending, startRevokeTransition] = useTransition();
  const [revokeMsg, setRevokeMsg] = useState<Record<string, string>>({});
  const [stockDraft, setStockDraft] = useState<Record<string, number>>({});
  const [stockMsg, setStockMsg] = useState<Record<string, string>>({});
  const [stockPending, startStockTransition] = useTransition();

  // Satıcı geliri: mevcut incomingOrdersByListing prop'undan türetilir, ek sunucu çağrısı
  // gerekmez. Yalnız satıcının ONAYLADIĞI siparişler sayılır — "beklemede" henüz gerçek
  // bir gelir taahhüdü değildir, "iptal" zaten hiç sayılmamalı.
  const sellerRevenue = useMemo(() => {
    const approvedOrders = Object.values(incomingOrdersByListing)
      .flat()
      .filter((o) => o.status === "onaylandi");
    return {
      totalTRY: approvedOrders.reduce((sum, o) => sum + o.totalPriceTRY, 0),
      orderCount: approvedOrders.length,
    };
  }, [incomingOrdersByListing]);

  function handleCertReview(certificateId: string, decision: "onayla" | "reddet") {
    startReviewTransition(async () => {
      const res = await reviewCertificateAction(certificateId, decision);
      setReviewMsg((m) => ({ ...m, [certificateId]: res.error ?? res.success ?? "" }));
    });
  }

  function handleCertRevoke(certificateId: string) {
    const note = (revokeNoteDraft[certificateId] ?? "").trim();
    if (!note) {
      setRevokeMsg((m) => ({ ...m, [certificateId]: "İptal gerekçesi zorunludur." }));
      return;
    }
    startRevokeTransition(async () => {
      const res = await revokeCertificateAction(certificateId, note);
      setRevokeMsg((m) => ({ ...m, [certificateId]: res.error ?? res.success ?? "" }));
    });
  }

  function handleStockUpdate(listingId: string, currentQty: number) {
    const next = stockDraft[listingId] ?? currentQty;
    startStockTransition(async () => {
      const res = await setListingStockAction(listingId, next);
      setStockMsg((m) => ({ ...m, [listingId]: res.error ?? res.success ?? "" }));
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

  // Kategori sayıları GERÇEK ilanlar üzerinden — statik katalog değil.
  const categoryCounts = useMemo(() => {
    const m: Partial<Record<CropCategory, number>> = {};
    for (const l of realListings) {
      const cat = listingCategory(l);
      if (cat) m[cat] = (m[cat] ?? 0) + 1;
    }
    return m;
  }, [realListings]);

  const q = trLower(query.trim());
  const filteredListings = useMemo(
    () =>
      realListings.filter((l) => {
        if (channelFilter !== "hepsi" && !l.channels.includes(channelFilter)) return false;
        if (categoryFilter !== "hepsi" && listingCategory(l) !== categoryFilter) return false;
        if (q && !(trLower(l.title).includes(q) || trLower(l.producer).includes(q))) return false;
        return true;
      }),
    [realListings, channelFilter, categoryFilter, q]
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
      {/* ---------- HASAT PAZARI — KOMPAKT VİTRİN BAŞLIĞI + GERÇEK ÜRÜN GRID'İ ---------- */}
      {/* Kullanıcı geri bildirimi (2026-07-13/14): önce güçlü, alışverişe-hazır, TIKLANABİLİR
          bir vitrin. Ana grid artık canlı Postgres ilanları (statik demo katalog değil) —
          her kart /pazar/[id] detay sayfasına gider, sipariş/sepet butonları bağımsız çalışır.
          Görsel kimlik: ADR-009 + docs/design/hasat-pazari-gorsel-yon.html — yalnız /pazar'a
          scoped toprak/altın vurgu; Evergreen Ledger'ın global token'ları değişmedi. */}
      <section className="market-hero-band">
        <div className="container-x">
          <div style={{ textAlign: "center", marginBottom: 22 }}>
            <span className="eyebrow market-hero-eyebrow">HASAT PAZARI</span>
            <h1 style={{ fontSize: "var(--fs-h2)", marginTop: 8, marginBottom: 8 }} className="text-balance">
              Yerel üreticilerin <em style={{ fontStyle: "italic", color: "#A1502E" }}>gerçek</em> ürünleri.
            </h1>
            <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-base)", maxWidth: 560, margin: "0 auto" }}>
              Sertifikasız ürün &quot;organik&quot; olarak yayınlanamaz. Ödeme tahsilatı henüz
              entegre değil — sipariş, alıcı ve üretici arasında kalıcı bir talep kaydı oluşturur.
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
              .filter((catId) => (categoryCounts[catId] ?? 0) > 0)
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
            <strong className="tnum">{filteredListings.length}</strong> ürün
            {anyMarketFilter && <span style={{ color: "var(--text-low)" }}> · {realListings.length} içinde</span>}
          </div>

          {/* --- Ana ürün grid'i: canlı ilanlar, tıklanabilir kartlar --- */}
          {realListings.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <p style={{ color: "var(--text-mid)", marginBottom: 4 }}>
                Henüz yayınlanmış ilan yok — ilk ilanı sen aç.
              </p>
              {!session && (
                <Link href="/giris" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>
                  Giriş yap ve ilan aç
                </Link>
              )}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="card" style={{ padding: 28, textAlign: "center" }}>
              <p style={{ color: "var(--text-mid)", margin: 0 }}>Bu filtrelerle eşleşen ürün yok.</p>
            </div>
          ) : (
            <div className="market-shop-grid">
              {filteredListings.map((l) => {
                const photo = listingPhoto(l);
                const stock = STOCK_LABELS[l.stockType];
                const claim = CLAIM_LABELS[l.claim];
                const cat = listingCategory(l);
                const catMeta = cat ? HASAT_CATEGORY_META[cat] : undefined;
                const crop = l.cropId ? CROP_BY_ID[l.cropId] : undefined;
                const incoming = incomingOrdersByListing[l.id] ?? [];
                const isMine = myListings.some((m) => m.id === l.id);
                return (
                  <div key={l.id} className="market-shop-card">
                    {/* Kart gövdesi (foto + başlık) detaya götürür; butonlar bağımsız kalır. */}
                    <Link href={`/pazar/${l.id}`} className="market-shop-photo-link" aria-label={`${l.title} detayını aç`}>
                      <div className="market-shop-photo">
                        {photo.path ? (
                          <Image src={photo.path} alt={l.title} fill sizes="280px" style={{ objectFit: "cover" }} />
                        ) : (
                          <span className="market-shop-photo-fallback">{crop?.emoji ?? "🌱"}</span>
                        )}
                        {catMeta && (
                          <span className="market-shop-cat-tag" style={{ background: catMeta.color }}>
                            {catMeta.label}
                          </span>
                        )}
                        {photo.isApprox && <span className="market-shop-approx">≈ analog görsel</span>}
                      </div>
                    </Link>
                    <div className="market-shop-body">
                      <Link href={`/pazar/${l.id}`} className="market-shop-title-link">
                        <div className="market-shop-producer">{l.producer} · {l.region}</div>
                        <div className="market-shop-title">{l.title}</div>
                      </Link>
                      <div className="market-shop-price-row">
                        <span className="market-shop-price">{l.priceTRY.toLocaleString("tr-TR")} ₺</span>
                        <span className="market-shop-unit">{l.unitLabel}</span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                        <span className={`chip ${l.stockQty > 0 ? (l.stockQty <= 3 ? "chip-warn" : "chip-ok") : "chip-danger"}`}>
                          <Package size={11} /> {l.stockQty > 0 ? `${l.stockQty} adet stokta` : "Tükendi"}
                        </span>
                        <span className={`chip chip-${claim.tone}`}>
                          <ShieldCheck size={11} /> {claim.label}
                        </span>
                      </div>
                      <div className="market-shop-spec">
                        <Calendar size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
                        {FORMAT_LABELS[l.format]} · Raf ömrü {l.shelfLifeDays} gün · {stock.label}
                      </div>

                      {/* --- Satın alma / sahiplik eylemleri --- */}
                      <div className="market-shop-actions">
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
                        ) : l.stockQty <= 0 ? (
                          <span className="chip chip-danger" style={{ width: "fit-content" }}>Stok tükendi</span>
                        ) : (
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                            <input
                              type="number"
                              min={1}
                              max={l.stockQty}
                              defaultValue={1}
                              onChange={(e) => setQtyByListing((qm) => ({ ...qm, [l.id]: Math.min(l.stockQty, Math.max(1, Number(e.target.value) || 1)) }))}
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
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() =>
                                addItem(
                                  { listingId: l.id, title: l.title, priceTRY: l.priceTRY, unitLabel: l.unitLabel, maxQty: l.stockQty },
                                  qtyByListing[l.id] ?? 1
                                )
                              }
                            >
                              Sepete ekle
                            </button>
                          </div>
                        )}
                        {orderMsg[l.id] && (
                          <p style={{ fontSize: "var(--fs-xs)", marginTop: 8, color: "var(--text-mid)" }}>{orderMsg[l.id]}</p>
                        )}
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

      {/* --- Vitrinim / Siparişlerim (yalnız giriş yapılmışsa) --- */}
      {session && (
        <section className="section paper-section">
          <div className="container-x" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} id="vitrinim-grid">
            <div>
              <NumberedHeading n="00" eyebrow="Kendi ilanın" title="Vitrinim" />
              {myListings.length > 0 && (
                <div className="card" style={{ padding: 16, marginBottom: 18, display: "flex", gap: 24, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Onaylanmış gelir</div>
                    <div className="font-mono" style={{ fontSize: "var(--fs-lg)", fontWeight: 600, color: "#7c3b21" }}>{sellerRevenue.totalTRY.toLocaleString("tr-TR")} ₺</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Onaylı sipariş</div>
                    <div className="font-mono" style={{ fontSize: "var(--fs-lg)", fontWeight: 600 }}>{sellerRevenue.orderCount}</div>
                  </div>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", alignSelf: "center", marginLeft: "auto" }}>
                    Yalnız senin onayladığın siparişler sayılır — ödeme tahsilatı henüz entegre değil.
                  </p>
                </div>
              )}
              <form action={createAction} style={{ display: "grid", gap: 10, marginBottom: 20 }} className="card" >
                <div style={{ padding: 18, display: "grid", gap: 10 }}>
                  <input name="title" placeholder="Ürün adı (ör. Cherry Domates)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="producer" placeholder="Üretici adı" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="region" placeholder="Bölge (ör. İzmir, Ege)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="unitLabel" placeholder="Birim (ör. 500 g file)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="priceTRY" type="number" min={1} step={1} placeholder="Fiyat (₺)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="stockQty" type="number" min={0} step={1} placeholder="Stok adedi (ör. 25)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
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
                    <div key={l.id} className="card" style={{ padding: 12, display: "grid", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Link href={`/pazar/${l.id}`} style={{ fontSize: "var(--fs-sm)", color: "inherit", textDecoration: "none" }}>
                          {l.title} — {l.priceTRY.toLocaleString("tr-TR")} ₺
                        </Link>
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
                      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                        <Package size={13} style={{ color: "var(--text-low)" }} />
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>Stok:</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={l.stockQty}
                          onChange={(e) => setStockDraft((d) => ({ ...d, [l.id]: Math.max(0, Math.round(Number(e.target.value) || 0)) }))}
                          style={{ width: 64, padding: "4px 6px", borderRadius: 8, border: "1px solid var(--border-soft)" }}
                          aria-label={`${l.title} stok adedi`}
                        />
                        <button className="btn btn-ghost btn-sm" disabled={stockPending} onClick={() => handleStockUpdate(l.id, l.stockQty)}>
                          Güncelle
                        </button>
                        {stockMsg[l.id] && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{stockMsg[l.id]}</span>}
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
                    İlan formu yalnız işletmenin ana yargı alanına ({JURISDICTION_LABELS.TR} —
                    şu an her işletme için varsayılan) karşı otomatik kontrol yapar; farklı bir
                    yargı alanı seçip kaydedersen sertifika saklanır ama henüz hiçbir ilanı
                    doğrulamaz (ayarlardan değiştirme henüz yok).
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
                            c.verificationStatus === "onaylandi"
                              ? "chip-ok"
                              : c.verificationStatus === "reddedildi" || c.verificationStatus === "iptal-edildi"
                                ? "chip-danger"
                                : "chip-warn"
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
                    {c.verificationStatus === "iptal-edildi" && c.revocationNote && (
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--color-danger, #b23f26)", marginTop: 6 }}>
                        <strong>İptal gerekçesi:</strong> {c.revocationNote}
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

      {/* --- Onaylı sertifikaları incele / şüpheli olarak iptal et (FR-183) --- */}
      {session && can(session.role, "compliance.review") && (
        <section className="section">
          <div className="container-x">
            <NumberedHeading n="00" eyebrow="Sahte/şüpheli sertifika incelemesi (FR-183)" title="Onaylı sertifikaları geriye dönük iptal et" />
            <p style={{ color: "var(--text-mid)", maxWidth: 640, marginBottom: 20 }}>
              Daha önce onaylanmış bir sertifikanın sahte/şüpheli olduğu sonradan ortaya
              çıkabilir. İptal, bu sertifikaya dayanan GELECEKTEKİ her organik-iddia
              kontrolünü otomatik reddeder — hâlihazırda yayınlanmış ilanlar geriye dönük
              değişmez. Kendi işletmenin sertifikaları burada da görünmez.
            </p>
            {revocableCertificates.length === 0 ? (
              <p style={{ color: "var(--text-low)" }}>İptal edilebilir onaylı sertifika yok.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, maxWidth: 720 }}>
                {revocableCertificates.map((c) => (
                  <div key={c.id} className="card" style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <strong style={{ fontSize: "var(--fs-sm)" }}>{c.holder} · {c.issuer} — {JURISDICTION_LABELS[c.jurisdiction]}</strong>
                      <span className="chip chip-ok"><ShieldCheck size={11} /> Doğrulandı</span>
                    </div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 6 }}>
                      Kapsam: {c.scopeCropIds.join(", ")} · Geçerlilik: {c.validFrom} – {c.validTo}
                      {c.verifiedAt && ` · Onay: ${c.verifiedAt.slice(0, 10)}`}
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="text"
                        placeholder="İptal gerekçesi (zorunlu)"
                        value={revokeNoteDraft[c.id] ?? ""}
                        onChange={(e) => setRevokeNoteDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                        style={{ flex: 1, minWidth: 220, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-soft)" }}
                      />
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: "var(--color-danger, #b23f26)", borderColor: "var(--color-danger, #b23f26)" }}
                        disabled={revokePending}
                        onClick={() => handleCertRevoke(c.id)}
                      >
                        <X size={13} /> Şüpheli — iptal et
                      </button>
                      {revokeMsg[c.id] && <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{revokeMsg[c.id]}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---------- ÜCRET SİMÜLATÖRLERİ (araç — vitrin/vitrinimden sonra, demote edildi) ---------- */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading n="00" eyebrow="Satmadan önce gör" title="Ücret simülatörleri" />
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

      <style>{`
        /* "Hasat Pazarı" — ADR-009 + docs/design/hasat-pazari-gorsel-yon.html referans
           önizlemesiyle BİREBİR: altın→krem→orman yeşili degrade hero, toprak/terracotta vurgu,
           kategoriye-özel renkli rozetler (Explorer.tsx CATEGORY_META ile aynı palet), gerçek
           ürün fotoğrafları. Yalnız bu bant/kart setine scoped — global token'lar değişmedi. */
        .market-hero-band {
          padding: 40px 0 0;
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

        /* --- ana ürün grid'i (gerçek, tıklanabilir ilanlar) --- */
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
        .market-shop-photo-link { display: block; color: inherit; text-decoration: none; }
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
        .market-shop-body { padding: 14px 16px 16px; display: flex; flex-direction: column; flex: 1; }
        .market-shop-title-link { display: block; color: inherit; text-decoration: none; }
        .market-shop-producer { font-size: 11px; color: var(--color-ink-500, var(--text-low)); margin-bottom: 6px; }
        .market-shop-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; transition: color var(--dur-fast, 150ms) ease; }
        .market-shop-title-link:hover .market-shop-title { color: #A1502E; }
        .market-shop-price-row { display: flex; align-items: baseline; gap: 8px; }
        .market-shop-price { font-family: var(--font-mono); font-size: 19px; font-weight: 700; color: #7c3b21; }
        .dark .market-shop-price { color: var(--color-gold-300, #A1502E); }
        .market-shop-unit { font-size: 11px; color: var(--color-ink-500, var(--text-low)); }
        .market-shop-spec { font-size: 11px; color: var(--color-ink-500, var(--text-low)); margin-top: 10px; }
        .market-shop-actions { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-hair); }

        @media (max-width: 800px) { #vitrinim-grid { grid-template-columns: 1fr !important; } }

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
        }
      `}</style>
    </>
  );
}
