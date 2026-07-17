"use client";
// SmartGrowth OS — Hasat Pazarı sepet çekmecesi v2.
// "Sepete ekle"de otomatik açılır (CartContext.lastAddSignal), satırlar thumb + stepper +
// satır fiyatı taşır, sticky footer'da ara toplam + terracotta "Siparişi tamamla" + dürüst
// mikrokopy vardır. Başarıda 3 adımlı zaman çizelgeli onay paneli gösterilir.
// Kısmi hata mantığı (başarılı kalemler sepetten düşer, başarısızlar amber işaretle kalır)
// placeCartOrdersAction.failedListingIds üzerinden korunur.
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "./CartContext";
import { placeCartOrdersAction } from "./actions";
import { Package, X, Check } from "@/components/icons";
import { PAYMENT_METHODS, ONLINE_PAYMENT_NOTE, type PaymentMethod } from "@/lib/payment";

interface ConfirmedOrder {
  items: CartItem[];
  totalTRY: number;
}

export function CartDrawer() {
  const { items, removeItem, setQty, clear, totalTRY, lastAddSignal } = useCart();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState<ConfirmedOrder | null>(null);
  // Ödeme yöntemi sepet GENELİDİR (tek checkout = tek yöntem). Varsayılan "kapida" —
  // Türkiye yerel organik satışının baskın modu. Online seçenek YOK (ağ geçidi entegre değil).
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("kapida");
  const prevSignal = useRef(0);

  // "Sepete ekle"de çekmece otomatik açılır (yalnız yeni bir ekleme sinyalinde).
  useEffect(() => {
    if (lastAddSignal > prevSignal.current) {
      prevSignal.current = lastAddSignal;
      setOpen(true);
      setConfirmed(null);
    }
  }, [lastAddSignal]);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  function handleCheckout() {
    setMsg(null);
    setFailedIds(new Set());
    // Onay paneli için anlık görüntü — clear() sonrası kalem özeti gösterilebilsin.
    const snapshotItems = items.map((i) => ({ ...i }));
    const snapshotTotal = totalTRY;
    startTransition(async () => {
      const res = await placeCartOrdersAction(items.map((i) => ({ listingId: i.listingId, quantity: i.qty })), paymentMethod);
      if (res.error) {
        setMsg(res.error);
        if (res.failedListingIds) {
          // Yalnız başarısız kalemler sepette bırakılır — başarılı olanlar gerçek sipariş
          // olarak kaydedildi, sepette tekrar göstermek yanıltıcı olurdu.
          const failedSet = new Set(res.failedListingIds);
          setFailedIds(failedSet);
          items.filter((i) => !failedSet.has(i.listingId)).forEach((i) => removeItem(i.listingId));
        }
      } else {
        setConfirmed({ items: snapshotItems, totalTRY: snapshotTotal });
        clear();
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setConfirmed(null);
  }

  if (count === 0 && !open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary cart-fab"
        onClick={() => (open ? handleClose() : setOpen(true))}
        aria-label="Sepeti aç/kapat"
      >
        <Package size={18} /> Sepetim {count > 0 && <span className="cart-fab-count">{count}</span>}
      </button>

      {open && (
        <div className="cart-drawer card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontWeight: 600 }}>Sepetim</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose} aria-label="Kapat">
              <X size={16} />
            </button>
          </div>

          {confirmed ? (
            /* --- Onay paneli: check → başlık → kalem özeti → 3 adımlı zaman çizelgesi --- */
            <div style={{ textAlign: "center" }}>
              <div className="cart-confirm-check" aria-hidden>
                <Check size={22} />
              </div>
              <p className="cart-confirm-title">Siparişiniz kaydedildi</p>
              <div className="cart-confirm-items">
                {confirmed.items.map((i) => (
                  <div key={i.listingId} className="cart-confirm-item">
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.qty}× {i.title}
                    </span>
                    <span className="font-mono">{(i.qty * i.priceTRY).toLocaleString("tr-TR")} ₺</span>
                  </div>
                ))}
                <div className="cart-confirm-item" style={{ fontWeight: 700, borderTop: "1px solid var(--border-hair)", paddingTop: 6 }}>
                  <span>Toplam</span>
                  <span className="font-mono">{confirmed.totalTRY.toLocaleString("tr-TR")} ₺</span>
                </div>
              </div>
              <div className="cart-timeline" aria-label="Sipariş adımları">
                <span className="cart-timeline-step is-done">
                  <span className="cart-timeline-dot" /> Kayıt alındı
                </span>
                <span className="cart-timeline-sep" aria-hidden />
                <span className="cart-timeline-step">
                  <span className="cart-timeline-dot" /> Üretici onayı
                </span>
                <span className="cart-timeline-sep" aria-hidden />
                <span className="cart-timeline-step">
                  <span className="cart-timeline-dot" /> Teslimat
                </span>
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", margin: "10px 0 12px" }}>
                Bu bir talep kaydıdır; üretici sizinle iletişime geçecek.
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
                Alışverişe devam
              </button>
            </div>
          ) : items.length === 0 ? (
            /* --- Boş durum: Fraunces başlık + harvest-box illüstrasyonu --- */
            <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/harvest-box.svg" alt="" width={64} height={64} style={{ opacity: 0.9 }} />
              <p className="cart-empty-title">Sepetiniz boş</p>
              <Link href="/pazar" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
                Pazara dön
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                {items.map((i) => (
                  <div key={i.listingId} className="cart-row">
                    <div className="cart-thumb" aria-hidden>
                      {i.photoPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={i.photoPath} alt="" />
                      ) : (
                        <Package size={16} style={{ color: "var(--text-low)" }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "var(--fs-sm)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.title}</p>
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                        {i.priceTRY.toLocaleString("tr-TR")} ₺ · {i.unitLabel}
                      </p>
                      <div className="cart-row-bottom">
                        <div className="cart-stepper" role="group" aria-label={`${i.title} adedi`}>
                          <button
                            type="button"
                            className="cart-step-btn"
                            aria-label="Azalt"
                            onClick={() => (i.qty <= 1 ? removeItem(i.listingId) : setQty(i.listingId, i.qty - 1))}
                          >
                            −
                          </button>
                          <span className="cart-step-qty font-mono">{i.qty}</span>
                          <button
                            type="button"
                            className="cart-step-btn"
                            aria-label="Artır"
                            disabled={i.qty >= i.maxQty}
                            title={`Stok: ${i.maxQty}`}
                            onClick={() => setQty(i.listingId, i.qty + 1)}
                          >
                            +
                          </button>
                        </div>
                        {i.qty >= i.maxQty && <span className="cart-stock-hint">Stok: {i.maxQty}</span>}
                        <span className="cart-line-price font-mono">{(i.qty * i.priceTRY).toLocaleString("tr-TR")} ₺</span>
                      </div>
                      {failedIds.has(i.listingId) && (
                        <p className="cart-row-error">Bu kalem işlenemedi — stok azalmış ya da ilan değişmiş olabilir.</p>
                      )}
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "4px 6px", alignSelf: "flex-start" }} onClick={() => removeItem(i.listingId)} aria-label={`${i.title} kaldır`}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* --- sticky footer: ara toplam → ödeme yöntemi → CTA → dürüst şerit --- */}
              <div className="cart-footer">
                <div className="cart-subtotal">
                  <span>Ara toplam</span>
                  <span className="font-mono">{totalTRY.toLocaleString("tr-TR")} ₺</span>
                </div>
                {/* Ödeme yöntemi (sepet geneli). Yalnız kapıda + havale — online ağ geçidi entegre
                    değil, öyleymiş gibi bir seçenek göstermek dürüst olmaz. */}
                <fieldset className="cart-pay-group">
                  <legend className="cart-pay-legend">Ödeme yöntemi</legend>
                  {PAYMENT_METHODS.map((m) => (
                    <label key={m.value} className={`cart-pay-option${paymentMethod === m.value ? " is-on" : ""}`}>
                      <input
                        type="radio"
                        name="cart-payment-method"
                        value={m.value}
                        checked={paymentMethod === m.value}
                        onChange={() => setPaymentMethod(m.value)}
                      />
                      <span>{m.label}</span>
                    </label>
                  ))}
                </fieldset>
                <button type="button" className="cart-checkout-cta" disabled={pending} onClick={handleCheckout}>
                  {pending ? "Gönderiliyor…" : "Siparişi tamamla"}
                </button>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 8, textAlign: "center" }}>
                  Online tahsilat yok — sipariş kaydı oluşturulur, ödemeyi üretici {paymentMethod === "havale" ? "havale/EFT" : "kapıda"} alır.
                </p>
                <p className="cart-pay-honest">{ONLINE_PAYMENT_NOTE}</p>
              </div>
            </>
          )}

          {msg && !confirmed && <p style={{ marginTop: 10, fontSize: "var(--fs-xs)", color: "#8a5a00" }}>{msg}</p>}
        </div>
      )}

      <style>{`
        .cart-fab {
          position: fixed; bottom: 20px; right: 20px; z-index: 60;
          box-shadow: var(--shadow-lg); border-radius: 999px;
        }
        .cart-fab-count {
          background: rgba(255,255,255,0.25); border-radius: 999px; padding: 0 7px; margin-left: 4px; font-size: var(--fs-xs);
        }
        .cart-drawer {
          position: fixed; bottom: 76px; right: 20px; z-index: 60;
          width: min(360px, calc(100vw - 40px)); padding: 16px;
          box-shadow: var(--shadow-lg);
        }

        .cart-row { display: flex; gap: 10px; border-bottom: 1px solid var(--border-hair); padding-bottom: 10px; }
        .cart-thumb {
          width: 44px; height: 44px; border-radius: 8px; overflow: hidden; flex-shrink: 0;
          background: var(--color-paper-200, var(--bg-surface-2)); display: grid; place-items: center;
        }
        .cart-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .cart-row-bottom { display: flex; align-items: center; gap: 8px; margin-top: 6px; flex-wrap: wrap; }
        .cart-stepper {
          display: inline-flex; align-items: center;
          border: 1px solid var(--border-soft); border-radius: 8px; overflow: hidden;
        }
        .cart-step-btn {
          width: 32px; height: 32px; border: none; background: transparent; cursor: pointer;
          font-size: 15px; line-height: 1; color: #A1502E; font-weight: 600;
          position: relative;
        }
        /* Görsel kompakt kalır ama dokunma alanı ~44px'e genişletilir (a11y touch target). */
        .cart-step-btn::after { content: ""; position: absolute; inset: -6px; }
        .cart-step-btn:hover:not(:disabled) { background: color-mix(in srgb, #A1502E 10%, transparent); }
        .cart-step-btn:disabled { color: var(--text-low); cursor: not-allowed; }
        .cart-step-qty { width: 28px; text-align: center; font-size: 13px; font-weight: 600; }
        .cart-stock-hint { font-size: 10px; color: var(--text-low); }
        .cart-line-price { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--text-hi); }
        .cart-row-error {
          margin-top: 6px; font-size: var(--fs-xs); color: #8a5a00;
          background: color-mix(in srgb, var(--color-warning, #e8a33d) 14%, transparent);
          border-left: 2px solid var(--color-warning, #e8a33d);
          padding: 4px 8px; border-radius: 0 6px 6px 0;
        }

        .cart-footer { margin-top: 12px; border-top: 1px solid var(--border-hair); padding-top: 10px; }
        .cart-pay-group { border: none; margin: 0 0 10px; padding: 0; display: grid; gap: 6px; }
        .cart-pay-legend {
          font-size: var(--fs-xs); font-weight: 600; color: var(--text-mid);
          padding: 0; margin-bottom: 2px;
        }
        .cart-pay-option {
          display: flex; align-items: center; gap: 8px; cursor: pointer;
          border: 1px solid var(--border-soft); border-radius: var(--radius-control, 10px);
          padding: 8px 10px; font-size: var(--fs-sm); color: var(--text-mid);
          transition: border-color var(--dur-fast, 150ms) ease, background var(--dur-fast, 150ms) ease;
        }
        .cart-pay-option.is-on {
          border-color: #A1502E; color: var(--text-hi);
          background: color-mix(in srgb, #A1502E 8%, transparent);
        }
        .cart-pay-option input { accent-color: #A1502E; margin: 0; }
        .cart-pay-honest {
          font-size: var(--fs-xs); color: var(--text-low); margin-top: 6px; text-align: center;
        }
        .cart-subtotal { display: flex; justify-content: space-between; align-items: baseline; font-weight: 600; margin-bottom: 10px; }
        .cart-subtotal .font-mono { font-size: 17px; font-weight: 700; text-align: right; }
        .cart-checkout-cta {
          width: 100%; min-height: 44px; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          border-radius: var(--radius-control, 10px);
          background: #A1502E; color: #fff; font-weight: 700; font-size: var(--fs-sm);
          transition: background var(--dur-fast, 150ms) ease;
        }
        .cart-checkout-cta:hover:not(:disabled) { background: #91462a; }
        .cart-checkout-cta:disabled { background: color-mix(in srgb, #A1502E 60%, var(--border-soft)); cursor: not-allowed; }

        .cart-empty-title { font-family: var(--font-display); font-size: var(--fs-lg); margin: 10px 0 10px; }

        .cart-confirm-check {
          width: 44px; height: 44px; border-radius: 999px; margin: 4px auto 10px;
          background: #A1502E; color: #fff; display: grid; place-items: center;
        }
        .cart-confirm-title { font-family: var(--font-display); font-size: var(--fs-lg); margin-bottom: 10px; }
        .cart-confirm-items { display: grid; gap: 4px; text-align: left; margin-bottom: 12px; }
        .cart-confirm-item { display: flex; justify-content: space-between; gap: 10px; font-size: var(--fs-xs); color: var(--text-mid); }
        .cart-timeline { display: flex; align-items: center; justify-content: center; gap: 6px; }
        .cart-timeline-step {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--text-low); white-space: nowrap;
        }
        .cart-timeline-step.is-done { color: #A1502E; }
        .cart-timeline-dot {
          width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0;
          border: 1.5px solid currentColor; background: transparent;
        }
        .cart-timeline-step.is-done .cart-timeline-dot { background: #A1502E; border-color: #A1502E; }
        .cart-timeline-sep { width: 14px; height: 1px; background: var(--border-soft); flex-shrink: 0; }
      `}</style>
    </>
  );
}
