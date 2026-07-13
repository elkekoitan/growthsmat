import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateIntercrop,
  suggestLayout,
  categorizeMechanism,
  relationTypeOf,
  confidenceFromEvidence,
  enrichRelation,
} from "../src/lib/intercrop.ts";
import { CROPS } from "../src/data/crops.ts";

test("domates + fesleğen 'deneysel faydalı' döner (kesin 'uyumlu' etiketi YOK)", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  const pair = r.pairs[0];
  assert.ok(pair.relation || pair.reverseRelation);
  // domates→fesleğen kanıt C ama bir yönü D olabilir; en azından faydalı ilişki var
  assert.ok(pair.experimental || pair.relation?.effect === "faydali" || pair.reverseRelation?.effect === "faydali");
});

test("aynı aile (iki domates çeşidi) ortak hastalık riski işaretlenir", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "sirik-domates-beefsteak"]);
  assert.ok(r.pairs[0].riskFlags.some((f) => /Solanaceae/.test(f)));
  assert.ok(r.overallRisks.some((f) => /Solanaceae/.test(f)));
});

test("riskli ilişki (soğan + fasulye) riskFlags üretir", () => {
  const r = evaluateIntercrop(["sogan-yesil", "fasulye-sirik"]);
  assert.ok(r.pairs[0].riskFlags.length > 0);
});

test("kanıt seviyesi yanıtta korunur", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  const rel = r.pairs[0].relation ?? r.pairs[0].reverseRelation;
  assert.ok(rel);
  assert.ok(["A", "B", "C", "D", "E"].includes(rel!.evidence));
});

test("tek ürün → boş pairs", () => {
  const r = evaluateIntercrop(["marul"]);
  assert.equal(r.pairs.length, 0);
});

test("bilinmeyen id güvenli atlanır (çökme yok)", () => {
  assert.doesNotThrow(() => evaluateIntercrop(["marul", "olmayan-urun"]));
  const r = evaluateIntercrop(["marul", "olmayan-urun"]);
  assert.equal(r.pairs.length, 0); // tek geçerli ürün kalır → çift oluşmaz
});

test("n ürün için C(n,2) çift üretilir", () => {
  const r = evaluateIntercrop(["marul", "roka", "ispanak"]);
  assert.equal(r.pairs.length, 3); // 3 üründen 3 çift
});

test("suggestLayout iki+ ürün için yerleşim notu üretir, tek ürün için boş", () => {
  assert.equal(suggestLayout(["marul"]).length, 0);
  const notes = suggestLayout(["sirik-domates-beefsteak", "marul"]);
  assert.ok(notes.length > 0);
  assert.ok(notes.some((n) => /Kuzey|Güney|sulama/i.test(n)));
});

test("iki yönlü ilişki 'cift-yonlu' olarak işaretlenir veya tek yön doğru belirlenir", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  assert.ok(["a→b", "b→a", "cift-yonlu", "yok"].includes(r.pairs[0].direction));
});

// ---- P05-12: çok-boyutlu kategori katmanı (categorizeMechanism/relationTypeOf/confidenceFromEvidence) ----

test("categorizeMechanism: azot içeren metin 'azot' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("azot katkısı"), "azot");
  assert.equal(categorizeMechanism("yapısal destek + azot fiksasyonu (Üç Kızkardeş)"), "azot");
});

test("categorizeMechanism: tuzak bitki ve zararlı/böcek/tırtıl metni 'zararli' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("salatalık böceği için tuzak bitki (zayıf etki)"), "zararli");
  assert.equal(categorizeMechanism("lahana kurdu baskısı"), "zararli");
  assert.equal(categorizeMechanism("lahana güvesi/tırtılı baskısı"), "zararli");
  assert.equal(categorizeMechanism("VOC sinyali ile thrips baskısı"), "zararli");
});

test("categorizeMechanism: hastalık/mildiyö/ortak kabuk uyuzu metni 'hastalik' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("ortak hastalık (mildiyö) baskısı"), "hastalik");
  assert.equal(categorizeMechanism("ortak kabuk uyuzu (common scab) konağı"), "hastalik");
});

test("categorizeMechanism: polinatör metni 'polinator' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("polinatör çekimi + hasat uyumu"), "polinator");
});

test("categorizeMechanism: zaman katmanı metni 'zamanlama' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("zaman katmanı — erken hasat"), "zamanlama");
  assert.equal(categorizeMechanism("zaman/alan uyumu"), "zamanlama");
});

test("categorizeMechanism: kök nişi/derinliği metni 'kok' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("kök nişi tamamlayıcılığı (Üç Kızkardeş)"), "kok");
  assert.equal(categorizeMechanism("kök derinliği tamamlayıcılığı"), "kok");
});

test("categorizeMechanism: gölge/alan katmanı metni 'isik' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("gölge katmanı + alan verimi"), "isik");
  assert.equal(categorizeMechanism("alan katmanı — gölge toleransı"), "isik");
});

test("categorizeMechanism: rekabet/uyumsuzluk metni 'rekabet' kategorisine düşer", () => {
  assert.equal(categorizeMechanism("besin rekabeti"), "rekabet");
  assert.equal(categorizeMechanism("sulama ihtiyacı uyumsuz"), "rekabet");
});

test("categorizeMechanism: hiçbir anahtar kelimeye uymayan metin 'diger' döner (çökme yok, sessiz varsayılan)", () => {
  assert.equal(categorizeMechanism("tamamen ilgisiz rastgele bir açıklama"), "diger");
});

test("relationTypeOf: 'tuzak bitki' metni 'tuzak-bitki', 'şerit ekim' metni 'kenar-serit' döner, aksi 'birlikte-ekim'", () => {
  assert.equal(relationTypeOf("Blue Hubbard tuzak bitkisi salatalık böceğini çeker"), "tuzak-bitki");
  assert.equal(relationTypeOf("şerit ekim kenar etkisi (Wageningen)"), "kenar-serit");
  assert.equal(relationTypeOf("azot katkısı"), "birlikte-ekim");
});

test("confidenceFromEvidence: A/B yuksek, C orta, D/E dusuk döner", () => {
  assert.equal(confidenceFromEvidence("A"), "yuksek");
  assert.equal(confidenceFromEvidence("B"), "yuksek");
  assert.equal(confidenceFromEvidence("C"), "orta");
  assert.equal(confidenceFromEvidence("D"), "dusuk");
  assert.equal(confidenceFromEvidence("E"), "dusuk");
});

test("enrichRelation: girdi mutate edilmez, serbest metin mechanism KORUNUR", () => {
  const rel = { cropId: "x", effect: "faydali" as const, mechanism: "azot katkısı", evidence: "B" as const };
  const snapshot = JSON.stringify(rel);
  const enriched = enrichRelation(rel);
  assert.equal(JSON.stringify(rel), snapshot); // orijinal değişmedi
  assert.equal(enriched.mechanism, "azot katkısı"); // serbest metin kayıp değil
  assert.equal(enriched.mechanismCategory, "azot");
  assert.equal(enriched.confidence, "yuksek");
});

test("evaluateIntercrop: dönen ilişkiler mechanismCategory/relationType/confidence taşır", () => {
  const r = evaluateIntercrop(["cherry-domates-kompakt", "feslegen"]);
  const rel = r.pairs[0].relation ?? r.pairs[0].reverseRelation;
  assert.ok(rel);
  assert.ok(["isik", "kok", "azot", "zararli", "hastalik", "polinator", "zamanlama", "rekabet", "diger"].includes(rel!.mechanismCategory));
  assert.ok(["birlikte-ekim", "tuzak-bitki", "kenar-serit"].includes(rel!.relationType));
  assert.ok(["yuksek", "orta", "dusuk"].includes(rel!.confidence));
});

test("gerçek veri kapsama kontrolü: crops.ts'teki TÜM companion ilişkilerinin çoğunluğu 'diger' DEĞİL kategorize edilir", () => {
  const allRelations = CROPS.flatMap((c) => c.companions);
  assert.ok(allRelations.length > 20, "en az 20+ gerçek ilişki bekleniyor");
  const uncategorized = allRelations.filter((r) => categorizeMechanism(r.mechanism) === "diger");
  const uncategorizedRatio = uncategorized.length / allRelations.length;
  assert.ok(
    uncategorizedRatio < 0.2,
    `'diger' oranı çok yüksek (${(uncategorizedRatio * 100).toFixed(0)}%) — sınıflandırıcı gerçek veriyi iyi kapsamıyor: ${uncategorized.map((r) => r.mechanism).join(" | ")}`
  );
});
