// SmartGrowth OS — şifre hash yardımcıları (src/server/auth.ts VE prisma/seed.ts ortak kullanır).
// Node'un yerleşik crypto.scrypt'i — bcrypt gibi ek native-binary bağımlılık eklemeden
// (Prisma'nın kendi engine binary'si zaten Docker/Alpine için bir risk, ikinci bir native
// paket eklememek bilinçli bir tercih). "use server" DEĞİL — düz yardımcı fonksiyonlar,
// bir CLI/seed script bağlamından da import edilebilir olması gerekiyor.
import crypto from "node:crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
