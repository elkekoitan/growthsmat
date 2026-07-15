"use client";
// SmartGrowth OS — /pazar sepet durumu. Yalnız TARAYICIDA (localStorage) tutulur — bu bir
// gerçek iş kaydı DEĞİLDİR, ödeme öncesi geçici bir seçim listesidir (gerçek e-ticaret
// sitelerindeki standart "checkout öncesi sepet" deseniyle aynı). Kalıcı, gerçek kayıt
// yalnız "Siparişi tamamla" tıklanınca placeCartOrdersAction() ile Postgres'e yazılır.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  listingId: string;
  title: string;
  priceTRY: number;
  unitLabel: string;
  maxQty: number;
  qty: number;
  /** Küçük sepet thumb'ı için — yoksa satır ikonla gösterilir (eski localStorage kayıtları da alansızdır). */
  photoPath?: string;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty">, qty: number) => void;
  removeItem: (listingId: string) => void;
  setQty: (listingId: string, qty: number) => void;
  clear: () => void;
  totalTRY: number;
  /** Her addItem çağrısında artar — CartDrawer bunu dinleyip kendini otomatik açar. */
  lastAddSignal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "sg-pazar-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [lastAddSignal, setLastAddSignal] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage yalnız mount'ta, tek seferlik okunur (Nav.tsx'teki aynı desen)
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // bozuk veri sessizce göz ardı edilir — sepet boş başlar
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, "qty">, qty: number) {
    setItems((prev) => {
      const existing = prev.find((i) => i.listingId === item.listingId);
      if (existing) {
        const nextQty = Math.min(item.maxQty, existing.qty + qty);
        return prev.map((i) => (i.listingId === item.listingId ? { ...i, qty: nextQty, maxQty: item.maxQty, photoPath: item.photoPath ?? i.photoPath } : i));
      }
      return [...prev, { ...item, qty: Math.max(1, Math.min(item.maxQty, qty)) }];
    });
    setLastAddSignal((n) => n + 1);
  }
  function removeItem(listingId: string) {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }
  function setQty(listingId: string, qty: number) {
    setItems((prev) => prev.map((i) => (i.listingId === listingId ? { ...i, qty: Math.max(1, Math.min(i.maxQty, qty)) } : i)));
  }
  function clear() {
    setItems([]);
  }

  const totalTRY = items.reduce((sum, i) => sum + i.priceTRY * i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, setQty, clear, totalTRY, lastAddSignal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart, CartProvider içinde kullanılmalı.");
  return ctx;
}
