import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CATALOG,
  CHANNELS,
  DELIVERY_ZONES,
  CLAIM_LABELS,
  simulateEtsyFees,
  simulateLocalFees,
  ETSY_LISTING_FEE_USD,
  ETSY_TRANSACTION_FEE_PCT,
  PAYMENT_PROCESSING,
} from "../src/data/commerce.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";
import { MICROGREEN_RECIPES } from "../src/data/microgreens.ts";

test("katalogdaki cropId/microgreenId referansları gerçek kayıtlara işaret eder", () => {
  const microIds = new Set(MICROGREEN_RECIPES.map((r) => r.id));
  for (const l of CATALOG) {
    if (l.cropId) assert.ok(CROP_BY_ID[l.cropId], `${l.id} → cropId '${l.cropId}' bulunamadı`);
    if (l.microgreenId) assert.ok(microIds.has(l.microgreenId), `${l.id} → microgreenId '${l.microgreenId}' bulunamadı`);
  }
});

test("her katalog kaydı en az bir kanala atanmış ve pozitif fiyatlı", () => {
  for (const l of CATALOG) {
    assert.ok(l.channels.length > 0, `${l.id} kanalsız kalamaz`);
    assert.ok(l.priceTRY > 0, `${l.id} fiyatı pozitif olmalı`);
    assert.ok(l.repeatOrderRate >= 0 && l.repeatOrderRate <= 1, `${l.id} tekrar sipariş oranı 0-1 aralığında olmalı`);
  }
});

test("DÜRÜSTLÜK: 'belge-bekliyor' organik iddiası yayınlanabilir değildir", () => {
  assert.equal(CLAIM_LABELS["belge-bekliyor"].publishable, false);
  assert.equal(CLAIM_LABELS.sertifikali.publishable, true);
  assert.equal(CLAIM_LABELS["gecis-sureci"].publishable, true);
  assert.equal(CLAIM_LABELS["yontem-kayitli"].publishable, true);
});

test("kanal ücret aralıkları mantıklı (0-100 arası, min<=max)", () => {
  for (const c of CHANNELS) {
    const [lo, hi] = c.feePct;
    assert.ok(lo >= 0 && hi <= 100 && lo <= hi, `${c.id} ücret aralığı geçersiz: ${lo}-${hi}`);
  }
});

test("teslimat bölgeleri pozitif ve tutarlı değerler taşır", () => {
  for (const z of DELIVERY_ZONES) {
    assert.ok(z.radiusKm > 0);
    assert.ok(z.minOrderTRY >= 0);
    assert.ok(z.deliveryFeeTRY >= 0);
  }
});

test("simulateEtsyFees — gelir = fiyat*adet + kargo; net = gelir - toplam ücret", () => {
  const r = simulateEtsyFees({ priceUSD: 10, quantity: 2, shippingUSD: 5, country: "TR" });
  assert.equal(r.revenueUSD, 25); // 10*2 + 5
  assert.ok(Math.abs(r.revenueUSD - r.totalFeesUSD - r.netToSellerUSD) < 0.02);
  assert.ok(Math.abs(r.listingFeeUSD - ETSY_LISTING_FEE_USD * 2) < 0.01);
  const expectedTx = 25 * (ETSY_TRANSACTION_FEE_PCT / 100);
  assert.ok(Math.abs(r.transactionFeeUSD - expectedTx) < 0.02);
});

test("simulateEtsyFees — TRY karşılığı pozitif ve kurla orantılı", () => {
  const r = simulateEtsyFees({ priceUSD: 20, quantity: 1, shippingUSD: 0, country: "US" });
  assert.ok(r.netToSellerTRY > 0);
  assert.ok(r.netToSellerTRY > r.netToSellerUSD); // TRY/USD kuru 1'den büyük referans
});

test("simulateEtsyFees — ülkeye göre ödeme işleme ücreti farklıdır (aynı girdi, farklı ülke)", () => {
  const tr = simulateEtsyFees({ priceUSD: 15, quantity: 1, shippingUSD: 3, country: "TR" });
  const us = simulateEtsyFees({ priceUSD: 15, quantity: 1, shippingUSD: 3, country: "US" });
  assert.notEqual(tr.paymentProcessingUSD, us.paymentProcessingUSD);
  assert.equal(PAYMENT_PROCESSING.TR.pct, 4);
  assert.equal(PAYMENT_PROCESSING.US.pct, 3);
});

test("simulateEtsyFees — adet arttıkça listing ücreti doğrusal artar", () => {
  const one = simulateEtsyFees({ priceUSD: 10, quantity: 1, shippingUSD: 0, country: "TR" });
  const five = simulateEtsyFees({ priceUSD: 10, quantity: 5, shippingUSD: 0, country: "TR" });
  assert.ok(Math.abs(five.listingFeeUSD - one.listingFeeUSD * 5) < 0.01);
});

test("simulateLocalFees — gelir = fiyat*adet + teslimat; komisyon oranla tutarlı", () => {
  const r = simulateLocalFees({ priceTRY: 100, quantity: 3, deliveryFeeTRY: 30, commissionPct: 5 });
  assert.equal(r.revenueTRY, 330); // 100*3 + 30
  assert.ok(Math.abs(r.commissionTRY - 330 * 0.05) < 0.02);
  assert.ok(Math.abs(r.revenueTRY - r.commissionTRY - r.netToProducerTRY) < 0.02);
});

test("simulateLocalFees — komisyon arttıkça net üretici geliri azalır", () => {
  const dusuk = simulateLocalFees({ priceTRY: 200, quantity: 1, deliveryFeeTRY: 0, commissionPct: 2.5 });
  const yuksek = simulateLocalFees({ priceTRY: 200, quantity: 1, deliveryFeeTRY: 0, commissionPct: 6 });
  assert.ok(yuksek.netToProducerTRY < dusuk.netToProducerTRY);
});

test("Etsy kanalı politika/kapı gereksinimlerini içerir (off-platform yönlendirme yasağı)", () => {
  const etsy = CHANNELS.find((c) => c.id === "etsy")!;
  assert.ok(etsy.requirements.some((r) => /off-platform|yönlendirme/i.test(r)));
});
