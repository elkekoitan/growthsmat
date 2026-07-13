import { headers } from "next/headers";
import QRCode from "qrcode";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
import { Traceability } from "./Traceability";
import { requireMembership } from "@/server/session";
import { listOrSeedLots } from "@/server/repositories/lots";
import { can } from "@/lib/roles";

export const metadata = {
  title: "Lot İzlenebilirlik",
  description:
    "Tohumdan sevkiyata bir adım geri / bir adım ileri lot izi, mass balance doğrulaması ve geri çağırma simülasyonu.",
};

export const dynamic = "force-dynamic";

export default async function IzlenebilirlikPage() {
  const { membership } = await requireMembership();
  const lots = await listOrSeedLots(membership.workspaceId);
  const canCreateLot = can(membership.role, "lot.create");

  // Gerçek istek protokolünü/host'unu oku (src/server/session.ts'teki isRequestSecure()
  // ile AYNI teknik) — Coolify/Traefik arkasında NODE_ENV'e ya da sabit bir alan adına
  // güvenmek yanlış olurdu (bkz. o dosyadaki 2026-07-13 bug-fix notu).
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const publicOrigin = `${proto}://${host}`;

  const lotQrSvgByDbId: Record<string, string> = {};
  for (const lot of lots) {
    if (!lot.dbId) continue;
    lotQrSvgByDbId[lot.dbId] = await QRCode.toString(`${publicOrigin}/lot/${lot.dbId}`, {
      type: "svg",
      margin: 1,
      width: 120,
    });
  }

  return (
    <RevealProvider>
      <Nav />
      <main>
        <Traceability
          initialLots={lots}
          canCreateLot={canCreateLot}
          publicOrigin={publicOrigin}
          lotQrSvgByDbId={lotQrSvgByDbId}
        />
      </main>
      <Footer />
    </RevealProvider>
  );
}
