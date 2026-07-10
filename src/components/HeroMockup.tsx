import { Sprout, Sun, Droplet, ShieldCheck } from "./icons";

/** Hero'daki ürün önizlemesi — gerçek uygunluk sonucu kartını taklit eder. */
export function HeroMockup() {
  const factors = [
    { label: "İklim", score: 88 },
    { label: "Toprak", score: 62 },
    { label: "Su", score: 90 },
    { label: "Operasyon", score: 78 },
  ];
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        borderRadius: "var(--radius-bento)",
        maxWidth: 460,
        width: "100%",
      }}
    >
      {/* pencere çubuğu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-hair)",
          background: "var(--bg-surface-2)",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "#e5cf9f" }} />
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "#bcd8c4" }} />
        <span style={{ width: 10, height: 10, borderRadius: 99, background: "#d9ceb6" }} />
        <span className="font-mono" style={{ marginLeft: 8, fontSize: 11, color: "var(--text-low)" }}>
          smartgrowth.os / plan
        </span>
      </div>

      <div style={{ padding: 20 }}>
        {/* ürün başlık */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: "color-mix(in srgb, var(--primary) 12%, transparent)",
              color: "var(--primary)",
              fontSize: 24,
            }}
          >
            🍅
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Cherry Domates</div>
            <div style={{ fontSize: 12, color: "var(--text-low)" }}>Kompakt · balkon/saksı profili</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-mono" style={{ fontSize: 26, fontWeight: 600, color: "var(--primary)", lineHeight: 1 }}>
              82
            </div>
            <div style={{ fontSize: 10, color: "var(--text-low)" }}>uygunluk</div>
          </div>
        </div>

        {/* alt skorlar */}
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {factors.map((f) => (
            <div key={f.label} style={{ display: "grid", gridTemplateColumns: "64px 1fr 32px", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 12, color: "var(--text-mid)" }}>{f.label}</span>
              <span className="meter">
                <span style={{ width: `${f.score}%` }} />
              </span>
              <span className="font-mono" style={{ fontSize: 12, color: "var(--text-mid)", textAlign: "right" }}>
                {f.score}
              </span>
            </div>
          ))}
        </div>

        {/* güven satırı — uygunluktan ayrı */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--bg-surface-2)",
            marginBottom: 12,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-mid)" }}>
            <ShieldCheck size={15} /> Güven: <strong style={{ color: "var(--color-warning)" }}>Orta</strong>
          </span>
          <span style={{ fontSize: 11, color: "var(--text-low)" }}>pH ölçülmedi</span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className="chip"><Sun size={13} /> 6 sa güneş</span>
          <span className="chip"><Droplet size={13} /> Yüksek su</span>
          <span className="chip chip-ok"><Sprout size={13} /> Kanıt B</span>
        </div>
      </div>
    </div>
  );
}
