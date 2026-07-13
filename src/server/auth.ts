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
import { cookies } from "next/headers";

export interface AuthFormState {
  error?: string;
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, key] = stored.split(":");
  if (!salt || !key) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, "hex");
  if (keyBuffer.length !== derivedKey.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

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
  redirect("/panel");
}

export async function signIn(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const db = getDb();
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return { error: "E-posta veya şifre hatalı." };
  }

  await startSession(user.id);
  redirect("/panel");
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
