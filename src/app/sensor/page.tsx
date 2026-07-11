import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { SensorDashboard } from "./SensorDashboard";

export const metadata = {
  title: "Sensör ve Alarm",
  description:
    "Cihaz durumu, aykırı değer filtreleme ve süre/eşiğe dayalı alarm kuralları — tek anlık sıçrama yanlış alarm üretmez.",
};

export default function SensorPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <SensorDashboard />
      </main>
      <Footer />
    </RevealProvider>
  );
}
