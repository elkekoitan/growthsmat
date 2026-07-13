"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { COST_CATEGORY_LABELS, computeMargin, type CostCategory, type FixedAllocation } from "@/lib/costModel";
import { createCycleAction, addEntryAction, removeEntryAction, type MaliyetFormState } from "./actions";
import { NumberedHeading } from "@/components/graphics";
import { KpiCard } from "@/components/visuals";
import { Reveal } from "@/components/ui";
import { Scale, ShieldCheck } from "@/components/icons";
import type { CycleBundle } from "./page";

const INITIAL_STATE: MaliyetFormState = {};
const CATEGORIES = Object.keys(COST_CATEGORY_LABELS) as CostCategory[];
const CATEGORY_COLORS: Record<CostCategory, string> = {
  tohum: "#2c6b49",
  girdi: "#6faa63",
  ambalaj: "#66736b",
  enerji: "#e8a33d",
  su: "#3f8ab0",
  iscilik: "#b0741b",
  "ekipman-amortisman": "#8a5a9e",
};

function fmt(n: number, d = 0): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: d, maximumFractionDigits: d });
}

export function Costs({ bundles }: { bundles: CycleBundle[] }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const active = bundles[selectedIdx] ?? null;

  const [cycleState, cycleAction, cyclePending] = useActionState(createCycleAction, INITIAL_STATE);
  const [entryState, entryAction, entryPending] = useActionState(addEntryAction, INITIAL_STATE);
  const [allocation, setAllocation] = useState<FixedAllocation>("dongu-basi");
  const [removePending, startRemoveTransition] = useTransition();
  const [removeMsg, setRemoveMsg] = useState<Record<string, string>>({});

  function handleRemoveEntry(id: string) {
    startRemoveTransition(async () => {
      const res = await removeEntryAction(id);
      setRemoveMsg((m) => ({ ...m, [id]: res.error ?? res.success ?? "" }));
    });
  }

  // Marj hesaplayıcısı — ephemeral, kalıcılaştırılmayan "ne olursa" girdileri (mikrofiliz
  // tepsi hesaplayıcısıyla AYNI ilke: yalnız gerçek maliyet kalemleri kalıcı, hipotetik
  // satış senaryosu değil).
  const [expectedYieldKg, setExpectedYieldKg] = useState(50);
  const [wastePct, setWastePct] = useState(10);
  const [pricePerKgTRY, setPricePerKgTRY] = useState(200);

  const margin = useMemo(() => {
    if (!active?.result) return null;
    return computeMargin(active.result.totalTRY, expectedYieldKg, wastePct, pricePerKgTRY);
  }, [active, expectedYieldKg, wastePct, pricePerKgTRY]);

  const breakdown = active?.result
    ? CATEGORIES.filter((c) => (active.result!.byCategory[c] ?? 0) > 0).map((c) => ({
        key: c,
        label: COST_CATEGORY_LABELS[c],
        value: active.result!.byCategory[c] ?? 0,
        color: CATEGORY_COLORS[c],
      }))
    : [];
  const totalForBar = (active?.result?.totalTRY || 1);

  return (
    <div className="mc-root">
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow"><Scale size={13} /> Maliyet ve marj</span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Gerçek maliyet, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>sahte ortalama yok</em>.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 640, margin: "0 auto" }} className="text-pretty">
            Her döngünün gerçek maliyet kalemlerini kaydet, sabit maliyeti seçtiğin yönteme göre dağıt.
            Marj hesaplayıcısı kendi verim/fire/fiyat senaryonu ile çalışır — kalıcı bir &ldquo;sektör
            ortalaması&rdquo; hiçbir zaman eklenmez.
          </p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Döngü" title="Maliyet döngüleri" />

          {bundles.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {bundles.map((b, i) => (
                <button
                  key={b.cycle.id}
                  type="button"
                  className={`btn btn-sm ${i === selectedIdx ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setSelectedIdx(i)}
                >
                  {b.cycle.label}
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ padding: 18, marginBottom: 24, maxWidth: 640 }}>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>Yeni döngü oluştur</p>
            <form action={cycleAction} style={{ display: "grid", gap: 10 }}>
              <input name="label" placeholder="Döngü adı (ör. 2026 Temmuz)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
              <input name="fixedCostsTRY" type="number" min={0} step={1} placeholder="Sabit maliyet (₺)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
              <select name="allocation" className="btn btn-secondary" value={allocation} onChange={(e) => setAllocation(e.target.value as FixedAllocation)}>
                <option value="dongu-basi">Döngü başına dağıt</option>
                <option value="alan-orani">Alan oranına göre dağıt</option>
              </select>
              {allocation === "alan-orani" ? (
                <>
                  <input name="areaM2" type="number" min={0} step={1} placeholder="Bu üretimin alanı (m²)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  <input name="totalAreaM2" type="number" min={0} step={1} placeholder="Toplam işletme alanı (m²)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                </>
              ) : (
                <input name="cycles" type="number" min={1} step={1} placeholder="Yıllık döngü sayısı (ör. 6)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
              )}
              <button type="submit" disabled={cyclePending} className="btn btn-primary" style={{ justifySelf: "start" }}>
                Döngü oluştur
              </button>
              {(cycleState.error || cycleState.success) && (
                <p style={{ fontSize: "var(--fs-xs)", color: cycleState.error ? "var(--color-danger)" : "var(--text-mid)" }}>
                  {cycleState.error ?? cycleState.success}
                </p>
              )}
            </form>
          </div>
        </div>
      </section>

      {active && (
        <>
          <section className="paper-section section">
            <div className="container-x">
              <NumberedHeading n="02" eyebrow={active.cycle.label} title="Maliyet kalemleri ve dökümü" />

              <div className="mc-calc">
                <div className="card" style={{ padding: 18 }}>
                  <p style={{ fontWeight: 600, marginBottom: 10 }}>Kalem ekle</p>
                  <form action={entryAction} style={{ display: "grid", gap: 10 }}>
                    <input type="hidden" name="cycleId" value={active.cycle.id} />
                    <select name="category" className="btn btn-secondary" defaultValue={CATEGORIES[0]}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{COST_CATEGORY_LABELS[c]}</option>
                      ))}
                    </select>
                    <input name="amountTRY" type="number" min={0.01} step={0.01} placeholder="Tutar (₺)" required className="btn btn-secondary" style={{ textAlign: "left" }} />
                    <input name="note" placeholder="Not (opsiyonel)" className="btn btn-secondary" style={{ textAlign: "left" }} />
                    <button type="submit" disabled={entryPending} className="btn btn-primary btn-sm" style={{ justifySelf: "start" }}>
                      Ekle
                    </button>
                    {(entryState.error || entryState.success) && (
                      <p style={{ fontSize: "var(--fs-xs)", color: entryState.error ? "var(--color-danger)" : "var(--text-mid)" }}>
                        {entryState.error ?? entryState.success}
                      </p>
                    )}
                  </form>

                  <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
                    {active.entries.length === 0 ? (
                      <p className="mf-hint">Henüz kalem eklenmedi.</p>
                    ) : (
                      active.entries.map((e) => (
                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", borderBottom: "1px solid var(--border-hair)", paddingBottom: 6 }}>
                          <span style={{ fontSize: "var(--fs-sm)" }}>
                            {COST_CATEGORY_LABELS[e.category]} — {fmt(e.amountTRY, 2)} ₺{e.note ? ` (${e.note})` : ""}
                          </span>
                          <button type="button" className="btn btn-ghost btn-sm" disabled={removePending} onClick={() => handleRemoveEntry(e.id)}>
                            Kaldır
                          </button>
                          {removeMsg[e.id] && <p style={{ width: "100%", fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{removeMsg[e.id]}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {active.result && (
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <span className="chip">Değişken: {fmt(active.result.variableTRY)} ₺</span>
                      <span className="chip">Dağıtılan sabit: {fmt(active.result.allocatedFixedTRY)} ₺</span>
                      <span className="chip chip-ok">Toplam: {fmt(active.result.totalTRY)} ₺</span>
                    </div>
                    {breakdown.length > 0 && (
                      <>
                        <div style={{ display: "flex", height: 22, borderRadius: 999, overflow: "hidden", background: "var(--bg-inset)" }}>
                          {breakdown.map((b) => (
                            <span key={b.key} style={{ width: `${(b.value / totalForBar) * 100}%`, background: b.color, display: "block", height: "100%" }} title={`${b.label}: ${fmt(b.value)} ₺`} />
                          ))}
                        </div>
                        <ul style={{ listStyle: "none", margin: "1rem 0 0", padding: 0, display: "grid", gap: 8 }}>
                          {breakdown.map((b) => (
                            <li key={b.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 12, height: 12, borderRadius: 3, background: b.color, flex: "none" }} />
                              <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>{b.label}</span>
                              <span style={{ marginLeft: "auto", fontSize: "var(--fs-sm)", fontWeight: 600 }}>{fmt(b.value)} ₺</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container-x">
              <NumberedHeading n="03" eyebrow="Ne olursa senaryosu" title="Marj hesaplayıcı" />
              <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", marginBottom: 20, maxWidth: 640 }}>
                Aşağıdaki verim/fire/fiyat senin girdiğin bir <strong>senaryo</strong>dur, kaydedilmez —
                yalnız yukarıdaki gerçek toplam maliyet ({fmt(active.result?.totalTRY ?? 0)} ₺) kalıcıdır.
              </p>
              <div className="mc-calc">
                <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
                  <label className="mf-field">
                    <span className="mf-field-top">
                      <span className="mf-field-label">Beklenen verim</span>
                      <span className="mf-field-val font-mono">{fmt(expectedYieldKg)} kg</span>
                    </span>
                    <input type="range" min={1} max={500} value={expectedYieldKg} onChange={(e) => setExpectedYieldKg(Number(e.target.value))} className="mf-range" />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-top">
                      <span className="mf-field-label">Fire oranı</span>
                      <span className="mf-field-val font-mono">%{fmt(wastePct)}</span>
                    </span>
                    <input type="range" min={0} max={40} value={wastePct} onChange={(e) => setWastePct(Number(e.target.value))} className="mf-range" />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-top">
                      <span className="mf-field-label">Satış fiyatı</span>
                      <span className="mf-field-val font-mono">{fmt(pricePerKgTRY)} TL/kg</span>
                    </span>
                    <input type="range" min={20} max={1000} step={5} value={pricePerKgTRY} onChange={(e) => setPricePerKgTRY(Number(e.target.value))} className="mf-range" />
                  </label>
                </div>

                {margin && (
                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
                    <KpiCard label="Brüt marj" value={fmt(margin.grossMarginTRY)} unit="TL" delta={{ value: `%${fmt(margin.grossMarginPct)}`, dir: margin.grossMarginTRY >= 0 ? "up" : "down", good: margin.grossMarginTRY >= 0 }} />
                    <KpiCard label="Satılabilir" value={fmt(margin.sellableKg)} unit="kg" delta={{ value: `${fmt(margin.revenueTRY)} TL gelir`, dir: "flat" }} />
                    <KpiCard label="Birim maliyet" value={fmt(margin.unitCostPerKg)} unit="TL/kg" delta={{ value: "satılabilir kg başı", dir: "flat" }} />
                    <KpiCard
                      label="Başabaş fiyat"
                      value={fmt(margin.breakEvenPricePerKg)}
                      unit="TL/kg"
                      delta={{
                        value: pricePerKgTRY >= margin.breakEvenPricePerKg ? "fiyat üstünde" : "fiyat altında",
                        dir: pricePerKgTRY >= margin.breakEvenPricePerKg ? "up" : "down",
                        good: pricePerKgTRY >= margin.breakEvenPricePerKg,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {bundles.length === 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container-x">
            <Reveal>
              <div className="card mf-callout">
                <span className="mf-callout-ic"><ShieldCheck size={18} /></span>
                <p>Henüz bir maliyet döngün yok. Yukarıdan ilk döngünü oluştur.</p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <style>{`
        .mc-calc { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        @media (max-width: 860px) { .mc-calc { grid-template-columns: 1fr; } }
        .mf-field { display: grid; gap: 0.4rem; }
        .mf-field-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
        .mf-field-label { font-size: var(--fs-sm); color: var(--text-mid); font-weight: 500; }
        .mf-field-val { font-size: var(--fs-sm); font-weight: 600; color: var(--text-hi); }
        .mf-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: var(--bg-inset); cursor: pointer; }
        .mf-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-surface); box-shadow: var(--shadow-sm); cursor: pointer; }
        .mf-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-surface); box-shadow: var(--shadow-sm); cursor: pointer; }
        .mf-hint { font-size: var(--fs-xs); color: var(--text-low); }
        .mf-callout { display: flex; gap: 0.85rem; align-items: flex-start; padding: 1rem 1.2rem; border-radius: var(--radius-card); background: var(--bg-surface-2); border: 1px solid var(--border-hair); }
        .mf-callout-ic { flex: none; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary); }
      `}</style>
    </div>
  );
}
