// Araştırma kütüphanesindeki gerçek, lisanslı mikro filiz fotoğraflarını
// (assets/microgreen-photos/) web/public/photos/microgreens/'e optimize ederek kopyalar ve
// src/data/microgreenPhotoCredits.ts'i üretir. Çalıştır: npm run import-microgreen-photos
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const photosSrcRoot = join(root, "..", "assets", "microgreen-photos");
const outDir = join(root, "public", "photos", "microgreens");
const dataOut = join(root, "src", "data", "microgreenPhotoCredits.ts");

function parseCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

const csvText = await readFile(join(photosSrcRoot, "index.csv"), "utf8");
const lines = csvText.split(/\r?\n/).filter(Boolean);
const header = parseCsvLine(lines[0]);
const rows = lines.slice(1).map((line) => {
  const cells = parseCsvLine(line);
  const row = {};
  header.forEach((h, i) => (row[h] = cells[i] ?? ""));
  return row;
});

await mkdir(outDir, { recursive: true });

const credits = [];
for (const row of rows) {
  if (row.role === "primary") {
    const src = join(photosSrcRoot, row.microgreen_id, row.filename);
    const dest = join(outDir, `${row.microgreen_id}.jpg`);
    await sharp(src).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(dest);
  }
  credits.push({
    microgreenId: row.microgreen_id,
    role: row.role,
    filename: row.filename,
    speciesLabel: row.species_label,
    growthStageOrSubject: row.growth_stage_or_subject,
    creator: row.creator,
    sourceUrl: row.source_url,
    license: row.license,
    attributionText: row.attribution_text,
    checksumSha256: row.checksum_sha256,
    checksumVerified: row.checksum_verified === "True",
  });
}

const primaryCredits = credits.filter((c) => c.role === "primary");

const tsContent = `// SmartGrowth OS — Mikro filiz fotoğrafı lisans kataloğu (crop-photos'un mikro filiz eşleniği)
// Kaynak: assets/microgreen-photos/index.csv (Wikimedia Commons/Flickr, CC BY/CC BY-SA;
// tamamı ticari kullanıma açık). Otomatik üretildi:
// npm run import-microgreen-photos (scripts/import-microgreen-photos.mjs) — elle düzenleme YAPMA.
//
// DÜRÜSTLÜK NOTU: checksumSha256/checksumVerified kaynak CSV'de vardı ama önceden buraya
// taşınmıyordu (dosya başlığı "checksum doğrulanmış" diyordu, hiçbir yerde saklanmıyordu —
// dokümantasyon incelemesinde bulundu, photoCredits.ts ile aynı düzeltme uygulandı).

export interface MicrogreenPhotoCredit {
  microgreenId: string;
  role: "primary" | "secondary";
  filename: string;
  speciesLabel: string;
  growthStageOrSubject: string;
  creator: string;
  sourceUrl: string;
  license: string;
  attributionText: string;
  checksumSha256: string;
  checksumVerified: boolean;
}

export const MICROGREEN_PHOTO_CREDITS: MicrogreenPhotoCredit[] = ${JSON.stringify(primaryCredits, null, 2)};

/** Bir mikro filizin birincil (kart/detay) görselinin kredi bilgisini döner. */
export function primaryMicrogreenCredit(microgreenId: string): MicrogreenPhotoCredit | undefined {
  return MICROGREEN_PHOTO_CREDITS.find((c) => c.microgreenId === microgreenId && c.role === "primary");
}

/** Bir mikro filizin /photos/microgreens/ altındaki birincil görsel yolu (varsa). */
export function microgreenPhotoPath(microgreenId: string): string | undefined {
  return primaryMicrogreenCredit(microgreenId) ? \`/photos/microgreens/\${microgreenId}.jpg\` : undefined;
}
`;

await writeFile(dataOut, tsContent, "utf8");

console.log(`${rows.filter((r) => r.role === "primary").length} birincil fotoğraf kopyalandı → ${outDir}`);
console.log(`${primaryCredits.length} kredi kaydı yazıldı → ${dataOut}`);
