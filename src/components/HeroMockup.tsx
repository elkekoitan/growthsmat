"use client";

import { useEffect, useRef } from "react";
import { Sprout, Sun, Droplet, ShieldCheck, Check, Sparkles } from "./icons";
import { Sparkline } from "./graphics";

const TREND = [61, 66, 64, 70, 74, 71, 78, 82];

/** Hero'daki ürün önizlemesi — gerçek uygunluk sonucu kartını taklit eder.
 *  İmleç-takip hafif tilt + iki yüzen mini-kart (Dribbble "floating card hero
 *  mockup" / HarvestLync agri-tech hero araştırmasından) mockup'a derinlik katar. */
export function HeroMockup() {
  const factors = [
    { label: "İklim", score: 88 },
    { label: "Toprak", score: 62 },
    { label: "Su", score: 90 },
    { label: "Operasyon", score: 78 },
  ];

  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (reduceRef.current) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--hrx", `${(-py * 6).toFixed(2)}deg`);
    el.style.setProperty("--hry", `${(px * 6).toFixed(2)}deg`);
    el.style.setProperty("--hmx", `${(px * 14).toFixed(1)}px`);
    el.style.setProperty("--hmy", `${(py * 14).toFixed(1)}px`);
  };
  const reset = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.style.setProperty("--hrx", "0deg");
    el.style.setProperty("--hry", "0deg");
    el.style.setProperty("--hmx", "0px");
    el.style.setProperty("--hmy", "0px");
  };

  return (
    <div
      ref={wrapRef}
      className="hm-wrap"
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ position: "relative", width: "100%", maxWidth: 460 }}
    >
      {/* yüzen mini-kart · üst sağ — canlı trend */}
      <div className="hm-float hm-float-a" aria-hidden="true">
        <div className="hm-float-drift" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="hm-float-head">
            <span className="hm-float-ic">
              <Sparkles size={13} />
            </span>
            <span>Verim trendi</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="font-mono" style={{ fontSize: 20, fontWeight: 600, color: "var(--text-hi)" }}>
              +34%
            </span>
            <span style={{ fontSize: 10, color: "var(--text-low)" }}>8 hafta</span>
          </div>
          <Sparkline data={TREND} width={110} height={30} color="var(--primary)" />
        </div>
      </div>

      {/* yüzen mini-kart · alt sol — güven kanıtı */}
      <div className="hm-float hm-float-b" aria-hidden="true">
        <div className="hm-float-drift" style={{ display: "flex", alignItems: "center", gap: 10, animationDelay: "1.4s" }}>
          <span className="hm-float-ic hm-float-ic-gold">
            <Check size={13} />
          </span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-hi)" }}>Kanıt B+ doğrulandı</div>
            <div style={{ fontSize: 10, color: "var(--text-low)" }}>12 açık kaynağa dayanır</div>
          </div>
        </div>
      </div>

      <div
        className="card hm-card"
        style={{
          padding: 0,
          overflow: "hidden",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-bento)",
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

      <style>{`
        .hm-wrap { --hrx: 0deg; --hry: 0deg; --hmx: 0px; --hmy: 0px; perspective: 1200px; }
        .hm-card {
          transform: rotateX(var(--hrx)) rotateY(var(--hry));
          transition: transform 320ms var(--ease-out);
          will-change: transform;
        }
        .hm-float {
          position: absolute;
          z-index: 2;
          padding: 12px 14px;
          border-radius: 14px;
          background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
          border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transform: translate3d(var(--hmx), var(--hmy), 0);
          transition: transform 320ms var(--ease-out);
          pointer-events: none;
        }
        .hm-float-a { top: -22px; right: -18px; width: 148px; }
        .hm-float-b { bottom: 22px; left: -26px; width: 190px; }
        .hm-float-drift { animation: hm-drift 6.5s ease-in-out infinite; }
        .hm-float-head { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-mid); }
        .hm-float-ic {
          display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 7px; flex-shrink: 0;
          background: color-mix(in srgb, var(--primary) 14%, transparent); color: var(--primary);
        }
        .hm-float-ic-gold { background: color-mix(in srgb, var(--accent) 20%, transparent); color: var(--color-gold-600); }
        .dark .hm-float-ic-gold { color: var(--accent); }

        @keyframes hm-drift {
          0%, 100% { margin-block-start: 0; }
          50% { margin-block-start: -8px; }
        }
        @media (max-width: 640px) {
          .hm-float { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hm-float-drift { animation: none; }
          .hm-card { transition: none; }
        }
      `}</style>
    </div>
  );
}
