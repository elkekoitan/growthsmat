"use client";

import { useState, useTransition } from "react";
import { useCart } from "./CartContext";
import { placeCartOrdersAction } from "./actions";
import { Package, X, Check } from "@/components/icons";

export function CartDrawer() {
  const { items, removeItem, setQty, clear, totalTRY } = useCart();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const count = items.reduce((sum, i) => sum + i.qty, 0);

  function handleCheckout() {
    setMsg(null);
    startTransition(async () => {
      const res = await placeCartOrdersAction(items.map((i) => ({ listingId: i.listingId, quantity: i.qty })));
      if (res.error) {
        setMsg(res.error);
        if (res.failedListingIds) {
          // Yalnız başarısız kalemler sepette bırakılır — başarılı olanlar gerçek sipariş
          // olarak kaydedildi, sepette tekrar göstermek yanıltıcı olurdu.
          const failedSet = new Set(res.failedListingIds);
          items.filter((i) => !failedSet.has(i.listingId)).forEach((i) => removeItem(i.listingId));
        }
      } else {
        setMsg(res.success ?? "Sipariş gönderildi.");
        clear();
      }
    });
  }

  if (count === 0 && !open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-primary cart-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Sepeti aç/kapat"
      >
        <Package size={18} /> Sepetim {count > 0 && <span className="cart-fab-count">{count}</span>}
      </button>

      {open && (
        <div className="cart-drawer card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <p style={{ fontWeight: 600 }}>Sepetim</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)} aria-label="Kapat">
              <X size={16} />
            </button>
          </div>

          {items.length === 0 ? (
            <p style={{ color: "var(--text-low)", fontSize: "var(--fs-sm)" }}>Sepetin boş — bir ilanda &quot;Sepete ekle&quot;ye tıkla.</p>
          ) : (
            <>
              <div style={{ display: "grid", gap: 10, maxHeight: 320, overflowY: "auto" }}>
                {items.map((i) => (
                  <div key={i.listingId} style={{ display: "flex", gap: 8, alignItems: "center", borderBottom: "1px solid var(--border-hair)", paddingBottom: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "var(--fs-sm)", fontWeight: 500 }}>{i.title}</p>
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>{i.priceTRY.toLocaleString("tr-TR")} ₺ · {i.unitLabel}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={i.maxQty}
                      value={i.qty}
                      onChange={(e) => setQty(i.listingId, Number(e.target.value) || 1)}
                      style={{ width: 48, padding: "4px 6px", borderRadius: 6, border: "1px solid var(--border-soft)" }}
                      aria-label={`${i.title} miktarı`}
                    />
                    <button type="button" className="btn btn-ghost btn-sm" style={{ padding: "4px 6px" }} onClick={() => removeItem(i.listingId)} aria-label="Kaldır">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontWeight: 600 }}>
                <span>Toplam</span>
                <span className="font-mono">{totalTRY.toLocaleString("tr-TR")} ₺</span>
              </div>

              <button type="button" className="btn btn-primary" style={{ width: "100%", marginTop: 12 }} disabled={pending} onClick={handleCheckout}>
                {pending ? "Gönderiliyor…" : <><Check size={15} /> Siparişi tamamla</>}
              </button>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 8 }}>
                Bu, her üretici için ayrı bir gerçek sipariş talebi oluşturur — ödeme tahsilatı henüz entegre değil.
              </p>
            </>
          )}

          {msg && <p style={{ marginTop: 10, fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{msg}</p>}
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
          width: min(340px, calc(100vw - 40px)); padding: 16px;
          box-shadow: var(--shadow-lg);
        }
      `}</style>
    </>
  );
}
