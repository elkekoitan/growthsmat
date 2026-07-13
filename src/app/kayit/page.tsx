import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { SignupForm } from "./SignupForm";

export const metadata = {
  title: "Kayıt Ol",
  description: "SmartGrowth OS'ta yeni bir işletme hesabı oluştur.",
};

export default function KayitPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <SignupForm />
      </main>
      <Footer />
    </RevealProvider>
  );
}
