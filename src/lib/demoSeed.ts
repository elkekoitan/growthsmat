// SmartGrowth OS — platform-geneli örnek (seed) kayıtların dürüst tespiti.
// /uzman-danisma ve /kurasyon tohum verileri gerçek kullanıcı etkinliği DEĞİLDİR;
// "sahte kesinlik yok" ilkesi gereği UI'da açıkça "Örnek kayıt" olarak etiketlenir.
// Tohumlar bilinçli olarak @ornek.com kimliğiyle yazılır (prisma/seed yolu ve
// consultCases.ts/corrections.ts seedDemo* fonksiyonları) — tespit bu sözleşmeye dayanır.

/** Tohum kimliklerinin ortak e-posta soneki. */
export const SEED_IDENTITY_SUFFIX = "@ornek.com";

/**
 * Bir kimlik (e-posta) platform örnek verisine mi ait? Gerçek kullanıcı kimlikleri
 * asla bu sonekle oluşturulamaz (kayıt formu gerçek e-posta ister); bu nedenle
 * yanlış-pozitif üretmez, yanlış-negatif ise yalnız sözleşme dışı tohum eklenirse olur.
 */
export function isSeedIdentity(identity: string): boolean {
  return identity.trim().toLowerCase().endsWith(SEED_IDENTITY_SUFFIX);
}
