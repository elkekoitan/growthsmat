// Saf, bellek-içi kayan-pencere hız sınırlayıcı (P11-01 asistan LLM maliyet koruması).
// Tek konteyner deploy'da (bkz. Dockerfile) süreç-içi Map yeterlidir; çok-replika
// gelecekte gerekirse Redis'e taşınır. `now` parametresi test edilebilirlik için
// enjekte edilebilir (node --test saat oynatamadan pencere davranışını doğrular).

export interface RateLimiter {
  /** true = çağrıya izin var (ve sayıldı); false = pencere dolu, izin yok. */
  allow(key: string, now?: number): boolean;
  /** Test/gözlem için: bir anahtarın penceredeki aktif çağrı sayısı. */
  countFor(key: string, now?: number): number;
}

export function createRateLimiter(windowMs: number, maxPerWindow: number): RateLimiter {
  const hits = new Map<string, number[]>();

  function prune(now: number): void {
    // Harita büyümesin: 1000 anahtarı aşınca penceresi tamamen boşalmış olanları at.
    if (hits.size <= 1000) return;
    for (const [k, arr] of hits) {
      if (arr.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }

  return {
    allow(key: string, now: number = Date.now()): boolean {
      prune(now);
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= maxPerWindow) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
    countFor(key: string, now: number = Date.now()): number {
      return (hits.get(key) ?? []).filter((t) => now - t < windowMs).length;
    },
  };
}
