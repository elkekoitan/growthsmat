// Prisma 7 CLI yapılandırması (migrate/generate) — schema.prisma'da artık `url` yok,
// bağlantı bilgisi burada (yalnız CLI için) ve çalışma zamanında src/lib/db.ts'te
// @prisma/adapter-pg üzerinden ayrı ayrı okunur.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // "@/..." alias'ını src/'e çözmek için testlerdeki AYNI ESM loader hook'u yeniden
    // kullanılıyor (tests/alias-hooks.mjs, process.cwd()'e göre çözer — web/ kökünden
    // çalıştırıldığı sürece güvenle taşınabilir, test'e özgü bir varsayımı yok).
    seed: "node --experimental-strip-types --import ./tests/register-alias.mjs prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
