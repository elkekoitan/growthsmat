// SmartGrowth OS — /alan-kalitesi form girdisi doğrulama (SAF katman).
// Bu modül DB'ye dokunmaz (src/lib/** → prisma importu ESLint'te yasak) — repo katmanı
// (src/server/repositories/sites.ts) yazmadan önce buradan geçirir, testler doğrudan çağırır.
// İlke: sessiz düzeltme YOK — geçersiz girdi Türkçe, kullanıcıya gösterilebilir bir gerekçeyle
// reddedilir; NaN/Infinity gibi "sayı gibi görünen" değerler dürüstçe geri çevrilir.

export type SiteInputResult<T> = { ok: true; value: T } | { ok: false; reason: string };

export interface SiteInput {
  name: string;
  areaM2: number;
  sunHoursObserved?: number;
  exactLocationKnown: boolean;
}

export interface SoilTestInput {
  ph: number;
  ec: number;
  organicMatterPct: number;
  sampledAt: string; // YYYY-MM-DD
}

export interface WaterTestInput {
  qualityOk: boolean;
  testedAt: string; // YYYY-MM-DD
}

const NAME_MAX = 80;
const AREA_MAX_M2 = 1_000_000; // 100 hektar — bunun üstü büyük ihtimalle birim hatası (dönüm/m² karışması).

/**
 * "YYYY-MM-DD" biçimini VE takvim geçerliliğini kontrol eder ("2026-13-45" biçime uysa da
 * gerçek bir gün değildir — Date round-trip ile yakalanır). Dönen değer normalize tarih değil,
 * yalnız geçerli/geçersiz yargısı: girdi zaten kanonik biçimde olmak zorunda.
 */
function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = new Date(iso + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return false;
  // "2026-02-31" gibi taşan tarihler Date tarafından sessizce mart'a kaydırılır — round-trip
  // eşitliğiyle reddedilir.
  return d.toISOString().slice(0, 10) === iso;
}

/**
 * Test tarihi kuralları: geçerli YYYY-MM-DD VE bugünden (todayISO — çağıran TR yerel gününü
 * verir, bkz. src/server/trDate.ts) ileride değil. Gelecek tarihli bir "yapılmış test" kaydı
 * sahte veri üretir — skor motoru onu negatif yaşla "güncel" sayardı.
 */
function validateTestDate(iso: string, todayISO: string, label: string): string | undefined {
  if (!isValidISODate(iso)) return `${label} geçerli bir tarih olmalı (YYYY-AA-GG biçiminde).`;
  if (iso > todayISO) return `${label} gelecekte olamaz — yalnız yapılmış testler kaydedilir.`;
  return undefined;
}

/** Alan profili girdisini doğrular. Ad kırpılır; sayı alanları sonlu ve makul aralıkta olmalı. */
export function validateSiteInput(input: {
  name: string;
  areaM2: number;
  sunHoursObserved?: number;
  exactLocationKnown: boolean;
}): SiteInputResult<SiteInput> {
  const name = input.name.trim();
  if (name.length < 1) return { ok: false, reason: "Alan adı boş olamaz." };
  if (name.length > NAME_MAX) return { ok: false, reason: `Alan adı en fazla ${NAME_MAX} karakter olabilir.` };

  if (!Number.isFinite(input.areaM2) || input.areaM2 <= 0) {
    return { ok: false, reason: "Alan büyüklüğü (m²) sıfırdan büyük bir sayı olmalı." };
  }
  if (input.areaM2 > AREA_MAX_M2) {
    return { ok: false, reason: `Alan büyüklüğü en fazla ${AREA_MAX_M2.toLocaleString("tr-TR")} m² olabilir — birimini kontrol et.` };
  }

  if (input.sunHoursObserved !== undefined) {
    if (!Number.isFinite(input.sunHoursObserved) || input.sunHoursObserved < 0 || input.sunHoursObserved > 24) {
      return { ok: false, reason: "Güneş saati 0 ile 24 arasında olmalı." };
    }
  }

  return {
    ok: true,
    value: {
      name,
      areaM2: input.areaM2,
      sunHoursObserved: input.sunHoursObserved,
      exactLocationKnown: input.exactLocationKnown,
    },
  };
}

/**
 * Toprak testi girdisini doğrular. Aralıklar fiziksel/tarımsal makullük sınırları:
 * ph 0-14 (ölçek tanımı), ec 0-20 dS/m (tarım toprağında bunun üstü ölçüm hatasıdır),
 * organik madde 0-100 (yüzde). `todayISO` dışarıdan verilir — deterministik/test edilebilir.
 */
export function validateSoilTestInput(
  input: { ph: number; ec: number; organicMatterPct: number; sampledAt: string },
  todayISO: string
): SiteInputResult<SoilTestInput> {
  if (!Number.isFinite(input.ph) || input.ph < 0 || input.ph > 14) {
    return { ok: false, reason: "pH 0 ile 14 arasında olmalı." };
  }
  if (!Number.isFinite(input.ec) || input.ec < 0 || input.ec > 20) {
    return { ok: false, reason: "EC 0 ile 20 dS/m arasında olmalı." };
  }
  if (!Number.isFinite(input.organicMatterPct) || input.organicMatterPct < 0 || input.organicMatterPct > 100) {
    return { ok: false, reason: "Organik madde yüzdesi 0 ile 100 arasında olmalı." };
  }
  const dateError = validateTestDate(input.sampledAt, todayISO, "Örnekleme tarihi");
  if (dateError) return { ok: false, reason: dateError };

  return {
    ok: true,
    value: { ph: input.ph, ec: input.ec, organicMatterPct: input.organicMatterPct, sampledAt: input.sampledAt },
  };
}

/** Su testi girdisini doğrular — tarih kuralları toprak testiyle aynı. */
export function validateWaterTestInput(
  input: { qualityOk: boolean; testedAt: string },
  todayISO: string
): SiteInputResult<WaterTestInput> {
  const dateError = validateTestDate(input.testedAt, todayISO, "Test tarihi");
  if (dateError) return { ok: false, reason: dateError };
  return { ok: true, value: { qualityOk: input.qualityOk, testedAt: input.testedAt } };
}
