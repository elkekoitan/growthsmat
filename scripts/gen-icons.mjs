// Tek master SVG'den tüm ikon boyutlarını üretir (PWA + favicon + apple-touch).
// Çalıştır: npm run icons
import sharp from "sharp";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const brand = join(root, "public", "brand");
const outDir = join(root, "public", "icons");

const master = await readFile(join(brand, "icon-master.svg"));
const maskable = await readFile(join(brand, "icon-maskable.svg"));

await mkdir(outDir, { recursive: true });

const jobs = [
  { src: master, size: 192, name: "icon-192.png" },
  { src: master, size: 512, name: "icon-512.png" },
  { src: maskable, size: 192, name: "icon-192-maskable.png" },
  { src: maskable, size: 512, name: "icon-512-maskable.png" },
  { src: master, size: 180, name: "apple-touch-icon.png" },
  { src: master, size: 32, name: "favicon-32.png" },
  { src: master, size: 16, name: "favicon-16.png" },
];

for (const job of jobs) {
  await sharp(job.src)
    .resize(job.size, job.size)
    .png()
    .toFile(join(outDir, job.name));
  console.log(`✓ ${job.name} (${job.size}px)`);
}

// favicon.ico (32px) → app dizinine
await sharp(master).resize(32, 32).png().toFile(join(root, "src", "app", "icon.png"));
// apple-touch app dizinine de
await sharp(master).resize(180, 180).png().toFile(join(root, "src", "app", "apple-icon.png"));

console.log("Tüm ikonlar üretildi → public/icons + src/app");
