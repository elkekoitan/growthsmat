// SmartGrowth OS — P11-01 Model Gateway (roadmap "Model gateway ve adaptör").
// Tek görev: /asistan sorusunu, ANTHROPIC_API_KEY tanımlıysa Claude'a (Anthropic
// Messages API) iletmek; yoksa veya çağrı başarısız olursa mevcut kural motoruna
// DÜRÜSTÇE düşmek. Anahtar repo'ya yazılmaz — Coolify'da env var olarak eklenir
// ve eklenmeden bu dosyadaki API yolu hiç çalışmaz (kod hazır, aktivasyon tek env).
//
// Güvenlik mimarisi (sıra önemli, bkz. src/lib/assistant.ts):
// 1. Kural motoru HER soruda önce çalışır → güvenlik filtresi (pestisit dozu /
//    tıbbi iddia) kararı NİHAİ; bloklanan soru LLM'e asla iletilmez.
// 2. LLM'e giden sistem prompt'u yalnız kullanıcının GERÇEK bahçe/görev satırlarını
//    ve kural motorunun kaynaklı referans cevabını içerir (src/lib/assistantLlm.ts).
// 3. Kaynak/citation seti kural motorununki olarak kalır — LLM metnine yeni
//    "kaynak" iliştirilmez (sahte kesinlik yok).
import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { askAssistant, type AssistantContext } from "@/lib/assistant";
import {
  buildLlmSystemPrompt,
  shouldCallLlm,
  DEFAULT_LLM_MODEL,
  type AssistantReply,
} from "@/lib/assistantLlm";

/** LLM yolu aktif mi? Tek koşul: ANTHROPIC_API_KEY env var'ının varlığı. */
export function isLlmEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Modül-seviyesi singleton — her istekte yeni HTTP ajanı kurmamak için.
let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) {
    // Sohbet UX'i için kısa zaman aşımı: 30 sn'de cevap gelmezse kural motoruna
    // düşmek, kullanıcıyı süresiz bekletmekten iyidir. maxRetries 0 = SDK yeniden
    // denemesin (her deneme kendi 30 sn'sini getirirdi → 60+ sn spinner); zaten
    // hata yolunda kural motoru fallback'i var.
    client = new Anthropic({ timeout: 30_000, maxRetries: 0 });
  }
  return client;
}

/**
 * Asistan cevabı: LLM aktifse Claude'dan, değilse/başarısızsa kural motorundan.
 * Dönen `source` alanı UI'da dürüstçe etiketlenir — kullanıcı hangi motorun
 * cevap verdiğini her zaman görür.
 */
export async function askAssistantSmart(
  rawQuery: string,
  context: AssistantContext | null
): Promise<AssistantReply> {
  const rule = askAssistant(rawQuery, context);

  if (!isLlmEnabled() || !shouldCallLlm(rule)) {
    return { ...rule, source: "kural" };
  }

  try {
    const response = await getClient().messages.create({
      model: process.env.ASSISTANT_LLM_MODEL ?? DEFAULT_LLM_MODEL,
      // Kısa sohbet cevabı (sistem prompt'u 2-4 cümle istiyor) — bilinçli düşük üst
      // sınır; maliyet ve gecikme kontrolü. Adaptif düşünme token'ları da bu bütçeden
      // düştüğü için 2048 + düşük effort: kısa, grounded cevap için yeterli pay.
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      system: buildLlmSystemPrompt(context, rule),
      messages: [{ role: "user", content: rule.query }],
    });

    // Opus 4.8 güvenlik sınıflandırıcısı stop_reason "refusal" dönebilir (content
    // boş/kısmi olur) — bu durumda da kural motoru cevabına düşülür.
    // "max_tokens" da fallback'tir: cümle ortasında kesilmiş bir metni "Claude"
    // etiketiyle göstermek yerine kural motorunun tam cevabı tercih edilir.
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      return { ...rule, source: "kural" };
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) return { ...rule, source: "kural" };

    // Citations + confidence kural motorundan aynen taşınır: LLM'in cevabı bu
    // gerçek kayıtlarla grounded, ama LLM metni kaynak statüsü kazandırmaz.
    return { ...rule, answer: text, source: "llm" };
  } catch (err) {
    // Ağ/kota/anahtar hatası kullanıcıya sızmaz; kural motoru her zaman çalışır.
    console.error("[asistan] LLM çağrısı başarısız — kural motoruna düşüldü:", err);
    return { ...rule, source: "kural" };
  }
}
