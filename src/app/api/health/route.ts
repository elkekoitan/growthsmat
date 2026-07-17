// SmartGrowth OS — sağlık kontrolü endpoint'i (/api/health).
// Coolify/Traefik'in konteynerin GERÇEKTEN sağlıklı olduğunu (uygulama AYAKTA + DB ERİŞİLEBİLİR)
// anlaması için hafif bir uç. Rolling deploy sırasında yeni konteyner ancak burası 200
// dönünce trafiğe alınmalı — böylece DB'ye bağlanamayan bir sürüm canlıya çıkmaz.
//
// DÜRÜSTLÜK: yalnız gerçek bir DB sorgusu (SELECT 1) başarılıysa ok:true döner; DB
// erişilemezse 503 döner (yalan "healthy" yok). Gizli değer sızdırmaz — yalnız durum.
import { getDb } from "@/server/db";

// Asla önbelleğe alınmaz; her istekte gerçek DB durumu ölçülür.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    // Prisma raw sorgu: en hafif canlılık kontrolü (tablo/şema gerektirmez).
    await getDb().$queryRaw`SELECT 1`;
    return Response.json({ ok: true, db: "up" }, { status: 200 });
  } catch {
    // Hata detayı istemciye SIZDIRILMAZ; yalnız durum sinyali.
    return Response.json({ ok: false, db: "down" }, { status: 503 });
  }
}
