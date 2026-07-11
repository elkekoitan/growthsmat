"use client";

import { useMemo, useState } from "react";
import { computeDataQuality, GRADE_LABELS, type SiteProfile } from "@/lib/siteQuality";
import { RadialGauge, NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Check, X, ShieldCheck } from "@/components/icons";

const TODAY = "2026-07-10";

type FieldState = "yok" | "guncel" | "bayat";

function toSoilTest(state: FieldState): SiteProfile["soilTest"] {
  if (state === "yok") return undefined;
  return { ph: 6.4, ec: 1.1, organicMatterPct: 3.2, sampledAt: state === "bayat" ? "2025-04-01" : "2026-05-15" };
}

function toWaterTest(state: FieldState): SiteProfile["waterTest"] {
  if (state === "yok") return undefined;
  return { qualityOk: true, testedAt: state === "bayat" ? "2025-04-01" : "2026-05-15" };
}

const TOGGLE_OPTIONS: { value: FieldState; label: string }[] = [
  { value: "guncel", label: "Var, güncel" },
  { value: "bayat", label: "Var, 13+ ay bayat" },
  { value: "yok", label: "Yok" },
];

export function SiteQualityDemo() {
  const [soil, setSoil] = useState<FieldState>("guncel");
  const [water, setWater] = useState<FieldState>("guncel");
  const [sun, setSun] = useState(true);
  const [location, setLocation] = useState(true);

  const profile: SiteProfile = useMemo(
    () => ({
      id: "demo",
      name: "Demo Alan",
      areaM2: 24,
      sunHoursObserved: sun ? 6 : undefined,
      soilTest: toSoilTest(soil),
      waterTest: toWaterTest(water),
      exactLocationKnown: location,
    }),
    [soil, water, sun, location]
  );

  const result = useMemo(() => computeDataQuality(profile, TODAY), [profile]);
  const gaugeColor =
    result.grade === "yuksek" ? "var(--color-success)" : result.grade === "orta" ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Alan veri kalitesi
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Eksik veri ile <em style={{ fontStyle: "italic", color: "var(--primary)" }}>bayat veri</em> aynı şey değildir.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 600, margin: "0 auto" }} className="text-pretty">
            Skor tek bir sayıya sıkıştırılmaz — hangi alanın hiç olmadığı, hangisinin
            yenilenmesi gerektiği ayrı ayrı gösterilir.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Demo alanı düzenle" title="Alan profilini değiştir" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="sq-grid">
            <div style={{ display: "grid", gap: 16 }}>
              <FieldToggle label="Toprak testi" value={soil} onChange={setSoil} />
              <FieldToggle label="Su testi" value={water} onChange={setWater} />
              <label className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={sun} onChange={(e) => setSun(e.target.checked)} />
                <span>Güneş saati gözlemi girildi</span>
              </label>
              <label className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={location} onChange={(e) => setLocation(e.target.checked)} />
                <span>Tam konum girildi</span>
              </label>
            </div>

            <Reveal i={0} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <RadialGauge value={result.score} size={140} sub={GRADE_LABELS[result.grade]} color={gaugeColor} />
              <div style={{ width: "100%" }}>
                {result.issues.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-success)", fontSize: "var(--fs-sm)" }}>
                    <Check size={14} style={{ verticalAlign: -2 }} /> Eksik veya bayat veri yok
                  </p>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {result.issues.map((issue, i) => (
                      <div key={i} className={`chip ${issue.kind === "eksik" ? "chip-danger" : "chip-warn"}`} style={{ justifyContent: "flex-start" }}>
                        <X size={12} /> {issue.detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 800px) { .sq-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}

function FieldToggle({ label, value, onChange }: { label: string; value: FieldState; onChange: (v: FieldState) => void }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {TOGGLE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="chip"
            aria-pressed={value === opt.value}
            style={{
              cursor: "pointer",
              border: "none",
              background: value === opt.value ? "var(--primary)" : "var(--bg-surface-2)",
              color: value === opt.value ? "var(--primary-fg)" : "var(--text-mid)",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
