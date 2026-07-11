// SmartGrowth OS — Feature flag ve deney altyapısı (PRD FR-234, P01-09)
// Kohort ataması DETERMİNİSTİK: aynı seed hep aynı sonucu verir (Math.random YOK).
// Öncelik: açık override > kohort (rolloutPct) > varsayılan.

export interface FlagDefinition {
  key: string;
  label: string;
  defaultOn: boolean;
  rolloutPct: number; // 0-100, kohort yüzdesi
  description: string;
}

export const FLAGS: FlagDefinition[] = [
  { key: "ne-olursa-senaryo", label: "Ne-olursa senaryo motoru", defaultOn: true, rolloutPct: 100, description: "Sulama/yöntem/çeşit değişimiyle senaryo karşılaştırma" },
  { key: "birlikte-ekim-v2", label: "Birlikte ekim v2", defaultOn: false, rolloutPct: 40, description: "Mekanizma + yerleşim önerili yeni birlikte ekim motoru" },
  { key: "sensor-alarm", label: "Sensör alarm merkezi", defaultOn: false, rolloutPct: 25, description: "Süre/eşiğe dayalı sensör alarmları" },
  { key: "etsy-entegrasyon", label: "Etsy entegrasyonu", defaultOn: false, rolloutPct: 10, description: "Etsy OAuth ve taslak listing akışı" },
  { key: "uzman-vaka", label: "Uzman danışmanlık vakası", defaultOn: false, rolloutPct: 0, description: "Ücretli uzman vaka akışı (henüz kapalı)" },
  { key: "lot-qr", label: "Lot QR doğrulama", defaultOn: true, rolloutPct: 100, description: "Alıcıya açık lot doğrulama sayfası" },
];

export const FLAG_BY_KEY: Record<string, FlagDefinition> = Object.fromEntries(FLAGS.map((f) => [f.key, f]));

export type FlagSource = "override" | "cohort" | "default";

export interface FlagDecision {
  flagKey: string;
  value: boolean;
  source: FlagSource;
}

/** Deterministik string hash → 0-99 kova (kohort ataması için). */
export function cohortBucket(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 100;
}

/**
 * Bir bayrağı değerlendirir. Override varsa onu kullanır; yoksa cohortSeed verilmişse
 * rolloutPct'e göre kohort; yoksa varsayılan. Bilinmeyen bayrak güvenli false döner.
 */
export function evaluateFlag(
  flagKey: string,
  overrides: Record<string, boolean> = {},
  cohortSeed?: string,
  flags: FlagDefinition[] = FLAGS
): FlagDecision {
  if (Object.prototype.hasOwnProperty.call(overrides, flagKey)) {
    return { flagKey, value: overrides[flagKey], source: "override" };
  }

  const def = flags.find((f) => f.key === flagKey);
  if (!def) {
    return { flagKey, value: false, source: "default" };
  }

  if (cohortSeed !== undefined) {
    const bucket = cohortBucket(`${flagKey}:${cohortSeed}`);
    return { flagKey, value: bucket < def.rolloutPct, source: "cohort" };
  }

  return { flagKey, value: def.defaultOn, source: "default" };
}

/** Tüm bayrakların bir seed için değerlendirilmiş halini döner. */
export function evaluateAll(
  overrides: Record<string, boolean> = {},
  cohortSeed?: string,
  flags: FlagDefinition[] = FLAGS
): FlagDecision[] {
  return flags.map((f) => evaluateFlag(f.key, overrides, cohortSeed, flags));
}

// ---------- localStorage serileştirme (saf) ----------

export function serializeOverrides(overrides: Record<string, boolean>): string {
  return JSON.stringify(overrides);
}

export function parseOverrides(raw: string | null): Record<string, boolean> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const clean: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}
