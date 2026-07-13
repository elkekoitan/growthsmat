import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { ExpertConsult } from "./ExpertConsult";

export const metadata = {
  title: "Uzman Danışma",
  description: "Doğrulanmış uzmana vaka aç, ata, yanıtla — yanıtlar kanıt seviyesiyle işaretlenir, sahte kesinlik üretilmez.",
};

export default function UzmanDanismaPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <ExpertConsult />
      </main>
      <Footer />
    </RevealProvider>
  );
}
