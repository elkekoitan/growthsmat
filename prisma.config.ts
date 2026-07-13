// Prisma 7 CLI yapılandırması (migrate/generate) — schema.prisma'da artık `url` yok,
// bağlantı bilgisi burada (yalnız CLI için) ve çalışma zamanında src/lib/db.ts'te
// @prisma/adapter-pg üzerinden ayrı ayrı okunur.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
