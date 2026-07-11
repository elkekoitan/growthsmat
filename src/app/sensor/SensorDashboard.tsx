"use client";

import { useMemo, useState } from "react";
import {
  DEVICES,
  SENSOR_TYPE_LABELS,
  flagAnomalies,
  evaluateAlertRule,
  type Reading,
  type AlertRule,
} from "@/lib/sensors";
import { Sparkline, NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Check, X, ShieldCheck, Thermometer, Droplet } from "@/components/icons";

// Sabit, tekrarlanabilir demo okuma serileri — her sayfa yüklemesinde aynı senaryoyu gösterir.
const DEMO_READINGS: Record<string, Reading[]> = {
  "SEN-T01": [22, 23, 24, 25, 55, 24, 25, 26, 32, 33, 34, 33].map((v, i) => ({
    deviceId: "SEN-T01",
    value: v,
    timestamp: `2026-07-10T${String(8 + i).padStart(2, "0")}:00:00Z`,
  })),
  "SEN-H01": [64, 66, 65, 68, 67, 65, 66, 64, 65, 66].map((v, i) => ({
    deviceId: "SEN-H01",
    value: v,
    timestamp: `2026-07-10T${String(8 + i).padStart(2, "0")}:00:00Z`,
  })),
  "SEN-SM01": [38, 35, 32, 29, 26, 23, 20, 18, 17, 16].map((v, i) => ({
    deviceId: "SEN-SM01",
    value: v,
    timestamp: `2026-07-10T${String(8 + i).padStart(2, "0")}:00:00Z`,
  })),
};

const DEFAULT_RULES: Record<string, AlertRule> = {
  "SEN-T01": { id: "r-temp", deviceId: "SEN-T01", comparator: ">", threshold: 30, minConsecutive: 2, label: "Yüksek sıcaklık" },
  "SEN-H01": { id: "r-hum", deviceId: "SEN-H01", comparator: ">", threshold: 80, minConsecutive: 2, label: "Aşırı nem" },
  "SEN-SM01": { id: "r-soil", deviceId: "SEN-SM01", comparator: "<", threshold: 20, minConsecutive: 3, label: "Düşük toprak nemi" },
};

export function SensorDashboard() {
  const [selected, setSelected] = useState(DEVICES[0].id);
  const device = DEVICES.find((d) => d.id === selected) ?? DEVICES[0];
  const readings = useMemo(() => DEMO_READINGS[selected] ?? [], [selected]);
  const flagged = useMemo(() => flagAnomalies(readings), [readings]);
  const rule = DEFAULT_RULES[selected];
  const alertResult = useMemo(() => evaluateAlertRule(readings, rule), [readings, rule]);
  const suspiciousCount = flagged.filter((r) => r.qualityFlag === "supheli").length;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Sensör ve alarm
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Tek anlık sıçrama <em style={{ fontStyle: "italic", color: "var(--primary)" }}>yanlış alarm</em> üretmez.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 620, margin: "0 auto" }} className="text-pretty">
            Aykırı okuma otomatik filtrelenir; alarm yalnız ardışık gerçek ihlalde tetiklenir.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Cihazlar" title="Sera A sensörleri" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
            {DEVICES.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className="chip"
                aria-pressed={selected === d.id}
                style={{
                  cursor: "pointer",
                  border: "none",
                  background: selected === d.id ? "var(--primary)" : "var(--bg-surface-2)",
                  color: selected === d.id ? "var(--primary-fg)" : "var(--text-mid)",
                }}
              >
                {SENSOR_TYPE_LABELS[d.type]} · {d.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="sensor-grid">
            <Reveal i={0} className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  {device.type === "sicaklik" ? <Thermometer size={20} /> : <Droplet size={20} />}
                </span>
                <div>
                  <h3 style={{ fontSize: "var(--fs-lg)", margin: 0 }}>{device.label}</h3>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>{device.zone}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <span className={`chip ${device.online ? "chip-ok" : "chip-danger"}`}>{device.online ? "Çevrimiçi" : "Çevrimdışı"}</span>
                <span className={`chip ${device.batteryPct > 30 ? "chip-info" : "chip-warn"}`}>Pil %{device.batteryPct}</span>
                <span className="chip">Kalibrasyon: {device.calibratedAt}</span>
              </div>
              <Sparkline data={readings.map((r) => r.value)} width={280} height={60} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                {flagged.map((r, i) => (
                  <span
                    key={i}
                    className={`chip ${r.qualityFlag === "supheli" ? "chip-danger" : "chip-ok"}`}
                    style={{ fontSize: 10, padding: "2px 6px" }}
                    title={r.timestamp}
                  >
                    {r.value}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 10 }}>
                {suspiciousCount} okuma aykırı işaretlendi ve alarm sayacına dahil edilmedi.
              </p>
            </Reveal>

            <Reveal i={1} className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 14 }}>{rule.label}</h3>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", marginBottom: 16 }}>
                Kural: değer {rule.comparator} {rule.threshold} — ardışık en az {rule.minConsecutive} geçerli
                okumada tetiklenir.
              </p>
              <div
                style={{
                  padding: 18,
                  borderRadius: "var(--radius-card)",
                  background: alertResult.triggered ? "color-mix(in srgb, var(--color-danger) 8%, var(--bg-surface-2))" : "var(--bg-surface-2)",
                  border: alertResult.triggered ? "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)" : "1px solid var(--border-hair)",
                }}
              >
                <span className={`chip ${alertResult.triggered ? "chip-danger" : "chip-ok"}`} style={{ marginBottom: 10 }}>
                  {alertResult.triggered ? <X size={12} /> : <Check size={12} />}
                  {alertResult.triggered ? "Alarm tetiklendi" : "Alarm tetiklenmedi"}
                </span>
                <div style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
                  <div>En uzun ardışık ihlal: <span className="font-mono">{alertResult.breachStreak}</span></div>
                  <div>Son geçerli değer: <span className="font-mono">{alertResult.lastValidValue ?? "—"}</span></div>
                  <div>Göz ardı edilen aykırı okuma: <span className="font-mono">{alertResult.ignoredSuspiciousCount}</span></div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) { .sensor-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
