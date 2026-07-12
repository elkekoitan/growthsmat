// Araştırma kütüphanesindeki gerçek, lisanslı ürün fotoğraflarını (assets/crop-photos/)
// web/public/photos/crops/'a optimize ederek kopyalar ve src/data/photoCredits.ts'i üretir.
// Çalıştır: npm run import-photos
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const photosSrcRoot = join(root, "..", "assets", "crop-photos");
const outDir = join(root, "public", "photos", "crops");
const dataOut = join(root, "src", "data", "photoCredits.ts");

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

// İki üründe tam eşleşme yok — bu README'de zaten açıkça belgeli (biber-carliston: Cubanelle
// biberi analog; kabak-sakiz: yuvarlak kabak analog). Sahte kesinlik vermemek için işaretle.
const APPROXIMATE_CROP_IDS = new Set(["biber-carliston", "kabak-sakiz"]);

await mkdir(outDir, { recursive: true });

const credits = [];
for (const row of rows) {
  if (row.role === "primary") {
    const src = join(photosSrcRoot, row.crop_id, row.filename);
    const dest = join(outDir, `${row.crop_id}.jpg`);
    await sharp(src).resize({ width: 640, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(dest);
  }
  credits.push({
    cropId: row.crop_id,
    role: row.role,
    filename: row.filename,
    creator: row.creator,
    sourceUrl: row.source_url,
    license: row.license,
    attributionText: row.attribution_text,
    isApproximation: APPROXIMATE_CROP_IDS.has(row.crop_id),
  });
}

const tsContent = `// SmartGrowth OS — Ürün fotoğrafı lisans kataloğu (PRD P04-14 "Görsel lisans kataloğu")
// Kaynak: assets/crop-photos/index.csv (Wikimedia Commons, CC0/CC BY/CC BY-SA/kamu malı;
// tamamı ticari kullanıma açık, checksum doğrulanmış). Otomatik üretildi:
// npm run import-photos (scripts/import-crop-photos.mjs) — elle düzenleme YAPMA.
//
// isApproximation=true olan 2 üründe (biber-carliston, kabak-sakiz) birebir çeşit fotoğrafı
// bulunamadı — yakın akraba/analog görsel kullanıldı (sahte kesinlik yok: bu açıkça işaretli
// ve UI'da gösterilmeli).

export interface PhotoCredit {
  cropId: string;
  role: "primary" | "secondary";
  filename: string;
  creator: string;
  sourceUrl: string;
  license: string;
  attributionText: string;
  isApproximation: boolean;
}

export const PHOTO_CREDITS: PhotoCredit[] = ${JSON.stringify(credits, null, 2)};

/** Bir ürünün birincil (kart/detay) görselinin kredi bilgisini döner. */
export function primaryCredit(cropId: string): PhotoCredit | undefined {
  return PHOTO_CREDITS.find((c) => c.cropId === cropId && c.role === "primary");
}

/** Bir ürünün /photos/crops/ altındaki birincil görsel yolu (varsa). */
export function cropPhotoPath(cropId: string): string | undefined {
  return primaryCredit(cropId) ? \`/photos/crops/\${cropId}.jpg\` : undefined;
}
`;

await writeFile(dataOut, tsContent, "utf8");

console.log(`${rows.filter((r) => r.role === "primary").length} birincil fotoğraf kopyalandı → ${outDir}`);
console.log(`${credits.length} kredi kaydı yazıldı → ${dataOut}`);
