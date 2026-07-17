"use server";
// /asistan Server Action'ı — LLM yolu aktifken istemci soruyu buraya gönderir.
// Bağlam (Bahçem + Görevler) HER SORUDA sunucuda yeniden kurulur; istemcinin
// gönderdiği hiçbir bağlama güvenilmez. LLM kapalıysa bu action hiç çağrılmaz
// (istemci kural motorunu yerel çalıştırır — mevcut davranış birebir korunur).

import { headers } from "next/headers";
import { getOptionalMembership } from "@/server/session";
import { buildAssistantContext } from "@/server/assistantContext";
import { askAssistantSmart } from "@/server/llm";
import { askAssistant } from "@/lib/assistant";
import { createRateLimiter } from "@/lib/rateLimit";
import type { AssistantReply } from "@/lib/assistantLlm";

// Bellek-içi hız sınırı (tek konteyner deploy — bkz. Dockerfile): action oturumsuz
// da çağrılabildiği için anahtar eklendiğinde anonim spam'e karşı maliyet koruması.
// Aşımda kullanıcı CEVAPSIZ KALMAZ — kural motoru cevabına düşülür.
// Mantık saf src/lib/rateLimit.ts'te (pencere/temizlik davranışı testli).
const llmRateLimiter = createRateLimiter(60_000, 10);

export async function askAssistantAction(rawQuery: string): Promise<AssistantReply> {
  // Üst sınır: kötüye kullanım / maliyet koruması. UI zaten kısa soru bekliyor.
  const query = String(rawQuery ?? "").slice(0, 500);

  const auth = await getOptionalMembership();
  const context = auth ? await buildAssistantContext(auth.membership.workspaceId) : null;

  // XFF'in EN SAĞDAKİ girdisi alınır: o girdiyi bizim önümüzdeki (güvenilir) proxy
  // ekler; en soldaki girdi istemcinin kendi gönderdiği header'la sahtelenebilir
  // (review bulgusu — soldaki alınsaydı saldırgan her istekte taze anahtar üretip
  // sınırı bypass edebilirdi).
  const h = await headers();
  const xff = h.get("x-forwarded-for") ?? "";
  const ip = xff.split(",").map((s) => s.trim()).filter(Boolean).pop() || "yerel";
  if (!llmRateLimiter.allow(auth ? `u:${auth.user.id}` : `ip:${ip}`)) {
    return { ...askAssistant(query, context), source: "kural" };
  }

  return askAssistantSmart(query, context);
}
