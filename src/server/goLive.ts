// SmartGrowth OS — "Canlıya çıkış" durum toplayıcısı (server-only).
// Gerçek env/header'dan durum bayraklarını okur ve SAF deriveGoLiveItems'a geçirir.
// GÜVENLİK: yalnız "tanımlı mı" boolean'ı okunur — hiçbir gizli değer okunmaz/döndürülmez.
import "server-only";

import { headers } from "next/headers";
import { isLlmEnabled } from "./llm";
import { deriveGoLiveItems, summarizeGoLive, type GoLiveItem } from "@/lib/goLive";

export async function getGoLiveState(): Promise<{ items: GoLiveItem[]; summary: ReturnType<typeof summarizeGoLive> }> {
  const h = await headers();
  const items = deriveGoLiveItems({
    llmEnabled: isLlmEnabled(),
    // Sağlayıcı seçildiğinde bu env'lerden biri set edilir; yalnız varlık kontrol edilir.
    paymentKeySet: Boolean(process.env.STRIPE_SECRET_KEY || process.env.IYZICO_API_KEY),
    isHttps: h.get("x-forwarded-proto") === "https",
    dbReady: Boolean(process.env.DATABASE_URL) && Boolean(process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY),
  });
  return { items, summary: summarizeGoLive(items) };
}
