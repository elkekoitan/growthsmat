import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { requireMembership } from "@/server/session";
import { evaluateWorkspaceFlags } from "@/server/repositories/featureFlags";
import { listOutgoingInvites, listIncomingInvites } from "@/server/repositories/invites";
import { RolesMatrix } from "./RolesMatrix";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rol ve İzin Matrisi",
  description:
    "En az ayrıcalık ilkesiyle 8 rol × 18 izin matrisi ve gerçek oturumunun tenant üyeliği.",
};

export default async function RollerPage() {
  const { user, membership } = await requireMembership();
  const [flags, outgoingInvites, incomingInvites] = await Promise.all([
    evaluateWorkspaceFlags(membership.workspaceId),
    listOutgoingInvites(membership.workspaceId),
    listIncomingInvites(user.email),
  ]);

  return (
    <RevealProvider>
      <Nav />
      <main>
        <RolesMatrix
          email={user.email}
          role={membership.role}
          workspaceId={membership.workspaceId}
          flags={flags}
          outgoingInvites={outgoingInvites}
          incomingInvites={incomingInvites}
        />
      </main>
      <Footer />
    </RevealProvider>
  );
}
