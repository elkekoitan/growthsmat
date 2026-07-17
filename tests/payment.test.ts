// Ödeme yöntemi / tahsilat durumu — SAF katman testleri.
// DÜRÜSTLÜK SÖZLEŞMESİ: online kart ödemesi (ağ geçidi) HENÜZ YOK. Alıcı yalnız kapıda
// ödeme veya havale/EFT seçebilir; "online"/çöp girişler reddedilir. Bu testler o sözleşmeyi
// deterministik olarak kilitler (bkz. src/lib/payment.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  isSelectablePaymentMethod,
  evaluateMarkOrderPaid,
  ONLINE_PAYMENT_NOTE,
} from "../src/lib/payment.ts";

// markOrderPaid yetki kapısı fixture'ları — satıcı workspace'i, onaylı+ödenmemiş sipariş.
const SELLER_WS = "ws-satici";
const OK_ORDER = { sellerWorkspaceId: SELLER_WS, orderStatus: "onaylandi", paymentStatus: "bekliyor" as const };
const SELLER = { workspaceId: SELLER_WS, canManageCommerce: true };

test("ÖDEME: isSelectablePaymentMethod kapıda ve havaleyi kabul eder", () => {
  assert.equal(isSelectablePaymentMethod("kapida"), true);
  assert.equal(isSelectablePaymentMethod("havale"), true);
});

test("ÖDEME: isSelectablePaymentMethod 'belirtilmedi'yi reddeder (yalnız varsayılan durum, seçilebilir değil)", () => {
  assert.equal(isSelectablePaymentMethod("belirtilmedi"), false);
});

test("ÖDEME: isSelectablePaymentMethod 'online'ı reddeder (ağ geçidi entegre değil)", () => {
  // Online seçenek dürüstçe YOK — bir alıcı "online" göndermeyi denerse kabul edilmemeli.
  assert.equal(isSelectablePaymentMethod("online"), false);
});

test("ÖDEME: isSelectablePaymentMethod boş string ve çöp girişleri reddeder", () => {
  assert.equal(isSelectablePaymentMethod(""), false);
  assert.equal(isSelectablePaymentMethod("KAPIDA"), false); // büyük harf eşleşmez
  assert.equal(isSelectablePaymentMethod(" kapida "), false); // trim'siz eşleşmez
  assert.equal(isSelectablePaymentMethod("nakit"), false);
  assert.equal(isSelectablePaymentMethod(null), false);
  assert.equal(isSelectablePaymentMethod(undefined), false);
  assert.equal(isSelectablePaymentMethod(42), false);
  assert.equal(isSelectablePaymentMethod({ value: "kapida" }), false);
});

test("ÖDEME: PAYMENT_METHODS yalnız iki seçenek içerir (kapıda + havale) — belirtilmedi/online YOK", () => {
  assert.equal(PAYMENT_METHODS.length, 2);
  const values = PAYMENT_METHODS.map((m) => m.value);
  assert.deepEqual(values, ["kapida", "havale"]);
  assert.ok(!values.includes("belirtilmedi" as never), "belirtilmedi seçilebilir bir seçenek olmamalı");
});

test("ÖDEME: PAYMENT_METHODS hiçbir online/kart-ağ-geçidi seçeneği içermez", () => {
  for (const m of PAYMENT_METHODS) {
    const v = trLowerAscii(m.value);
    const l = trLowerAscii(m.label);
    assert.ok(!v.includes("online") && !l.includes("online"), `online seçenek sızmış: ${m.value}`);
    assert.ok(!v.includes("stripe") && !v.includes("iyzico"), `ağ geçidi seçeneği sızmış: ${m.value}`);
  }
});

test("ÖDEME: her seçilebilir yöntemin etiketi dolu ve isSelectable'dan geçer", () => {
  for (const m of PAYMENT_METHODS) {
    assert.ok(m.label.length > 0, `${m.value} etiketi boş`);
    assert.equal(isSelectablePaymentMethod(m.value), true);
  }
});

test("ÖDEME: PAYMENT_METHOD_LABELS üç yöntem için de okunur Türkçe etiket verir", () => {
  assert.equal(PAYMENT_METHOD_LABELS.belirtilmedi, "Belirtilmedi");
  assert.ok(PAYMENT_METHOD_LABELS.kapida.length > 0);
  assert.ok(PAYMENT_METHOD_LABELS.havale.length > 0);
});

test("ÖDEME: PAYMENT_STATUS_LABELS bekliyor/odendi için dolu etiket verir", () => {
  assert.equal(PAYMENT_STATUS_LABELS.bekliyor, "Ödeme bekliyor");
  assert.equal(PAYMENT_STATUS_LABELS.odendi, "Ödendi");
});

test("ÖDEME: ONLINE_PAYMENT_NOTE online ağ geçidinin henüz olmadığını dürüstçe söyler", () => {
  assert.ok(ONLINE_PAYMENT_NOTE.length > 0);
  const note = trLowerAscii(ONLINE_PAYMENT_NOTE);
  assert.ok(note.includes("online"), "not online kelimesini içermeli");
  assert.ok(note.includes("yakinda"), "not 'yakında' (henüz yok) demeli");
  // Dürüstlük: hem kapıda hem havale gerçek alternatif olarak anılır.
  assert.ok(note.includes("kapida"), "kapıda ödeme alternatifini anmalı");
  assert.ok(note.includes("havale"), "havale/EFT alternatifini anmalı");
});

// ---------- Tahsilat işaretleme yetki kapısı (güvenlik-kritik) ----------

test("TAHSİLAT KAPISI: satıcı + commerce.manage + onaylı + ödenmemiş → izin var", () => {
  const d = evaluateMarkOrderPaid(OK_ORDER, SELLER);
  assert.equal(d.allowed, true);
});

test("TAHSİLAT KAPISI: başka workspace işaretleyemez (çapraz-workspace reddi)", () => {
  const d = evaluateMarkOrderPaid(OK_ORDER, { workspaceId: "ws-baska", canManageCommerce: true });
  assert.equal(d.allowed, false);
  assert.ok(!d.allowed && d.reason.includes("satıcısı"));
});

test("TAHSİLAT KAPISI: alıcı (commerce.manage yok) KENDİ siparişini ödendi işaretleyemez", () => {
  // Alıcının kendi workspace'i satıcı workspace'i değil VE commerce.manage yetkisi yok.
  const d = evaluateMarkOrderPaid(OK_ORDER, { workspaceId: "ws-alici", canManageCommerce: false });
  assert.equal(d.allowed, false);
});

test("TAHSİLAT KAPISI: doğru workspace ama commerce.manage yoksa reddedilir", () => {
  const d = evaluateMarkOrderPaid(OK_ORDER, { workspaceId: SELLER_WS, canManageCommerce: false });
  assert.equal(d.allowed, false);
});

test("TAHSİLAT KAPISI: beklemede sipariş işaretlenemez (onaylanmadan tahsilat yok)", () => {
  const d = evaluateMarkOrderPaid({ ...OK_ORDER, orderStatus: "beklemede" }, SELLER);
  assert.equal(d.allowed, false);
  assert.ok(!d.allowed && d.reason.includes("onaylanmış"));
});

test("TAHSİLAT KAPISI: iptal sipariş işaretlenemez", () => {
  const d = evaluateMarkOrderPaid({ ...OK_ORDER, orderStatus: "iptal" }, SELLER);
  assert.equal(d.allowed, false);
});

test("TAHSİLAT KAPISI: zaten ödendi ise idempotent reddedilir (yeniden yazılmaz)", () => {
  const d = evaluateMarkOrderPaid({ ...OK_ORDER, paymentStatus: "odendi" }, SELLER);
  assert.equal(d.allowed, false);
  assert.ok(!d.allowed && d.reason.includes("Zaten"));
});

test("TAHSİLAT KAPISI: kapı sırası — yetki, durumdan ÖNCE kontrol edilir", () => {
  // Yetkisiz aktör beklemede siparişte bile önce yetki gerekçesini almalı (bilgi sızmasın).
  const d = evaluateMarkOrderPaid(
    { sellerWorkspaceId: SELLER_WS, orderStatus: "beklemede", paymentStatus: "bekliyor" },
    { workspaceId: "ws-baska", canManageCommerce: false }
  );
  assert.equal(d.allowed, false);
  assert.ok(!d.allowed && d.reason.includes("satıcısı"), "yetki gerekçesi durum gerekçesinden önce gelmeli");
});

// Türkçe küçük harfe indirger (İ/I ASCII yaklaşımı) — testlerin diakritikten bağımsız olması için.
function trLowerAscii(s: string): string {
  return s
    .replaceAll("İ", "i")
    .replaceAll("I", "i")
    .replaceAll("ı", "i")
    .toLowerCase();
}
