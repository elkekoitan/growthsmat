import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { RolesMatrix } from "./RolesMatrix";

export const metadata = {
  title: "Rol ve İzin Matrisi",
  description:
    "En az ayrıcalık ilkesiyle 8 rol × 18 izin matrisi ve gerçek oturumunun tenant üyeliği.",
};

export default async function RollerPage() {
  const { user, membership } = await requireMembership();

  return (
    <RevealProvider>
      <Nav />
      <main>
        <RolesMatrix email={user.email} role={membership.role} workspaceId={membership.workspaceId} />
      </main>
      <Footer />
    </RevealProvider>
  );
}
