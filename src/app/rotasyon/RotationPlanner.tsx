"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { CROPS } from "@/data/crops";
import { evaluateRotation, type PlotHistoryEntry } from "@/lib/rotation";
import { NumberedHeading } from "@/components/graphics";
import { SpotlightCard } from "@/components/visuals";
import { Reveal } from "@/components/ui";
import { Check, X, Layers, ArrowRight } from "@/components/icons";
import { savePlotSeasonAction, removePlotSeasonAction } from "./actions";

const SEASON_SLOTS = [1, 2, 3];
// Tek parselli MVP — şema/repo çok-parselli, UI şimdilik tek parsel adıyla çalışır.
const DEFAULT_PLOT = "Ana parsel";

export function RotationPlanner({
  hasSession,
  initialSeasons,
}: {
  hasSession: boolean;
  initialSeasons: { plotName: string; yearSlot: number; cropId: string }[];
}) {
  // Oturum varsa ve gerçek kayıt varsa, geçmiş DB'den gelir — yoksa örnek varsayılan.
  const [history, setHistory] = useState<Record<number, string>>(() => {
    if (hasSession && initialSeasons.length > 0) {
      const fromDb: Record<number, string> = {};
      for (const s of initialSeasons) {
        if (s.plotName === DEFAULT_PLOT && SEASON_SLOTS.includes(s.yearSlot)) fromDb[s.yearSlot] = s.cropId;
      }
      if (Object.keys(fromDb).length > 0) return fromDb;
    }
    return { 1: "cherry-domates-kompakt" };
  });
  const [savePending, startSaveTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedOnce, setSavedOnce] = useState(false);

  // İyimser desen (bkz. /gorevler Tasks.tsx): yerel state anında güncellenir, kalıcılaştırma
  // transition içinde Server Action'a gider; hata dürüstçe gösterilir.
  function changeSlot(slot: number, cropId: string) {
    setHistory((prev) => ({ ...prev, [slot]: cropId }));
    if (!hasSession) return;
    setSaveError(null);
    startSaveTransition(async () => {
      try {
        const result = cropId
          ? await savePlotSeasonAction(DEFAULT_PLOT, slot, cropId)
          : await removePlotSeasonAction(DEFAULT_PLOT, slot);
        if (result.applied) setSavedOnce(true);
        else setSaveError(result.reason);
      } catch {
        setSaveError("Kaydedilemedi — bağlantıyı kontrol edip tekrar dene.");
      }
    });
  }

  const historyEntries: PlotHistoryEntry[] = useMemo(
    () =>
      Object.entries(history)
        .filter(([, cropId]) => cropId)
        .map(([seasonsAgo, cropId]) => ({ cropId, seasonsAgo: Number(seasonsAgo) })),
    [history]
  );

  const results = useMemo(() => evaluateRotation(historyEntries), [historyEntries]);
  const eligible = results.filter((r) => r.eligible);
  const excluded = results.filter((r) => !r.eligible);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <Layers size={13} /> Rotasyon çözücü
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Aynı aileyi <em style={{ fontStyle: "italic", color: "var(--primary)" }}>tekrar önermeyen</em> parsel planı.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 620, margin: "0 auto" }} className="text-pretty">
            Parselin son üç sezon ekim geçmişini gir; aynı ürün ailesini öneren adaylar sert
            kısıtla elenir, gerekçesiyle gösterilir.
          </p>
        </div>
      </section>

      {/* ---------- GEÇMİŞ GİRİŞİ ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Parsel geçmişi" title="Son sezonlarda ne ekildi?" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 16, marginBottom: 32 }}>
            {SEASON_SLOTS.map((s) => (
              <label key={s} className="card" style={{ padding: 18, display: "block" }}>
                <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  {s} sezon önce
                </span>
                <select
                  value={history[s] ?? ""}
                  onChange={(e) => changeSlot(s, e.target.value)}
                  className="rot-select"
                >
                  <option value="">— Ekim yok / bilinmiyor —</option>
                  {CROPS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.emoji} {c.name} ({c.family})
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          {/* ---------- KALICILIK DURUMU ---------- */}
          <div style={{ marginTop: -16, marginBottom: 32, minHeight: 20 }} aria-live="polite">
            {hasSession ? (
              <>
                {savePending && (
                  <span className="font-mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Kaydediliyor…
                  </span>
                )}
                {!savePending && !saveError && savedOnce && (
                  <span className="font-mono" style={{ fontSize: "var(--fs-xs)", color: "var(--color-success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Check size={11} /> Parsel geçmişi kaydedildi
                  </span>
                )}
                {!savePending && saveError && (
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--color-danger)" }}>{saveError}</span>
                )}
              </>
            ) : (
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", margin: 0 }}>
                Parsel geçmişini kalıcı kaydetmek için giriş yap
                <Link href="/giris" className="font-mono" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
                  Giriş yap <ArrowRight size={12} />
                </Link>
              </p>
            )}
          </div>

          {/* ---------- SONUÇLAR ---------- */}
          <NumberedHeading n="02" eyebrow={`${eligible.length} uygun aday`} title="Önerilen sıradaki ürünler" />
          <div className="bento" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))", marginBottom: 36 }}>
            {eligible.slice(0, 9).map((r, i) => (
              <Reveal key={r.crop.id} i={i % 3}>
                <SpotlightCard style={{ padding: 20, height: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }} aria-hidden="true">{r.crop.emoji}</span>
                    <div>
                      <h3 style={{ fontSize: "var(--fs-base)", margin: 0 }}>{r.crop.name}</h3>
                      <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>{r.crop.family}</span>
                    </div>
                    <span className="font-mono chip chip-ok" style={{ marginLeft: "auto" }}>
                      {r.score}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {r.successionFriendly && (
                      <span className="chip chip-info">
                        <Check size={11} /> Ardışık ekime uygun
                      </span>
                    )}
                    {r.companionSuggestions.length > 0 && (
                      <span className="chip">
                        <Layers size={11} /> {r.companionSuggestions.length} birlikte ekim önerisi
                      </span>
                    )}
                  </div>
                  {r.companionSuggestions.length > 0 && (
                    <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)", margin: 0 }}>
                      İyi eşleşir: {r.companionSuggestions.map((c) => c.cropId).join(", ")}
                    </p>
                  )}
                </SpotlightCard>
              </Reveal>
            ))}
            {eligible.length === 0 && (
              <p style={{ color: "var(--text-low)", gridColumn: "1 / -1" }}>
                Girilen geçmişle uygun aday bulunamadı — geçmiş girişini gözden geçir.
              </p>
            )}
          </div>

          {excluded.length > 0 && (
            <>
              <NumberedHeading n="03" eyebrow={`${excluded.length} elenen`} title="Neden önerilmedi?" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 12 }}>
                {excluded.slice(0, 6).map((r) => (
                  <div key={r.crop.id} className="card" style={{ padding: 16, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 20 }} aria-hidden="true">{r.crop.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{r.crop.name}</div>
                      <span className="chip chip-danger" style={{ marginTop: 6 }}>
                        <X size={11} /> {r.conflict?.family} ailesi {r.conflict?.seasonsAgo} sezon önce ekilmiş
                      </span>
                      {r.conflict?.diseaseDriven && (
                        <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 6, marginBottom: 0 }}>
                          Genel 3 sezon yerine {r.conflict.requiredYears} yıl bekleniyor — bu familyayı etkileyen
                          bilinen bir hastalık (bkz. zararlı/hastalık kataloğu) daha uzun rotasyon gerektiriyor.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <a href="/plan" className="btn btn-secondary">
              Tam uygunluk analizi için /plan&apos;a git <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .rot-select {
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
        .rot-select:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
      `}</style>
    </>
  );
}
