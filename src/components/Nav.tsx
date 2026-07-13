import { getOptionalMembership } from "@/server/session";
import { NavClient, type NavSession } from "./NavClient";

// DÜRÜSTLÜK NOTU (2026-07-13, canlı kullanıcı bulgusu): Nav önceden oturum durumunu HİÇ
// bilmiyordu — giriş yapmış bir kullanıcı bile her sayfada "Giriş"/"Ücretsiz başla" görürdü,
// çıkış yapmanın hiçbir yolu yoktu. Bu, gerçek bir oturumun var olduğunu doğrulamanın tek
// görünür yolunu ortadan kaldırıyordu ("login bile olamıyoruz" hissinin bir parçası). Nav artık
// Server Component olarak gerçek oturumu okur, NavClient'a (etkileşim: tema/menü) prop olarak
// geçirir — her sayfanın kendi page.tsx'i değişmeden (hâlâ yalnız <Nav /> olarak kullanılır).
export async function Nav() {
  const session = await getOptionalMembership();
  const navSession: NavSession | null = session ? { email: session.user.email } : null;
  return <NavClient session={navSession} />;
}
