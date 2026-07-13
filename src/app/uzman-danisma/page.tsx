import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { ExpertConsult } from "./ExpertConsult";

export const metadata = {
  title: "Uzman Danışma",
  description: "Doğrulanmış uzmana vaka aç, ata, yanıtla — yanıtlar kanıt seviyesiyle işaretlenir, sahte kesinlik üretilmez.",
};

export default async function UzmanDanismaPage() {
  const { user, membership } = await requireMembership();

  return (
    <RevealProvider>
      <Nav />
      <main>
        <ExpertConsult email={user.email} role={membership.role} nowISO={new Date().toISOString()} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
