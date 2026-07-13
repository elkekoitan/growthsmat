"use client";

import { useMemo, useState, useTransition } from "react";
import {
  SENSOR_TYPE_LABELS,
  flagAnomalies,
  evaluateAlertRule,
  type Device,
  type Reading,
  type AlertRule,
  type SensorType,
} from "@/lib/sensors";
import { createDeviceAction, addReadingAction } from "./actions";
import { Sparkline, NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Check, X, ShieldCheck, Thermometer, Droplet, Sparkles } from "@/components/icons";

const SENSOR_TYPE_ORDER: SensorType[] = ["sicaklik", "nem", "toprak-nemi", "ec", "ph", "isik"];

export interface SensorDashboardProps {
  devices: Device[];
  readingsByDevice: Record<string, Reading[]>;
  rulesByDevice: Record<string, AlertRule[]>;
}

export function SensorDashboard({ devices, readingsByDevice, rulesByDevice }: SensorDashboardProps) {
  const [selected, setSelected] = useState(devices[0]?.id ?? "");
  const [readingsState, setReadingsState] = useState(readingsByDevice);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [readingValue, setReadingValue] = useState("");

  const [fCode, setFCode] = useState("");
  const [fLabel, setFLabel] = useState("");
  const [fZone, setFZone] = useState("");
  const [fType, setFType] = useState<SensorType>("sicaklik");
  const [fUnit, setFUnit] = useState("");

  const device = devices.find((d) => d.id === selected);
  const readings = useMemo(() => readingsState[selected] ?? [], [readingsState, selected]);
  const flagged = useMemo(() => flagAnomalies(readings), [readings]);
  const rule = rulesByDevice[selected]?.[0];
  const alertResult = useMemo(() => (rule ? evaluateAlertRule(readings, rule) : undefined), [readings, rule]);
  const suspiciousCount = flagged.filter((r) => r.qualityFlag === "supheli").length;

  function handleAddReading() {
    const value = Number(readingValue);
    if (!Number.isFinite(value) || !device) return;
    setReadingValue("");
    startTransition(async () => {
      const result = await addReadingAction(device.id, value);
      if (!result.applied) {
        setError(result.reason ?? "Okuma eklenemedi");
        return;
      }
      setError("");
      setReadingsState((prev) => ({ ...prev, [device.id]: [...(prev[device.id] ?? []), result.reading!] }));
    });
  }

  function handleAddDevice() {
    if (!fCode.trim() || !fLabel.trim() || !fZone.trim() || !fUnit.trim()) return;
    startTransition(async () => {
      const result = await createDeviceAction({
        code: fCode.trim(),
        label: fLabel.trim(),
        zone: fZone.trim(),
        type: fType,
        unit: fUnit.trim(),
        calibratedAt: new Date().toISOString().slice(0, 10),
      });
      if (!result.applied) {
        setError(result.reason ?? "Cihaz eklenemedi");
        return;
      }
      setError("");
      setFCode("");
      setFLabel("");
      setFZone("");
      setFUnit("");
      setFormOpen(false);
      setSelected(result.device!.id);
      // Server Component'in yeniden getirdiği tam liste bir sonraki navigasyonda görünür;
      // yeni cihazı anında seçebilmek için burada yalnız seçim state'i güncellenir.
    });
  }

  if (!device) {
    return (
      <section className="section container-narrow" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-mid)" }}>Henüz kayıtlı cihaz yok.</p>
      </section>
    );
  }

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
            Gerçek IoT donanımı henüz bağlı değil — okumalar elle girilir.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Cihazlar" title="Sera A sensörleri" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {devices.map((d) => (
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

          <div style={{ marginBottom: 28 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFormOpen((o) => !o)} aria-expanded={formOpen}>
              <Sparkles size={15} /> {formOpen ? "Formu kapat" : "Yeni cihaz kaydet"}
            </button>
            {formOpen && (
              <div className="card" style={{ padding: 18, marginTop: 10, display: "grid", gap: 10, maxWidth: 520 }}>
                <input value={fCode} onChange={(e) => setFCode(e.target.value)} placeholder="Cihaz kodu (ör. SEN-EC01)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                <input value={fLabel} onChange={(e) => setFLabel(e.target.value)} placeholder="Etiket (ör. Sera EC sensörü)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                <input value={fZone} onChange={(e) => setFZone(e.target.value)} placeholder="Bölge (ör. Sera B — Fesleğen)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                <select value={fType} onChange={(e) => setFType(e.target.value as SensorType)} className="btn btn-secondary">
                  {SENSOR_TYPE_ORDER.map((t) => (
                    <option key={t} value={t}>{SENSOR_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <input value={fUnit} onChange={(e) => setFUnit(e.target.value)} placeholder="Birim (ör. °C, %, mS/cm)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                {error && <span className="chip chip-danger" style={{ width: "fit-content" }}><X size={12} /> {error}</span>}
                <button type="button" disabled={pending} onClick={handleAddDevice} className="btn btn-primary" style={{ justifySelf: "start" }}>
                  Cihazı kaydet
                </button>
              </div>
            )}
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
              {readings.length > 0 ? (
                <>
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
                </>
              ) : (
                <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>Henüz okuma yok — ilk okumayı ekle.</p>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <input
                  type="number"
                  value={readingValue}
                  onChange={(e) => setReadingValue(e.target.value)}
                  placeholder={`Değer (${device.unit})`}
                  className="btn btn-secondary btn-sm"
                  style={{ textAlign: "left", flex: 1 }}
                />
                <button type="button" disabled={pending || !readingValue.trim()} onClick={handleAddReading} className="btn btn-primary btn-sm">
                  Okuma ekle
                </button>
              </div>
            </Reveal>

            <Reveal i={1} className="card" style={{ padding: 22 }}>
              {rule && alertResult ? (
                <>
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
                </>
              ) : (
                <p style={{ color: "var(--text-mid)" }}>
                  Bu sensör tipi için henüz varsayılan bir alarm kuralı tanımlı değil — gerçek saha
                  verisi olmadan bir eşik uydurulmadı.
                </p>
              )}
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
