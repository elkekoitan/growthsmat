// SmartGrowth OS — Türkiye yerel takvim günü yardımcısı (server-only).
// Önceden src/app/pazar/actions.ts içinde gömülüydü — /alan-kalitesi de aynı "TR yerel gün"
// hesabına ihtiyaç duyunca buraya taşındı (davranış birebir aynı, mekanik taşıma).
import "server-only";

const TR_UTC_OFFSET_MS = 3 * 60 * 60 * 1000; // Türkiye yıl boyu UTC+3, DST yok.

/**
 * Türkiye yerel takvim gününü (yyyy-mm-dd) döner. Ham `new Date().toISOString()` UTC
 * bugününü verir — UTC 21:00–23:59 arası (TR yerel 00:00–02:59) bu, henüz TR takvimi bir
 * gün ilerlemişken hâlâ "dünü" döner, ki bu tam olarak adversarial review'ün bulduğu
 * hatadır (sertifika süresi TR yerel gece yarısında dolar, ama UTC saat 3 saat sonra
 * güncellenirdi — o pencerede süresi dolmuş bir sertifika hâlâ geçerli sayılırdı).
 */
export function nowInTurkeyISO(): string {
  return new Date(Date.now() + TR_UTC_OFFSET_MS).toISOString().slice(0, 10);
}
