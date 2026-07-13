// SmartGrowth OS — oturum/DAL (Data Access Layer) yardımcıları.
// "use server" DEĞİL — bunlar Server Action olarak çağrılmaz, yalnız Server Component'ler
// ve gerçek Server Action'lar (src/server/auth.ts) tarafından import edilen düz async
// fonksiyonlardır (Next'in kendi authentication.md rehberindeki DAL deseni).
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";
import type { Role as AppRole } from "@/lib/roles";
import type { Role as PrismaRole } from "../../generated/prisma/enums";

export const SESSION_COOKIE = "sg_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

// DÜRÜSTLÜK/DOĞRULUK NOTU: Prisma'nın `@map` direktifi yalnız Postgres'teki fiziksel enum
// değerini değiştirir ("saha-calisani") — üretilen TypeScript/JS istemci tarafı hâlâ şema
// TANIMLAYICISINI kullanır ("saha_calisani", alt çizgili). Yani Membership.role DEĞERİ
// otomatik olarak @/lib/roles'teki Role tipiyle aynı DEĞİL — burada açıkça çevrilmesi
// gerekiyor. (Önceki bir oturumda bunun otomatik eşleştiğini varsaymak YANLIŞTI.)
const PRISMA_ROLE_TO_APP_ROLE: Record<PrismaRole, AppRole> = {
  sahip: "sahip",
  yonetici: "yonetici",
  planlayici: "planlayici",
  saha_calisani: "saha-calisani",
  kalite: "kalite",
  satis: "satis",
  goruntuleyici: "goruntuleyici",
  uzman: "uzman",
};

function toAppRole(role: PrismaRole): AppRole {
  return PRISMA_ROLE_TO_APP_ROLE[role];
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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

  return { user, membership: { ...membership, role: toAppRole(membership.role) } };
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

  return { user: session.user, membership: { ...membership, role: toAppRole(membership.role) } };
}
