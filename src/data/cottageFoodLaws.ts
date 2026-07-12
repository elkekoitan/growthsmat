// SmartGrowth OS — ABD "cottage food" (ev mutfağı üretimi) yasaları kataloğu
// Kaynak: research/usa-state-matrix-south-southeast, usa-state-matrix-west-mountain-pacific
// (Georgia HB 398/2025, Texas SB 541/2025, New Mexico Homemade Food Act — 2026-07-13 paralel
// araştırma okumasıyla çıkarıldı). Ev/balkon üreticisinin fazla ürünü veya ev-işlenmiş gıdayı
// (reçel, kurutulmuş ürün vb.) ticari mutfak lisansı olmadan satıp satamayacağını gösterir.
//
// "Sahte kesinlik yok": New Mexico kaynağı yasanın kendisi DEĞİL, bir dernek özet broşürü —
// madde numaraları sınırlı ve broşürdeki yürürlük tarihi (2021) dosya adındaki yılla (2024)
// ÇELİŞİYOR; bu açıkça sourceNote'ta belirtildi, sessizce "düzeltilmedi".

export type CottageFoodState = "GA" | "TX" | "NM";

export interface CottageFoodLaw {
  state: CottageFoodState;
  stateName: string;
  lawName: string;
  citation: string;
  effectiveDate?: string; // ISO — kaynakta net değilse undefined
  effectiveDateNote?: string;
  permittedCategories: string[];
  prohibitedCategories: string[];
  annualRevenueCapUSD?: number; // undefined = kaynakta tavan belirtilmemiş (sınırsız olabilir)
  salesChannels: string[];
  registrationRequired: boolean;
  registrationNote: string;
  labelingRequirement: string;
  sourceFile: string;
  sourceNote?: string;
}

export const COTTAGE_FOOD_LAWS: CottageFoodLaw[] = [
  {
    state: "GA",
    stateName: "Georgia",
    lawName: "Georgia Cottage Food Act (HB 398, 2025)",
    citation: "OCGA Title 26, Chapter 2, Article 19",
    effectiveDateNote: "Kanun metninde açık bir yürürlük tarihi maddesi yok (yalnız çelişen kanunların yürürlükten kalktığı belirtiliyor) — tahmin yürütülmedi.",
    permittedCategories: [
      "Soğutma gerektirmeyen ekmek/rulo/bisküvi/kek",
      "Reçel/jöle/marmelat (azaltılmış şekerli fruit butter hariç)",
      "Kesilmemiş meyve-sebze, kurutulmuş meyve",
      "Kuru baharat/harman, tahıl-trail mix-granola, kuruyemiş",
      "Sirke, turşu, şekerleme, fudge, kuru çorba karışımı, kavrulmuş kahve, kuru makarna, patlamış mısır",
    ],
    prohibitedCategories: ["Alkollü içecekler", "Kannabis içeren gıdalar", "Çiğ süt", "Soğutma/sıcaklık kontrolü gerektiren (potentially hazardous) tüm gıdalar"],
    annualRevenueCapUSD: undefined,
    salesChannels: [
      "Doğrudan tüketiciye (online ve posta siparişi dahil)",
      "Perakende gıda satış kuruluşlarına (market, restoran)",
      "Üçüncü taraf satıcıda (ayrı reyon + etiketleme şartıyla)",
    ],
    registrationRequired: false,
    registrationNote:
      "Lisans/ruhsat gerekmiyor — cottage food operatörleri gıda satış/servis tanımından muaf. Talep üzerine opsiyonel bir 'kimlik numarası' alınabilir (lisans değil).",
    labelingRequirement:
      "\"This product was produced at a residential property that is exempt from state inspection. This product may contain allergens.\" (en az 10 punto)",
    sourceFile: "georgia_hb398_2025_cottage_food_act.pdf",
  },
  {
    state: "TX",
    stateName: "Texas",
    lawName: "Texas Cottage Food Production Operations Act (SB 541, 2025)",
    citation: "Texas Health and Safety Code, Chapter 437",
    effectiveDate: "2025-09-01",
    permittedCategories: ["Aşağıdaki 6 yasak kategori DIŞINDAKİ tüm gıdalar (2025 reformuyla liste modeli tersine çevrildi — izinliler değil yasaklılar sayılıyor)"],
    prohibitedCategories: [
      "Et, et ürünleri, kümes hayvanı ürünleri",
      "Deniz ürünleri, balık, kabuklu deniz ürünleri",
      "Buz/buz ürünleri (dondurma, custard, popsicle, gelato)",
      "Düşük asitli konserve gıdalar",
      "CBD/THC içeren ürünler",
      "Çiğ süt ve çiğ süt ürünleri",
    ],
    annualRevenueCapUSD: 150000,
    salesChannels: [
      "Doğrudan tüketiciye",
      "\"Cottage food vendor\" aracılığıyla toptan (yasak-6 kategori ve time/temp-kontrollü gıda hariç)",
      "Vendor üzerinden çiftçi pazarı/çiftlik standı/yiyecek işletmesi/HERHANGİ BİR perakende mağaza",
      "İnternet satışı (üretici/çalışan/hane üyesi bizzat teslim etmeli — posta/kargo artık YOK)",
    ],
    registrationRequired: true,
    registrationNote:
      "Temel cottage food üreticileri için yerel lisans/izin YASAK (istenemez). Ancak 'time/temperature control for safety food' satanlar eyalete kayıt olmalı; toptan alan vendor'lar da kayıt zorunlu. Ev adresini gizlemek isteyenler kayıt olup kimlik no alabilir.",
    labelingRequirement:
      "\"THIS PRODUCT WAS PRODUCED IN A PRIVATE RESIDENCE THAT IS NOT SUBJECT TO GOVERNMENTAL LICENSING OR INSPECTION\" + işletme adı/adres (veya kimlik no); time/temp-kontrollü gıdalarda üretim tarihi + 12 punto güvenli kullanım ibaresi ek şart.",
    sourceFile: "texas_sb541_2025_cottage_food_enrolled.pdf",
  },
  {
    state: "NM",
    stateName: "New Mexico",
    lawName: "New Mexico Homemade Food Act",
    citation: "7.6.2 NMAC (yalnız tehlikeli gıda kategorisi için — genel kanun madde numarası kaynakta yok)",
    effectiveDate: "2021-07-01",
    effectiveDateNote:
      "Kaynak (NM Farmers' Marketing Association özet broşürü) bu tarihi veriyor; araştırma dosya adındaki '2024' ile ÇELİŞİYOR — resmi statü metninden çapraz doğrulanmadı, uydurulmadı.",
    permittedCategories: ["Soğutma gerektirmeyen fırın ürünleri", "Reçel/jöle", "Krema bazlı olmayan şekerleme", "Belirli kuru karışımlar", "Kurutulmuş meyve/sebze", "Sirke/aromalı sirke"],
    prohibitedCategories: [
      "Et (jerky dahil), kümes hayvanları, balık",
      "Süt/peynir/krema, pişmiş yumurta",
      "Süt/yumurta bazlı krema-dolgu",
      "Azaltılmış şekerli reçel/jöle",
      "Kesilmiş meyve/sebze (taze/pişmiş/suyu)",
      "Krema/meringue, soslar/dressingler/yağlar, çorbalar",
      "Ev konservesi/turşu, salsa (ayrı izin gerektirir — aşağıya bakınız)",
    ],
    annualRevenueCapUSD: undefined,
    salesChannels: [
      "Yalnız doğrudan tüketiciye (toptan/online satış YASAK)",
      "Çiftçi pazarları vurgulanıyor — özel pazarlar izinsiz ürünleri reddedebilir",
    ],
    registrationRequired: true,
    registrationNote:
      "Temel (tehlikeli olmayan) gıdalar eyalet lisansından muaf ama satıcı NMED onaylı 'food handler card' almalı. Tehlikeli kategori (salsa, konserve vb.) için sertifikalı mutfak + işleme izni + yıllık 200 USD ücret + yıllık denetim gerekiyor.",
    labelingRequirement:
      "İşlemci adı/ev adresi/telefon/e-posta, malzeme listesi (azalan sırada), zorunlu ibare: \"This product is home produced and is exempt from state licensing and inspection. This product may contain allergens.\"",
    sourceFile: "new_mexico_homemade_food_act_2024.pdf",
    sourceNote:
      "Kaynak, yasanın kendisi değil New Mexico Farmers' Marketing Association'ın özet broşürü — madde numaraları sınırlı, resmi statü metniyle çapraz doğrulanmadı.",
  },
];

export function lawByState(state: CottageFoodState, catalog: CottageFoodLaw[] = COTTAGE_FOOD_LAWS): CottageFoodLaw | undefined {
  return catalog.find((l) => l.state === state);
}

/**
 * Yıllık geliri eyaletin tavanını aşıyor mu? Tavan yoksa (veya eyalet bilinmiyorsa) undefined
 * döner — "aşmıyor" (false) İLE "tavan yok/bilinmiyor" (undefined) KARIŞTIRILMAZ.
 */
export function exceedsRevenueCap(
  state: CottageFoodState,
  annualRevenueUSD: number,
  catalog: CottageFoodLaw[] = COTTAGE_FOOD_LAWS
): boolean | undefined {
  const law = lawByState(state, catalog);
  if (!law || law.annualRevenueCapUSD === undefined) return undefined;
  return annualRevenueUSD > law.annualRevenueCapUSD;
}
