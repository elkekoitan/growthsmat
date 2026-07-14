// SmartGrowth OS — /panel işletme özeti (gerçek workspace verisi, oturum-korumalı).
// Server Component: interaktivite yok, yalnız Link'ler + repolardan gelen gerçek sayılar.
// DÜRÜSTLÜK NOTU: buradaki HER sayı src/server/repositories/{tasks,lots,listings,orders}.ts'ten
// gelir (bkz. panel/page.tsx aggregate hesabı). Hiçbir değer uydurulmaz; 0 ise dürüstçe 0 gösterilir.
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/ui";

export interface WorkspaceSummaryData {
  tasksToday: number;
  tasksOverdue: number;
  activeLots: number;
  activeListings: number;
  openBuyerOrders: number;
  pendingIncomingOrders: number;
}

/** Tek KPI kartı — büyük mono sayı + etiket + "görüntüle" alt linki; tüm kart tıklanabilir. */
function SummaryCard({
  label,
  value,
  href,
  i,
  overdue,
}: {
  label: string;
  value: number;
  href: string;
  i: number;
  overdue?: number;
}) {
  return (
    <Reveal
      as="article"
      i={i}
      className="card"
      style={{ padding: 18, position: "relative", display: "flex", flexDirection: "column", gap: 12 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <span
          className="font-mono"
          style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-low)" }}
        >
          {label}
        </span>
        {overdue !== undefined && overdue > 0 && (
          <span className="chip chip-danger" style={{ fontSize: 11 }}>
            {overdue} gecikmiş
          </span>
        )}
      </div>
      <span
        className="font-mono"
        style={{ fontSize: 34, fontWeight: 600, lineHeight: 1, color: "var(--text-hi)" }}
      >
        {value}
      </span>
      <Link
        href={href}
        className="font-mono"
        style={{
          fontSize: 12,
          color: "var(--text-mid)",
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginTop: "auto",
        }}
      >
        görüntüle <ArrowRight size={13} />
      </Link>
    </Reveal>
  );
}

export function WorkspaceSummary({
  session,
  summary,
}: {
  session: { email: string } | null;
  summary: WorkspaceSummaryData | null;
}) {
  // Oturum yok → gerçek sayı gösterme, yalnız giriş çağrısı. Roadmap/Dashboard yine altta render olur.
  if (!session || !summary) {
    return (
      <section className="section" style={{ paddingBottom: 0 }}>
        <div className="container-x">
          <div className="card" style={{ padding: 22, display: "grid", gap: 14, maxWidth: 560 }}>
            <div>
              <div className="eyebrow">İşletme panom</div>
              <p style={{ margin: "8px 0 0", color: "var(--text-mid)", maxWidth: 460 }}>
                İşletme özetini görmek için giriş yap — bugünkü görevlerin, aktif lotların,
                ilanların ve siparişlerin tek bakışta burada toplanır.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
              <Link href="/giris" className="btn btn-primary btn-sm">
                Giriş yap
              </Link>
              <Link href="/kayit" style={{ fontSize: 14, color: "var(--text-mid)" }}>
                Ücretsiz hesap oluştur
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const allZero =
    summary.tasksToday === 0 &&
    summary.tasksOverdue === 0 &&
    summary.activeLots === 0 &&
    summary.activeListings === 0 &&
    summary.openBuyerOrders === 0 &&
    summary.pendingIncomingOrders === 0;

  return (
    <section className="section" style={{ paddingBottom: 0 }}>
      <div className="container-x">
        <div className="eyebrow">İşletme panom</div>
        <h2 style={{ margin: "10px 0 6px", fontSize: "clamp(1.5rem, 3vw, 2rem)", lineHeight: 1.15 }}>
          Bugünkü durum, {session.email}
        </h2>
        <p style={{ margin: "0 0 22px", color: "var(--text-mid)", maxWidth: 620 }}>
          İşletmenin gerçek verisinden derlenen anlık özet — her sayı tıklayınca ilgili ekrana götürür.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          <SummaryCard label="Bugünkü görev" value={summary.tasksToday} href="/gorevler" i={0} overdue={summary.tasksOverdue} />
          <SummaryCard label="Aktif lot" value={summary.activeLots} href="/izlenebilirlik" i={1} />
          <SummaryCard label="Aktif ilanım" value={summary.activeListings} href="/pazar" i={2} />
          <SummaryCard label="Açık siparişim" value={summary.openBuyerOrders} href="/pazar" i={3} />
          <SummaryCard label="Bekleyen gelen sipariş" value={summary.pendingIncomingOrders} href="/pazar" i={4} />
        </div>

        {allZero && (
          <p style={{ margin: "16px 0 0", fontSize: 14, color: "var(--text-low)" }}>
            Henüz veri yok — bir plan veya ilan oluşturarak başla.
          </p>
        )}

        <p style={{ margin: "16px 0 0", fontSize: 13, color: "var(--text-low)" }}>
          Bu özet zamanla gelişecek tam bir operasyon panosunun ilk adımıdır.
        </p>
      </div>
    </section>
  );
}
