// SmartGrowth OS — istemci hata sınıflandırması (SAF).
// Amaç: deploy sonrası "bayat sekme" hatasını ayırt etmek. Next.js her deploy'da Server
// Action ID'lerini döndürebilir; açık kalan eski bir sekme eski ID'yle bir action çağırınca
// "Failed to find Server Action" hatası alır. Bu durumda unstable_retry() İŞE YARAMAZ —
// eski JS hâlâ bellekte; yalnız TAM SAYFA YENİLEME yeni action ID'lerini yükler.
// error.tsx bu sınıflandırmayı kullanıp doğru eylemi (yenile vs tekrar dene) öne çıkarır.

/**
 * Hata mesajı, deploy sonrası bayat Server Action referansına mı işaret ediyor?
 * Next.js sürümleri arası mesaj değişebildiğinden birden çok kalıp kontrol edilir.
 * Mesaj yoksa (prod'da bazı hatalar digest'e indirgenir) false döner — güvenli varsayılan.
 */
export function isStaleServerActionError(message: string | undefined | null): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("failed to find server action") ||
    m.includes("server action") && (m.includes("not found") || m.includes("was not found")) ||
    m.includes("could not find the server action")
  );
}
