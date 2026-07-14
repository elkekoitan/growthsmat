"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CROPS } from "@/data/crops";
import { generateTaskSchedule, applyTaskDelay, addDaysISO, TASK_KIND_LABELS, type TaskKind } from "@/lib/taskTemplates";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Sprout, Droplet, Layers, Clipboard, Package, X, Check, ArrowRight } from "@/components/icons";
import { applyScheduleToTasksAction } from "./actions";

const KIND_ICON: Record<TaskKind, typeof Sprout> = {
  ekim: Sprout,
  sulama: Droplet,
  gubre: Layers,
  budama: Clipboard,
  gozlem: Clipboard,
  hasat: Package,
};

export function TaskTemplateBuilder({ hasSession }: { hasSession: boolean }) {
  const [cropId, setCropId] = useState(CROPS[0].id);
  const [startDate, setStartDate] = useState("2026-07-15");

  const crop = CROPS.find((c) => c.id === cropId) ?? CROPS[0];
  const tasks = useMemo(() => generateTaskSchedule(crop), [crop]);

  // ---- Şablonu gerçek görevlere ekle (P06 — demo → gerçek iş akışı) ----
  const [zone, setZone] = useState("");
  const [applyPending, startApply] = useTransition();
  const [applyResult, setApplyResult] = useState<{ created: number; error?: string } | null>(null);

  function handleApply() {
    setApplyResult(null);
    startApply(async () => {
      const res = await applyScheduleToTasksAction(cropId, zone, startDate);
      setApplyResult(res);
    });
  }

  const [delayIndex, setDelayIndex] = useState<number>(-1);
  const [delayDays, setDelayDays] = useState(3);
  const impact = useMemo(
    () => (delayIndex >= 0 ? applyTaskDelay(tasks, delayIndex, delayDays) : null),
    [tasks, delayIndex, delayDays]
  );
  const displayedTasks = impact ? impact.newSchedule : tasks;
  const shiftedFromIndex = delayIndex >= 0 ? delayIndex : Infinity;

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
            <label className="card" style={{ padding: 18, display: "block" }}>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Alan / bölge
              </span>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Örn. Sera tüneli, Yatak A2"
                className="tt-select"
              />
            </label>
          </div>

          <NumberedHeading n="02" eyebrow="Ne olursa?" title="Gecikme etkisini simüle et" />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 24 }}>
            <label style={{ fontSize: "var(--fs-sm)" }}>
              Hangi görev gecikti?
              <select
                value={delayIndex}
                onChange={(e) => setDelayIndex(Number(e.target.value))}
                className="tt-select"
                style={{ minWidth: 220 }}
              >
                <option value={-1}>— Gecikme yok —</option>
                {tasks.map((t, i) => (
                  <option key={i} value={i}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            {delayIndex >= 0 && (
              <label style={{ fontSize: "var(--fs-sm)" }}>
                Kaç gün gecikti?
                <input
                  type="number"
                  min={0}
                  value={delayDays}
                  onChange={(e) => setDelayDays(Math.max(0, Number(e.target.value) || 0))}
                  className="tt-select"
                  style={{ width: 100 }}
                />
              </label>
            )}
            {impact && impact.harvestShiftDays > 0 && (
              <span className="chip chip-warn">
                <X size={12} /> Hasat {impact.harvestShiftDays} gün kayıyor, {impact.affectedCount} görev etkileniyor
              </span>
            )}
          </div>

          <NumberedHeading n="03" eyebrow={`${displayedTasks.length} görev`} title={`${crop.name} takvimi`} />
          <div style={{ display: "grid", gap: 10 }}>
            {displayedTasks.map((t, i) => {
              const Icon = KIND_ICON[t.kind];
              const isShifted = i >= shiftedFromIndex;
              return (
                <Reveal
                  key={i}
                  i={i % 6}
                  className="card"
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    borderColor: isShifted ? "color-mix(in srgb, var(--color-warning) 40%, transparent)" : undefined,
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      display: "grid",
                      placeItems: "center",
                      background: isShifted
                        ? "color-mix(in srgb, var(--color-warning) 14%, transparent)"
                        : "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: isShifted ? "var(--color-warning)" : "var(--primary)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={17} />
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{t.title}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      {TASK_KIND_LABELS[t.kind]} · Gün {t.dayOffset}
                      {isShifted && delayDays > 0 && ` (${delayDays} gün kaydı)`}
                    </div>
                  </div>
                  <span className={`font-mono chip ${isShifted ? "chip-warn" : ""}`}>{addDaysISO(startDate, t.dayOffset)}</span>
                </Reveal>
              );
            })}
          </div>

          {/* ---------- Programı gerçek görevlere ekle ---------- */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--border-soft)" }}>
            {hasSession ? (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleApply}
                  disabled={applyPending}
                  style={{ opacity: applyPending ? 0.7 : 1 }}
                >
                  {applyPending ? "Ekleniyor…" : `Bu programı görevlerime ekle (${tasks.length})`}
                </button>
                {applyResult && !applyResult.error && (
                  <span className="chip" style={{ color: "var(--primary)" }}>
                    <Check size={13} /> {applyResult.created} görev /gorevler&apos;e eklendi
                    <Link href="/gorevler" className="font-mono" style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      Görevlere git <ArrowRight size={12} />
                    </Link>
                  </span>
                )}
                {applyResult?.error && (
                  <span className="chip chip-warn">
                    <X size={12} /> {applyResult.error}
                  </span>
                )}
              </div>
            ) : (
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                Görevlerine eklemek için giriş yap
                <Link href="/giris" className="font-mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
                  Giriş yap <ArrowRight size={12} />
                </Link>
              </p>
            )}
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
