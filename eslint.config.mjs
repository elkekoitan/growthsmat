import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // src/lib/** saf iş mantığı katmanıdır — hiçbir DB/I/O importu yapamaz. Bu, motor
    // fonksiyonlarının 300+ testte olduğu gibi saf/deterministik/DB-bağımsız kalmasını
    // ZORUNLU kılar (bkz. Postgres/Prisma göç planı §2.9 — repository katmanı bu kuralları
    // çağırır, tersi asla olmaz).
    files: ["src/lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@prisma/client", "@prisma/adapter-pg"], message: "src/lib/** saf kalmalı — DB erişimi src/server/** üzerinden yapılır." },
            { group: ["@/server/*", "../server/*", "./server/*"], message: "src/lib/** src/server/** import edemez — bağımlılık yönü tersine dönemez." },
            { group: ["**/generated/prisma/*", "**/generated/prisma"], message: "src/lib/** üretilen Prisma client'ı doğrudan import edemez." },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
