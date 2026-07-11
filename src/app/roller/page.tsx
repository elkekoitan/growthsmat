import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { RolesMatrix } from "./RolesMatrix";

export const metadata = {
  title: "Rol ve İzin Matrisi",
  description:
    "En az ayrıcalık ilkesiyle 8 rol × 18 izin matrisi ve çok kiracılı tenant izolasyonu demosu.",
};

export default function RollerPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <RolesMatrix />
      </main>
      <Footer />
    </RevealProvider>
  );
}
