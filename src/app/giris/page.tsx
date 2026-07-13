import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Giriş Yap",
  description: "SmartGrowth OS hesabına giriş yap.",
};

export default function GirisPage() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        <LoginForm />
      </main>
      <Footer />
    </RevealProvider>
  );
}
