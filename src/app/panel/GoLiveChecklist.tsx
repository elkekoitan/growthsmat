// SmartGrowth OS — /panel "Canlıya çıkış" hazırlık bölümü (Server Component).
// İşletme sahibine, tam canlı için sağlaması gereken hesap/anahtarları dürüstçe listeler:
// her maddenin GERÇEK durumu (env'den okunur, server/goLive.ts), ne işe yaradığı,
// nasıl sağlanacağı ve nereden alınacağı (harici link). İnteraktivite yalnız yerel
// <details> ile — client JS gerekmez.
import { Check, ShieldCheck, ArrowRight } from "@/components/icons";
import { Reveal } from "@/components/ui";
import type { GoLiveItem, GoLiveStatus } from "@/lib/goLive";

const STATUS_META: Record<GoLiveStatus, { label: string; chip: string }> = {
  hazir: { label: "Hazır", chip: "chip-ok" },
  bekleniyor: { label: "Senden bekleniyor", chip: "chip-warn" },
  opsiyonel: { label: "Opsiyonel", chip: "chip-info" },
};

function GoLiveCard({ item, i }: { item: GoLiveItem; i: number }) {
  const meta = STATUS_META[item.status];
  return (
    <Reveal as="article" i={i} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <h3 style={{ fontSize: "var(--fs-base)", margin: 0, lineHeight: 1.3 }}>{item.title}</h3>
        <span className={`chip ${meta.chip}`} style={{ flexShrink: 0 }}>
          {item.status === "hazir" ? <Check size={12} /> : null}
          {meta.label}
        </span>
      </div>

      <p style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>{item.why}</p>

      <p style={{ margin: 0, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>{item.statusNote}</p>

      {item.steps.length > 0 && (
        <details style={{ marginTop: 2 }}>
          <summary style={{ cursor: "pointer", fontSize: "var(--fs-sm)", fontWeight: 600, color: "var(--primary)" }}>
            Nasıl yapılır ({item.steps.length} adım)
          </summary>
          <ol style={{ margin: "10px 0 0", paddingLeft: 20, display: "grid", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
            {item.steps.map((s, si) => (
              <li key={si}>{s}</li>
            ))}
          </ol>
        </details>
      )}

      {item.links.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "auto", paddingTop: 4 }}>
          {item.links.map((l) => (
            <a
              key={l.url}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              {l.label} <ArrowRight size={13} />
            </a>
          ))}
        </div>
      )}
    </Reveal>
  );
}

export function GoLiveChecklist({
  items,
  summary,
}: {
  items: GoLiveItem[];
  summary: { hazir: number; bekleniyor: number; opsiyonel: number; toplam: number };
}) {
  return (
    <section className="section">
      <div className="container-x">
        <div className="eyebrow">
          <ShieldCheck size={13} /> Canlıya çıkış
        </div>
        <h2 style={{ margin: "10px 0 6px", fontSize: "clamp(1.5rem, 3vw, 2rem)", lineHeight: 1.15 }}>
          Tam canlı için gerekenler
        </h2>
        <p style={{ margin: "0 0 16px", color: "var(--text-mid)", maxWidth: 640 }}>
          Aşağıdaki maddeler senin sağlaman gereken hesap ve anahtarları listeler. Kod tarafı her biri
          için hazır — işaretlediğin anahtarı eklediğinde ilgili özellik anında aktifleşir. Bu durumlar
          canlı ortamdan gerçek zamanlı okunur; hiçbir gizli değer burada gösterilmez.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          <span className="chip chip-ok">
            <Check size={12} /> {summary.hazir} hazır
          </span>
          <span className="chip chip-warn">{summary.bekleniyor} senden bekleniyor</span>
          <span className="chip chip-info">{summary.opsiyonel} opsiyonel</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {items.map((item, i) => (
            <GoLiveCard key={item.id} item={item} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
