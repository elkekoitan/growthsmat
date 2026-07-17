// /asistan — oturum varsa asistana kullanıcının GERÇEK bahçe/görev satırları bağlam
// olarak geçirilir (kişisel cevaplar bu satırlardan türetilir, uydurma yok). Oturum
// yoksa context=null ve asistan eski genel davranışında kalır.
// LLM yolu (P11-01): ANTHROPIC_API_KEY tanımlıysa sorular server action üzerinden
// Claude'a gider; değilse istemci-taraflı kural motoru birebir korunur.
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { buildAssistantContext } from "@/server/assistantContext";
import { isLlmEnabled } from "@/server/llm";
import type { AssistantContext } from "@/lib/assistant";
import { Assistant } from "./Assistant";

// Oturum cookie'sine ve canlı DB verisine bağlı — statik prerender edilemez.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "AI Asistan",
  description:
    "Kaynak gösteren asistan — pestisit dozu ve sağlık iddiası sorularında cevap üretmez, uzmana yönlendirir.",
};

export default async function AsistanPage() {
  const auth = await getOptionalMembership();
  const context: AssistantContext | null = auth
    ? await buildAssistantContext(auth.membership.workspaceId)
    : null;

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Assistant context={context} llmEnabled={isLlmEnabled()} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
