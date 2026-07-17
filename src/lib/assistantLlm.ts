// SmartGrowth OS — Asistan LLM katmanının SAF parçası (P11-01 model gateway).
// Bu dosya DB'ye ve Anthropic SDK'ya DOKUNMAZ — yalnız prompt metni ve karar mantığı
// üretir ki node --test ile ağsız/DB'siz test edilebilsin. Gerçek API çağrısı
// src/server/llm.ts'te yaşar (env-gated: ANTHROPIC_API_KEY yoksa hiç çağrılmaz).
//
// Dürüstlük ilkesi ("sahte kesinlik yok") LLM yolunda da geçerlidir:
// - Güvenlik filtresi (kural motoru) HER ZAMAN önce çalışır; bloklanan soru LLM'e gitmez.
// - Kişisel iddialar YALNIZ verilen gerçek bahçe/görev satırlarından türetilebilir.
// - Kaynak/citation seti kural motorunun eşleştirdiği GERÇEK kayıtlardan gelir; LLM'in
//   kendi ürettiği metne yeni "kaynak" eklenmez.

import { CROP_BY_ID } from "@/data/crops";
import type { AssistantAnswer, AssistantContext } from "./assistant";

/** Cevabı hangi motor üretti — UI bunu dürüstçe etiketler. */
export type AssistantSource = "kural" | "llm";

export interface AssistantReply extends AssistantAnswer {
  source: AssistantSource;
}

/** Varsayılan model; Coolify'da ASSISTANT_LLM_MODEL env ile değiştirilebilir. */
export const DEFAULT_LLM_MODEL = "claude-opus-4-8";

/**
 * Bir sorgu LLM'e gidebilir mi? Güvenlik filtresi kararı NİHAİDİR — bloklanan
 * soru asla modele iletilmez. Boş sorgu da gitmez (API 400 döner, anlamı yok).
 */
export function shouldCallLlm(ruleAnswer: AssistantAnswer): boolean {
  return !ruleAnswer.safetyBlocked && ruleAnswer.query.trim().length > 0;
}

const CONTEXT_STATUS_LABELS: Record<string, string> = {
  planlaniyor: "planlanıyor",
  ekildi: "ekildi",
  buyuyor: "büyüyor",
  hasat: "hasada hazır",
  arsiv: "arşivde",
};

function cropName(cropId: string): string {
  return CROP_BY_ID[cropId]?.name ?? cropId;
}

/**
 * Sistem prompt'u: kimlik + dürüstlük/güvenlik kuralları + kullanıcının GERÇEK
 * bahçe/görev satırları + kural motorunun referans cevabı (grounding).
 * Sorgunun kendisi user mesajı olarak ayrı gider (prompt-cache dostu sıralama).
 */
export function buildLlmSystemPrompt(context: AssistantContext | null, ruleAnswer: AssistantAnswer): string {
  const lines: string[] = [
    "Sen SmartGrowth OS'un organik üretim asistanısın. Türkçe, kısa (2-4 cümle) ve net cevap ver.",
    "",
    "KATI KURALLAR (ihlal edilemez):",
    "- Pestisit/girdi dozu, ilaç karışımı veya uygulama oranı ASLA önerme; kullanıcıyı ürün etiketi ve uzman danışmanlığına (/uzman-danisma) yönlendir.",
    "- Tıbbi/sağlık iddiası (tedavi eder, önler, şifa) ASLA üretme.",
    "- Emin olmadığın veya elindeki kayıtlarda olmayan bilgiyi uydurma; açıkça \"bu konuda kaydım yok\" de. Sahte kesinlik yasak.",
    "- Kullanıcının bahçesi/görevleri hakkında YALNIZ aşağıdaki gerçek kayıt satırlarını kullan; satırlarda olmayan kişisel bilgiyi varsayma.",
    "- Sayı ve tarih uydurma; verilen kayıtlardaki değerleri aynen kullan.",
  ];

  lines.push("", "KULLANICI BAĞLAMI (gerçek kayıtlar):");
  if (!context) {
    lines.push("- Kullanıcı giriş yapmamış; kişisel bahçe/görev verisi YOK. Kişisel soru gelirse giriş yapmasını öner.");
  } else {
    if (context.crops.length === 0) {
      lines.push("- Bahçe kaydı: boş (takip edilen ürün yok).");
    } else {
      for (const c of context.crops) {
        lines.push(`- Bahçe kaydı: ${cropName(c.cropId)} — durum: ${CONTEXT_STATUS_LABELS[c.status] ?? c.status}, bölge: ${c.zone}`);
      }
    }
    if (context.tasksToday.length === 0) {
      lines.push("- Bugünkü açık görev: yok.");
    } else {
      for (const t of context.tasksToday) {
        lines.push(`- Bugünkü görev: ${t.title} (${cropName(t.cropId)}, tür: ${t.type})`);
      }
    }
    lines.push(`- Gecikmiş açık görev sayısı: ${context.tasksOverdue}`);
  }

  lines.push(
    "",
    "KURAL MOTORU REFERANSI (bilgi grafiğimizden, kaynaklı — cevabını bununla tutarlı kur):",
    `- Referans cevap: ${ruleAnswer.answer}`
  );
  if (ruleAnswer.citations.length > 0) {
    for (const c of ruleAnswer.citations) {
      lines.push(`- Kaynak: ${c.title} (${c.org}, ${c.year})`);
    }
  } else {
    lines.push("- Kaynak: yok (bilgi grafiğinde eşleşme bulunamadı — cevabında bunu dürüstçe belirt).");
  }

  return lines.join("\n");
}
