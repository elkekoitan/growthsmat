import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { getOptionalMembership } from "@/server/session";
import { listSitesWithQuality } from "@/server/repositories/sites";
import { SiteQualityDemo } from "./SiteQualityDemo";
import { SiteQualityBoard } from "./SiteQualityBoard";

export const metadata = {
  title: "Alan Veri Kalite Skoru",
  description:
    "Eksik ve bayat alan verisini ayrı ayrı işaretleyen kalite skoru — sahte kesinlik üretmez.",
};

export const dynamic = "force-dynamic";

export default async function AlanKalitesiPage() {
  // Oturum varsa kullanıcının GERÇEK alanları; yoksa herkese açık demo (davranış birebir
  // korunur) + bunun bir demo olduğunu söyleyen dürüst tek satır.
  const session = await getOptionalMembership();
  const sites = session ? await listSitesWithQuality(session.membership.workspaceId) : null;

  return (
    <RevealProvider>
      <Nav />
      <main>
        {sites ? (
          <SiteQualityBoard sites={sites} />
        ) : (
          <>
            <p
              className="container-x"
              style={{ margin: "18px auto 0", fontSize: "var(--fs-sm)", color: "var(--text-mid)", textAlign: "center" }}
            >
              Bu bir demo — <Link href="/giris" style={{ color: "var(--primary)" }}>giriş yaparsan</Link> kendi
              alanlarını kaydedebilirsin.
            </p>
            <SiteQualityDemo />
          </>
        )}
      </main>
      <Footer />
    </RevealProvider>
  );
}
