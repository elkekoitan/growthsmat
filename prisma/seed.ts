// SmartGrowth OS — demo hesap seed script'i (rol testleri için).
// Çalıştır: npx prisma db seed (veya npm run db:seed)
//
// AMAÇ: Phase 1'de persona-switcher'lar (RolesMatrix/ExpertConsult/CurationConsole) gerçek
// oturuma bağlandı — artık tek gerçek hesap (role: sahip, TÜM izinlere sahip) dışında farklı
// rollerin (kalite/uzman/satis) davranışını görmenin tek dürüst yolu GERÇEK, ayrı hesaplarla
// giriş yapmak. Bu script öyle birkaç demo hesap oluşturur.
//
// GÜVENLİK KISITI: hiçbir gerçek/sabit şifre kaynak koduna GÖMÜLMEZ. Her çalıştırmada
// (yalnız hesap ilk kez oluşturuluyorsa) rastgele bir şifre üretilir ve YALNIZ bu çalıştırma
// sırasında konsola yazdırılır — asla dosyaya kaydedilmez, asla commit edilmez.
import crypto from "node:crypto";
import { getDb } from "@/server/db";
import { hashPassword } from "@/server/password";
import { toPrismaRole, type Role } from "@/lib/roles";
import type { Role as PrismaRole } from "../generated/prisma/enums";

interface DemoAccount {
  email: string;
  role: Role;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { email: "demo-kalite@smartgrowth.local", role: "kalite" },
  { email: "demo-uzman@smartgrowth.local", role: "uzman" },
  { email: "demo-satis@smartgrowth.local", role: "satis" },
];

const DEMO_WORKSPACE_NAME = "SmartGrowth Demo İşletmesi";

function generateRandomPassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

async function main() {
  const db = getDb();

  let workspace = await db.workspace.findFirst({ where: { name: DEMO_WORKSPACE_NAME } });
  if (!workspace) {
    workspace = await db.workspace.create({ data: { name: DEMO_WORKSPACE_NAME } });
    console.log(`Oluşturuldu: workspace "${DEMO_WORKSPACE_NAME}" (${workspace.id})`);
  }

  for (const account of DEMO_ACCOUNTS) {
    const existing = await db.user.findUnique({ where: { email: account.email } });

    if (existing) {
      console.log(`Atlandı (zaten var, şifre DEĞİŞTİRİLMEDİ): ${account.email}`);
      const membership = await db.membership.findFirst({
        where: { userId: existing.id, workspaceId: workspace.id },
      });
      if (!membership) {
        await db.membership.create({
          data: { userId: existing.id, workspaceId: workspace.id, role: toPrismaRole(account.role) as PrismaRole, status: "aktif" },
        });
        console.log(`  → eksik üyelik eklendi (${account.role})`);
      }
      continue;
    }

    const plaintextPassword = generateRandomPassword();
    const user = await db.user.create({
      data: {
        email: account.email,
        passwordHash: hashPassword(plaintextPassword),
        memberships: {
          create: { workspaceId: workspace.id, role: toPrismaRole(account.role) as PrismaRole, status: "aktif" },
        },
      },
    });

    console.log(`Oluşturuldu: ${user.email} (rol: ${account.role})`);
    console.log(`  şifre (YALNIZ BU ÇALIŞTIRMADA gösterilir, hiçbir yerde saklanmadı): ${plaintextPassword}`);
  }

  console.log("\nSeed tamamlandı.");
}

main().catch((err) => {
  console.error("Seed başarısız:", err);
  process.exitCode = 1;
});
