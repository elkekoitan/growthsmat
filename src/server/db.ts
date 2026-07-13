// SmartGrowth OS — Prisma singleton (yalnız src/server/** ve Server Action'lar için)
// src/lib/** SAF kalır — hiçbir lib dosyası bu modülü veya @prisma/client'ı import ETMEZ
// (bkz. eslint.config.mjs no-restricted-imports kuralı). Repository katmanı (src/server/
// repositories/*.ts) burayı çağırır, sonucu şekillendirir, sonra src/lib/*.ts'teki saf
// fonksiyona verir.
//
// Lazy singleton: modül import edildiğinde PrismaClient KURULMAZ — yalnız getDb()
// gerçekten çağrıldığında. Bu, DATABASE_URL yokken de `next build`'in statik sayfa
// render/analiz adımlarında patlamamasını garantiler (Server Action gövdeleri yalnız
// gerçek istek anında çalışır, build anında değil).

import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

let client: PrismaClient | undefined;

export function getDb(): PrismaClient {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL tanımlı değil — src/server/db.ts çalışma zamanında gerekir.");
  }
  const adapter = new PrismaPg({ connectionString });
  client = new PrismaClient({ adapter });
  return client;
}
