import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Tasks } from "./Tasks";

export const metadata = {
  title: "Görev ve saha günlüğü",
  description:
    "Bahçeni bir defter gibi tut: güne göre gruplanan bakım ritüelleri, haftalık takvim şeridi ve çevrimdışı çalışan saha günlüğü.",
};

export default function GorevlerPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <Tasks />
      </main>
      <Footer />
    </RevealProvider>
  );
}
