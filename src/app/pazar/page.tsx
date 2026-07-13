import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Market } from "./Market";
import { getOptionalMembership } from "@/server/session";
import { listActiveListings, listMyListings } from "@/server/repositories/listings";
import { listMyOrdersAsBuyer, listOrdersForListing } from "@/server/repositories/orders";
import { listCertificates, listPendingCertificates, listRevocableCertificates } from "@/server/repositories/certificates";
import { can } from "@/lib/roles";

export const metadata = {
  title: "Pazar ve Ticaret Merkezi",
  description:
    "Yerel vitrin, restoran aboneliği, CSA kutusu ve Etsy'yi tek merkezden yönet — ücretler şeffaf, organik iddia sertifika olmadan yayınlanmaz.",
};

export const dynamic = "force-dynamic";

export default async function PazarPage() {
  const session = await getOptionalMembership();
  const realListings = await listActiveListings();

  let myListings: Awaited<ReturnType<typeof listMyListings>> = [];
  let myOrders: Awaited<ReturnType<typeof listMyOrdersAsBuyer>> = [];
  let incomingOrdersByListing: Record<string, Awaited<ReturnType<typeof listOrdersForListing>>> = {};
  let myCertificates: Awaited<ReturnType<typeof listCertificates>> = [];
  let pendingCertificates: Awaited<ReturnType<typeof listPendingCertificates>> = [];
  let revocableCertificates: Awaited<ReturnType<typeof listRevocableCertificates>> = [];

  if (session) {
    myListings = await listMyListings(session.membership.workspaceId);
    myOrders = await listMyOrdersAsBuyer(session.membership.workspaceId);
    const ordersPerListing = await Promise.all(myListings.map((l) => listOrdersForListing(l.id)));
    incomingOrdersByListing = Object.fromEntries(myListings.map((l, i) => [l.id, ordersPerListing[i]]));
    myCertificates = await listCertificates(session.membership.workspaceId);
    // Sertifika inceleme kuyruğu platform-geneli — yalnız compliance.review izinli
    // rol görebilir (bkz. src/lib/certificateReview.ts: kendi workspace'iyle sınırlı
    // olsaydı, "sahip" kendi sertifikasını onaylayabilir, kendi-kendini-doğrulama
    // açığı yeniden açılırdı).
    if (can(session.membership.role, "compliance.review")) {
      pendingCertificates = await listPendingCertificates(session.membership.workspaceId);
      revocableCertificates = await listRevocableCertificates(session.membership.workspaceId);
    }
  }

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Market
          session={session ? { role: session.membership.role, workspaceId: session.membership.workspaceId } : null}
          realListings={realListings}
          myListings={myListings}
          myOrders={myOrders}
          incomingOrdersByListing={incomingOrdersByListing}
          myCertificates={myCertificates}
          pendingCertificates={pendingCertificates}
          revocableCertificates={revocableCertificates}
        />
      </main>
      <Footer />
    </RevealProvider>
  );
}
