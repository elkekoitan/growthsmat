"use server";
// SmartGrowth OS — kayıt/giriş/çıkış Server Action'ları (Phase 0: minimal gerçek auth).
// Şifre hash: Node'un yerleşik crypto.scrypt'i (bcrypt gibi ek native-binary bağımlılık
// eklemeden — Prisma'nın kendi engine binary'si zaten Docker/Alpine için bir risk,
// ikinci bir native paket eklememek bilinçli bir tercih). Oturum: opak, veritabanında
// doğrulanan bir bearer token (JWT/imza sırrı yok) — bkz. src/server/session.ts.
// OAuth (Google/Apple, roadmap P02-02/03) kasıtlı olarak bu turun kapsamı DIŞINDA.

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { clearSessionCookie, setSessionCookie, SESSION_COOKIE, SESSION_TTL_MS } from "./session";
import { hashPassword, verifyPassword } from "./password";
import { cookies, headers } from "next/headers";
import { createRateLimiter, clientIpFromForwarded } from "@/lib/rateLimit";

export interface AuthFormState {
  error?: string;
}

// Brute-force koruması (tek konteyner deploy — bkz. Dockerfile; çok-replika gerekirse
// Redis'e taşınır). Mantık saf src/lib/rateLimit.ts'te (kayan pencere, testli).
//
// TASARIM KARARI (adversarial review sonrası, 2026-07-17) — per-HESAP sert kilidi
// BİLİNÇLİ OLARAK YOK. Kayan pencereli bir hesap kilidi, saldırganın kurbanın e-postasını
// bilerek trickle trafikle (pencere hiç boşalmaz) hesabı KALICI kilitlemesine yol açardı
// (targeted lockout DoS) — doğru şifre bile reddedilirdi. Bunun yerine:
//   - loginByIp: tek bir KAYNAĞIN (IP) deneme hızını kısıtlar. IP kilidi belirli bir
//     hesabı küresel kilitlemez; yalnız saldırganın kendi IP'sini geçici yavaşlatır.
//   - "yerel" (XFF yok/tanınamayan IP) İSTİSNADIR: bilinmeyen tek bir kovaya tüm istekleri
//     toplayıp küresel login kilidi yaratmasın (review MINOR).
//   - Doğru şifre HER ZAMAN geçer (sayaca yalnız BAŞARISIZ denemeler eklenir) — meşru
//     kullanıcı hiçbir koşulda kilitlenmez.
// Dağıtık (botnet) brute-force için CAPTCHA + paylaşımlı store gerekir — ertelenmiş
// (bkz. /panel "Canlıya çıkış").
const LOGIN_MAX_PER_IP = 30; // başarısız login denemesi / 15 dk / IP
const SIGNUP_MAX_PER_IP = 8; // kayıt / saat / IP
const loginByIp = createRateLimiter(15 * 60_000, LOGIN_MAX_PER_IP);
const signupByIp = createRateLimiter(60 * 60_000, SIGNUP_MAX_PER_IP);

async function clientIp(): Promise<string> {
  const h = await headers();
  return clientIpFromForwarded(h.get("x-forwarded-for"));
}

// Bilgi sızmayan genel mesaj: hesabın var olup olmadığını ELE VERMEZ.
const RATE_LIMITED_MSG = "Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar dene.";

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

async function startSession(userId: string): Promise<void> {
  const db = getDb();
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { sessionToken: token, userId, expiresAt } });
  await setSessionCookie(token, expiresAt);
}

export async function signUp(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email || !email.includes("@")) return { error: "Geçerli bir e-posta adresi girin." };
  if (password.length < 8) return { error: "Şifre en az 8 karakter olmalı." };

  // Hesap oluşturma spam'ine karşı IP başına sınır. allow() sınırı hem kontrol eder hem
  // (izin varsa) kaydeder; aşımda kaydetmez ve false döner. "yerel" (tanınamayan IP)
  // istisnadır — bilinmeyen kaynak küresel kayıt kilidi yaratmasın.
  const ip = await clientIp();
  if (ip !== "yerel" && !signupByIp.allow(`signup:${ip}`)) {
    return { error: RATE_LIMITED_MSG };
  }

  const db = getDb();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return { error: "Bu e-posta ile zaten bir hesap var." };

  const passwordHash = hashPassword(password);
  const workspaceName = name ? `${name} işletmesi` : "Yeni işletme";

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      memberships: {
        create: {
          role: "sahip",
          status: "aktif",
          workspace: { create: { name: workspaceName } },
        },
      },
    },
  });

  await startSession(user.id);
  // DÜRÜSTLÜK NOTU (2026-07-13 → 2026-07-15 güncellendi): önce /panel'e (dahili yol
  // haritası — kullanıcının işiyle alakasız), sonra /pazar'a yönlendiriyorduk. Kullanıcı
  // geri bildirimi "ne yapacak belli değil, kullanıcı kayboluyor" idi; artık ana üs
  // /bahcem — kullanıcının KENDİ ürünleri + "Sıradaki adımın: …" yönlendirme satırı.
  // Yeni hesapta bahçe boştur ve boş durum tek cümleyle Ürün Kâşifi'ne yönlendirir:
  // doğal onboarding. (Keşfet → yetiştir → sat omurgasının giriş kapısı.)
  redirect("/bahcem");
}

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Brute-force kapısı: yalnız IP-başına (tanınan IP için). Bu bir HESABI değil, saldırganın
  // KENDİ IP'sini geçici yavaşlatır — targeted lockout DoS yoktur (bkz. yukarıdaki tasarım
  // notu). "yerel" (tanınamayan IP) küresel kova oluşturmasın diye istisnadır.
  const ip = await clientIp();
  const ipKey = `login:${ip}`;
  if (ip !== "yerel" && loginByIp.countFor(ipKey) >= LOGIN_MAX_PER_IP) {
    return { error: RATE_LIMITED_MSG };
  }

  const db = getDb();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    // Yalnız BAŞARISIZ deneme IP sayacına eklenir; DOĞRU şifre hiçbir sayaca takılmaz —
    // meşru kullanıcı (bir saldırgan aynı IP'yi doldursa bile farklı IP'den) kilitlenmez.
    if (ip !== "yerel") loginByIp.allow(ipKey);
    return { error: "E-posta veya şifre hatalı." };
  }

  await startSession(user.id);
  // Girişte de ana üs /bahcem (bkz. signUp'taki not) — dönen kullanıcı kendi ürünlerini
  // ve sıradaki adımını görür; boş bahçe Ürün Kâşifi'ne yönlendirir.
  redirect("/bahcem");
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = getDb();
    await db.session.deleteMany({ where: { sessionToken: token } }).catch(() => undefined);
  }
  await clearSessionCookie();
  redirect("/giris");
}
