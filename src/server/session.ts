// SmartGrowth OS — oturum/DAL (Data Access Layer) yardımcıları.
// "use server" DEĞİL — bunlar Server Action olarak çağrılmaz, yalnız Server Component'ler
// ve gerçek Server Action'lar (src/server/auth.ts) tarafından import edilen düz async
// fonksiyonlardır (Next'in kendi authentication.md rehberindeki DAL deseni).
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "./db";

export const SESSION_COOKIE = "sg_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

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

  return { user, membership };
}
