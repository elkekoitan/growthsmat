// SmartGrowth OS — Ödeme yöntemi ve tahsilat durumu (SAF katman).
// /pazar siparişlerinde GERÇEK bir ödeme kavramı; ANCAK bir ödeme AĞ GEÇİDİ
// (iyzico/Stripe) GEREKTİRMEDEN. Türkiye yerel organik satışının baskın modu
// "kapıda ödeme (nakit/kart)" ve "havale/EFT"dir — üretici parayı ELDEN/HESABEN
// alır ve sistemde "Ödendi" işaretler.
//
// DÜRÜSTLÜK İLKESİ: online kart tahsilatı HÂLÂ YOK. Burada hiçbir "online öde"
// seçeneği sunulmaz (PAYMENT_METHODS yalnız kapıda + havale). paymentStatus="odendi"
// yalnız üreticinin ELLE onayladığı fiziksel/hesaben tahsilattır — sahte bir online
// akış değildir. Ağ geçidi entegrasyonu dürüstçe ertelenmiş kalır (bkz. src/lib/goLive.ts
// "odeme" maddesi). SAF: DB/prisma/server import ETMEZ (no-restricted-imports kuralı) —
// yalnız statik değer + doğrulama, deterministik test edilir.

export type PaymentMethod = "kapida" | "havale" | "belirtilmedi";
export type PaymentStatus = "bekliyor" | "odendi";

export interface PaymentMethodOption {
  value: PaymentMethod;
  label: string;
}

// Alıcının checkout'ta SEÇEBİLECEĞİ yöntemler — YALNIZ ikisi. "belirtilmedi" seçilebilir
// bir seçenek DEĞİLDİR, yalnızca yöntem hiç belirtilmeden oluşmuş siparişlerin varsayılan
// durumudur. ONLINE SEÇENEK BİLİNÇLİ OLARAK YOK: ağ geçidi entegre değil, öyleymiş gibi
// bir düğme göstermek dürüst olmaz.
export const PAYMENT_METHODS: PaymentMethodOption[] = [
  { value: "kapida", label: "Kapıda ödeme (nakit/kart)" },
  { value: "havale", label: "Havale / EFT" },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  kapida: "Kapıda ödeme (nakit/kart)",
  havale: "Havale / EFT",
  belirtilmedi: "Belirtilmedi",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  bekliyor: "Ödeme bekliyor",
  odendi: "Ödendi",
};

/**
 * Checkout girişini doğrular: bir alıcı yalnız "kapida" veya "havale" seçebilir.
 * "belirtilmedi" (yalnız varsayılan durum), "online" (ağ geçidi yok), boş string ve
 * her türlü çöp REDDEDİLİR — geçersiz girişte çağıran taraf "belirtilmedi"e düşürür.
 */
export function isSelectablePaymentMethod(value: unknown): value is "kapida" | "havale" {
  return value === "kapida" || value === "havale";
}

// UI'da gösterilen dürüst şerit — online kart ödemesinin HENÜZ olmadığını açıkça söyler.
export const ONLINE_PAYMENT_NOTE =
  "Online kart ödemesi yakında — şimdilik kapıda ödeme veya havale/EFT ile.";

// ---------- Tahsilat işaretleme yetki kapısı (SAF, test edilebilir) ----------
// markOrderPaid'in en yüksek riskli parçası yetki/durum kontrolüdür. Bu kararı DB'den
// AYIRIP saf tutarız ki (satıcı-mı / onaylı-mı / zaten-ödendi-mi) doğrudan, DB'siz,
// deterministik test edilebilsin (adversarial review bulgusu: bu kapı önceden testsizdi).
// Rol → boolean çevirisi (can(role,"commerce.manage")) ÇAĞIRAN tarafta yapılır; burada
// roles.ts import edilmez (saflık korunur).

export interface MarkPaidOrderFacts {
  /** İlanın sahibi olan workspace. */
  sellerWorkspaceId: string;
  /** Sipariş işleniş durumu: "beklemede" | "onaylandi" | "iptal". */
  orderStatus: string;
  /** Mevcut ödeme durumu. */
  paymentStatus: PaymentStatus;
}

export interface MarkPaidActorFacts {
  workspaceId: string;
  /** can(role, "commerce.manage") sonucu — çağıran hesaplar. */
  canManageCommerce: boolean;
}

export type MarkPaidDecision = { allowed: true } | { allowed: false; reason: string };

/**
 * Bir aktör, bir siparişi "Ödendi" işaretleyebilir mi? Kapı sırası ve gerekçe metinleri
 * markOrderPaid repo fonksiyonuyla BİREBİR aynıdır (tek gerçek kaynak — repo bunu çağırır).
 * Alıcının kendi siparişini işaretlemesi yapısal olarak imkânsızdır: alıcının
 * canManageCommerce'i satıcı workspace'inde geçerli olmadığından ilk kapı reddeder.
 */
export function evaluateMarkOrderPaid(order: MarkPaidOrderFacts, actor: MarkPaidActorFacts): MarkPaidDecision {
  if (order.sellerWorkspaceId !== actor.workspaceId || !actor.canManageCommerce) {
    return { allowed: false, reason: "Yalnızca ilanın satıcısı tahsilatı işaretleyebilir." };
  }
  if (order.orderStatus !== "onaylandi") {
    return { allowed: false, reason: "Yalnızca onaylanmış siparişlerde tahsilat işaretlenebilir." };
  }
  if (order.paymentStatus === "odendi") {
    return { allowed: false, reason: "Zaten ödendi işaretli." };
  }
  return { allowed: true };
}
