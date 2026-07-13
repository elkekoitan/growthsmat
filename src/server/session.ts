// SmartGrowth OS — oturum/DAL (Data Access Layer) yardımcıları.
// "use server" DEĞİL — bunlar Server Action olarak çağrılmaz, yalnız Server Component'ler
// ve gerçek Server Action'lar (src/server/auth.ts) tarafından import edilen düz async
// fonksiyonlardır (Next'in kendi authentication.md rehberindeki DAL deseni).
import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import { fromPrismaRole } from "@/lib/roles";

export const SESSION_COOKIE = "sg_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

/**
 * BUG DÜZELTMESİ (canlıda tespit edildi, 2026-07-13): `secure: NODE_ENV==="production"`
 * yanlıştı — Coolify/Traefik'teki bu deploy şu an yalnız düz HTTP üzerinden servis ediyor
 * (sslip.io alan adı için TLS sertifikası yok, HTTPS 503 dönüyor). Tarayıcı, `Secure`
 * bayraklı bir cookie'yi güvensiz (HTTP) bağlantı üzerinden SAKLAMAZ/GÖNDERMEZ — yani
 * oturum cookie'si sessizce kalıcı olmuyordu, her ziyaretçi bir sonraki istekte "çıkış
 * yapmış" gibi davranılıyordu (yalnız NODE_ENV'e değil, GERÇEK bağlantı protokolüne bak).
 */
async function isRequestSecure(): Promise<boolean> {
  const h = await headers();
  return h.get("x-forwarded-proto") === "https";
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  const secure = await isRequestSecure();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Oturum yoksa/süresi dolmuşsa /giris'e yönlendirir; varsa User döner. */
export async function requireUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) redirect("/giris");

  const db = getDb();
  const session = await db.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    await clearSessionCookie();
    redirect("/giris");
  }

  return session.user;
}

/**
 * Giriş yapmış kullanıcının aktif üyeliğini döner (workspaceId verilmezse ilk aktif
 * üyeliği kullanır — çoklu-workspace switcher ileride bunu bir cookie/parametre ile
 * daraltabilir). Üyelik yoksa /giris'e yönlendirir.
 */
export async function requireMembership(workspaceId?: string) {
  const user = await requireUser();
  const db = getDb();
  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      status: "aktif",
      ...(workspaceId ? { workspaceId } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/giris");

  return { user, membership: { ...membership, role: fromPrismaRole(membership.role) } };
}

/**
 * requireMembership()'in yönlendirmeyen hâli — herkese açık sayfalarda (örn. /pazar)
 * oturum yoksa `null` döner, ziyaretçi yine de sayfayı görebilir; yalnız kimlik gerektiren
 * bölümler (ilan aç, sipariş ver) koşullu render edilir.
 */
export async function getOptionalMembership() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = getDb();
  const session = await db.session.findUnique({ where: { sessionToken: token }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, status: "aktif" },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return null;

  return { user: session.user, membership: { ...membership, role: fromPrismaRole(membership.role) } };
}
