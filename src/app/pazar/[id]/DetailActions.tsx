"use client";
// SmartGrowth OS — /pazar/[id] ürün detay sayfasının satın-alma eylem alanı (buy-box v2).
// Sepet ve sipariş; CartProvider context'i + Server Action gerektirir, bu yüzden bu küçük
// client bileşeni tek bir ilan için useCart()/placeOrderAction'ı sarar. CartProvider +
// CartDrawer burada da sarılır, böylece detay sayfasından da sepet tamamlanabilir
// (aynı localStorage anahtarı — /pazar ile paylaşılır).
// v2 (Hasat Pazarı tasarım yükseltmesi): erişilebilir adet stepper'ı (≥44×44 butonlar,
// ortada düzenlenebilir sayı), anında güncellenen toplam, terracotta birincil CTA ve
// buy-box viewport dışına çıkınca beliren 56px mobil sticky bar (IntersectionObserver).
import { useEffect, useRef, useState, useTransition } from "react";
import { placeOrderAction } from "../actions";
import { CartProvider, useCart } from "../CartContext";
import { CartDrawer } from "../CartDrawer";
import { Check } from "@/components/icons";

export interface DetailListing {
  id: string;
  title: string;
  priceTRY: number;
  unitLabel: string;
  stockQty: number;
  photoPath?: string;
}

export function DetailActions({ listing, isOwn }: { listing: DetailListing; isOwn: boolean }) {
  return (
    <CartProvider>
      <DetailActionsInner listing={listing} isOwn={isOwn} />
      <CartDrawer />
    </CartProvider>
  );
}

function DetailActionsInner({ listing, isOwn }: { listing: DetailListing; isOwn: boolean }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [orderPending, startOrderTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [stickyOn, setStickyOn] = useState(false);

  // Buy-box viewport dışına çıkınca mobil sticky bar görünür (yalnız CSS ile <860px'te).
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setStickyOn(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handlePlaceOrder() {
    startOrderTransition(async () => {
      const res = await placeOrderAction(listing.id, qty);
      setMsg(res.error ?? res.success ?? "");
    });
  }

  function handleAddToCart() {
    addItem(
      {
        listingId: listing.id,
        title: listing.title,
        priceTRY: listing.priceTRY,
        unitLabel: listing.unitLabel,
        maxQty: listing.stockQty,
        photoPath: listing.photoPath,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  if (isOwn) {
    return (
      <div>
        <span className="chip chip-info" style={{ width: "fit-content" }}>Senin ilanın</span>
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 8 }}>
          Kendi ilanına sipariş veremezsin — sipariş yönetimi /pazar sayfasındaki
          &quot;Vitrinim&quot; bölümünde.
        </p>
      </div>
    );
  }

  if (listing.stockQty <= 0) {
    // Stok yoksa sayfa tam render edilir; CTA yerine çip + açıklama (hayalet buton değil).
    return (
      <div>
        <span className="chip chip-danger" style={{ width: "fit-content" }}>Stokta yok</span>
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)", marginTop: 8, maxWidth: 420 }}>
          Bu ürünün stoğu şu an tükenmiş. Üretici stok girdiğinde ilan yeniden sipariş
          alabilir — ilan görünür kalır, gerçek stok adedi canlı gösterilir.
        </p>
      </div>
    );
  }

  const totalTRY = qty * listing.priceTRY;

  return (
    <>
      <div ref={rootRef} style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div className="da-stepper" role="group" aria-label="Sipariş adedi">
            <button
              type="button"
              className="da-step-btn"
              aria-label="Adedi azalt"
              disabled={qty <= 1}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={listing.stockQty}
              value={qty}
              onChange={(e) => setQty(Math.min(listing.stockQty, Math.max(1, Number(e.target.value) || 1)))}
              className="da-step-input font-mono"
              aria-label="Adet"
            />
            <button
              type="button"
              className="da-step-btn"
              aria-label="Adedi artır"
              disabled={qty >= listing.stockQty}
              title={qty >= listing.stockQty ? `Stok: ${listing.stockQty}` : undefined}
              onClick={() => setQty((q) => Math.min(listing.stockQty, q + 1))}
            >
              +
            </button>
          </div>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
            Toplam{" "}
            <span className="font-mono" style={{ fontWeight: 700, color: "var(--text-hi)" }}>
              {totalTRY.toLocaleString("tr-TR")} ₺
            </span>
          </div>
        </div>

        <button type="button" className="market-cta da-order-cta" disabled={orderPending} onClick={handlePlaceOrder}>
          {orderPending ? "Gönderiliyor…" : "Sipariş ver"}
        </button>
        <button type="button" className={`btn btn-secondary${added ? " da-added" : ""}`} style={{ width: "100%" }} onClick={handleAddToCart}>
          {added ? (
            <>
              <Check size={15} /> Sepete eklendi ✓
            </>
          ) : (
            "Sepete ekle"
          )}
        </button>

        {msg && <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", margin: 0 }}>{msg}</p>}
        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", margin: 0 }}>
          Sipariş bir talep kaydıdır — ödeme entegrasyonu yok, teslimat üreticiyle koordine edilir.
        </p>
      </div>

      {/* --- Mobil sticky bar: buy-box görünür alandan çıkınca 56px krem bant --- */}
      <div className={`da-sticky${stickyOn ? " is-on" : ""}`} aria-hidden={!stickyOn}>
        {listing.photoPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photoPath} alt="" className="da-sticky-thumb" />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="da-sticky-title">{listing.title}</div>
          <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: "#A1502E" }}>
            {listing.priceTRY.toLocaleString("tr-TR")} ₺ <span style={{ fontWeight: 400, color: "var(--text-low)" }}>· {listing.unitLabel}</span>
          </div>
        </div>
        <button type="button" className="market-cta da-sticky-cta" onClick={handleAddToCart} tabIndex={stickyOn ? 0 : -1}>
          {added ? "Eklendi ✓" : "Sepete ekle"}
        </button>
      </div>

      <style>{`
        .da-stepper {
          display: inline-flex; align-items: stretch;
          border: 1.5px solid color-mix(in srgb, #A1502E 25%, var(--border-soft));
          border-radius: var(--radius-control, 10px); overflow: hidden; background: var(--bg-surface, #fff);
        }
        .da-step-btn {
          width: 44px; min-height: 44px; border: none; background: transparent; cursor: pointer;
          font-size: 20px; line-height: 1; color: #A1502E; font-weight: 600;
          transition: background var(--dur-fast, 150ms) ease;
        }
        .da-step-btn:hover:not(:disabled) { background: color-mix(in srgb, #A1502E 10%, transparent); }
        .da-step-btn:disabled { color: var(--text-low); cursor: not-allowed; }
        .da-step-input {
          width: 56px; text-align: center; border: none; font-size: 16px; font-weight: 600;
          color: var(--text-hi); background: transparent; -moz-appearance: textfield; appearance: textfield;
        }
        .da-step-input::-webkit-outer-spin-button, .da-step-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .da-step-input:focus-visible { outline: 2px solid var(--ring, #A1502E); outline-offset: -2px; }

        /* DİKKAT: .market-cta'nın ikizi ../Market.tsx'te de tanımlı (iki sayfa hiç birlikte
           render olmaz). Buradaki bir değişikliği orada da yansıt. */
        .market-cta {
          width: 100%; min-height: 44px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: var(--radius-control, 10px);
          background: #A1502E; color: #fff; font-weight: 700; font-size: var(--fs-sm);
          transition: background var(--dur-fast, 150ms) ease;
        }
        .market-cta:hover:not(:disabled) { background: #91462a; }
        .market-cta:disabled { background: color-mix(in srgb, #A1502E 60%, var(--border-soft)); cursor: not-allowed; }
        .da-order-cta { min-height: 48px; font-size: var(--fs-base); }
        .da-added { border-color: #A1502E !important; color: #7c3b21 !important; }

        .da-sticky {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 55;
          height: 56px; display: none; align-items: center; gap: 10px; padding: 0 14px;
          background: #F9F8F3; border-top: 1px solid color-mix(in srgb, #A1502E 25%, var(--border-soft));
          transform: translateY(100%); transition: transform 250ms var(--ease-out, ease);
        }
        .dark .da-sticky { background: var(--bg-surface); }
        .da-sticky.is-on { transform: translateY(0); }
        .da-sticky-thumb { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .da-sticky-title {
          font-family: var(--font-display); font-size: 13px; font-weight: 600;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .da-sticky-cta { width: auto; min-height: 40px; padding: 0 16px; flex-shrink: 0; }
        @media (max-width: 860px) {
          .da-sticky { display: flex; }
        }
        @media (prefers-reduced-motion: reduce) {
          .da-sticky { transition: none; }
        }
      `}</style>
    </>
  );
}
