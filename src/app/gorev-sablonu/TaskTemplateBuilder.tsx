"use client";

import { useMemo, useState } from "react";
import { CROPS } from "@/data/crops";
import { generateTaskSchedule, addDaysISO, TASK_KIND_LABELS, type TaskKind } from "@/lib/taskTemplates";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Sprout, Droplet, Layers, Clipboard, Package } from "@/components/icons";

const KIND_ICON: Record<TaskKind, typeof Sprout> = {
  ekim: Sprout,
  sulama: Droplet,
  gubre: Layers,
  budama: Clipboard,
  gozlem: Clipboard,
  hasat: Package,
};

export function TaskTemplateBuilder() {
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [startDate, setStartDate] = useState("2026-07-15");

  const crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];
  const tasks = useMemo(() => generateTaskSchedule(crop), [crop]);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <Clipboard size={13} /> Görev şablon motoru
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Her ürün <em style={{ fontStyle: "italic", color: "var(--primary)" }}>kendi takvimini</em> üretir.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 600, margin: "0 auto" }} className="text-pretty">
            Sabit metin şablonu değil — su ihtiyacı, bakım yükü ve hasat penceresinden
            türetilen gerçek bir takvim.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Ürün ve ekim tarihi" title="Şablonu oluştur" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))", gap: 16, marginBottom: 32 }}>
            <label className="card" style={{ padding: 18, display: "block" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Ürün
              </span>
              <select value={cropId} onChange={(e) => setCropId(e.target.value)} className="tt-select">
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="card" style={{ padding: 18, display: "block" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Ekim tarihi
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="tt-select"
              />
            </label>
          </div>

          <NumberedHeading n="02" eyebrow={`${tasks.length} görev`} title={`${crop.name} takvimi`} />
          <div style={{ display: "grid", gap: 10 }}>
            {tasks.map((t, i) => {
              const Icon = KIND_ICON[t.kind];
              return (
                <Reveal key={i} i={i % 6} className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{t.title}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      {TASK_KIND_LABELS[t.kind]} · Gün {t.dayOffset}
                    </div>
                  </div>
                  <span className="font-mono chip">{addDaysISO(startDate, t.dayOffset)}</span>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <style>{`
        .tt-select {
          display: block;
          width: 100%;
          margin-top: 8px;
          padding: 10px 12px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border-soft);
          background: var(--bg-surface);
          color: var(--text-hi);
          font-size: var(--fs-sm);
        }
        .tt-select:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
      `}</style>
    </>
  );
}
