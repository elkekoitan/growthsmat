"use client";
// SmartGrowth OS — /pazar/[id] ürün detay sayfasının satın-alma eylem alanı.
// Sepet ve sipariş; CartProvider context'i + Server Action gerektirir, bu yüzden bu küçük
// client bileşeni tek bir ilan için useCart()/placeOrderAction'ı sarar. Market.tsx'in gerçek
// ilan kartındaki add-to-cart + sipariş mantığının BİREBİR aynısıdır (tek ilana uyarlanmış).
// CartProvider + CartDrawer burada da sarılır, böylece detay sayfasından da sepet tamamlanabilir
// (aynı localStorage anahtarı — /pazar ile paylaşılır).
import { useState, useTransition } from "react";
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

  function handlePlaceOrder() {
    startOrderTransition(async () => {
      const res = await placeOrderAction(listing.id, qty);
      setMsg(res.error ?? res.success ?? "");
    });
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
    return <span className="chip chip-danger" style={{ width: "fit-content" }}>Stok tükendi</span>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="number"
          min={1}
          max={listing.stockQty}
          value={qty}
          onChange={(e) => setQty(Math.min(listing.stockQty, Math.max(1, Number(e.target.value) || 1)))}
          style={{ width: 72, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border-soft)" }}
          aria-label="Miktar"
        />
        <button className="btn btn-primary" disabled={orderPending} onClick={handlePlaceOrder}>
          Sipariş ver
        </button>
        <button
          className="btn btn-secondary"
          onClick={() =>
            addItem(
              { listingId: listing.id, title: listing.title, priceTRY: listing.priceTRY, unitLabel: listing.unitLabel, maxQty: listing.stockQty },
              qty
            )
          }
        >
          <Check size={15} /> Sepete ekle
        </button>
      </div>
      {msg && <p style={{ fontSize: "var(--fs-sm)", marginTop: 10, color: "var(--text-mid)" }}>{msg}</p>}
      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 10 }}>
        Ödeme tahsilatı henüz entegre değil — sipariş, alıcı ve üretici arasında kalıcı bir talep
        kaydı oluşturur.
      </p>
    </div>
  );
}
