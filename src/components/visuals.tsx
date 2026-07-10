"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Sparkline } from "./graphics";
import { ArrowRight } from "./icons";

/* ============================================================================
   İnteraktif imza bileşenleri (client).
   ============================================================================ */

/** İmleç-takip spotlight kart — --mx/--my CSS değişkenleriyle 1px kenar fener glow'u. */
export function SpotlightCard({
  children,
  className = "",
  style,
  glow = "var(--primary)",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: string;
  as?: "div" | "article" | "a";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <Tag
      // @ts-expect-error ref polymorphic
      ref={ref}
      onMouseMove={onMove}
      className={`spotlight-card ${className}`}
      style={{ ["--glow" as string]: glow, ...style }}
    >
      <span className="spotlight-layer" aria-hidden="true" />
      <span style={{ position: "relative", zIndex: 1, display: "block", height: "100%" }}>{children}</span>
      <style>{`
        .spotlight-card {
          position: relative;
          border-radius: var(--radius-card);
          background: var(--bg-surface);
          border: 1px solid var(--border-hair);
          overflow: hidden;
          transition: transform var(--dur-base) var(--ease-out-soft), border-color var(--dur-base) ease;
        }
        .spotlight-card:hover { transform: translateY(-3px); }
        .spotlight-layer {
          position: absolute; inset: 0; pointer-events: none; opacity: 0;
          transition: opacity var(--dur-base) ease;
          background: radial-gradient(240px circle at var(--mx, 50%) var(--my, 0),
            color-mix(in srgb, var(--glow) 16%, transparent), transparent 60%);
        }
        .spotlight-card:hover .spotlight-layer { opacity: 1; }
      `}</style>
    </Tag>
  );
}

/** Kenarları eriyen, hover'da duran sonsuz marquee (içerik 2x). */
export function Marquee({ children }: { children: ReactNode }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {children}
        <span aria-hidden="true" style={{ display: "contents" }}>
          {children}
        </span>
      </div>
    </div>
  );
}

/** Satır reveal başlık — maske içinden yukarı kayarak açılır (reveal sınıfıyla). */
export function RevealHeading({
  lines,
  as: Tag = "h2",
  className = "",
  style,
}: {
  lines: ReactNode[];
  as?: "h1" | "h2" | "h3";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag className={className} style={{ margin: 0, ...style }}>
      {lines.map((l, i) => (
        <span key={i} style={{ display: "block", overflow: "hidden", paddingBottom: "0.05em" }}>
          <span
            className="reveal reveal-line"
            style={{
              display: "block",
              ["--i" as string]: i,
            }}
          >
            {l}
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** İki görsel/panel karşılaştırma sürgüsü — görünmez range input (a11y bedava). */
export function CompareSlider({
  before,
  after,
  beforeLabel = "Önce",
  afterLabel = "Sonra",
  height = 300,
}: {
  before: ReactNode;
  after: ReactNode;
  beforeLabel?: string;
  afterLabel?: string;
  height?: number;
}) {
  const [pos, setPos] = useState(50);
  return (
    <div style={{ position: "relative", height, borderRadius: "var(--radius-card)", overflow: "hidden", border: "1px solid var(--border-hair)" }}>
      <div style={{ position: "absolute", inset: 0 }}>{after}</div>
      <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{before}</div>
      <span style={{ position: "absolute", top: 12, left: 12, zIndex: 3 }} className="chip">{beforeLabel}</span>
      <span style={{ position: "absolute", top: 12, right: 12, zIndex: 3 }} className="chip">{afterLabel}</span>
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: `${pos}%`,
          width: 2,
          background: "var(--accent)",
          transform: "translateX(-1px)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-fg)",
            display: "grid",
            placeItems: "center",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <ArrowRight size={16} />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Karşılaştırma sürgüsü"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", zIndex: 4 }}
      />
    </div>
  );
}

/** KPI kartı kanonik anatomisi: mono etiket + büyük tabular sayı + delta chip + sparkline. */
export function KpiCard({
  label,
  value,
  unit,
  delta,
  data,
  color = "var(--primary)",
}: {
  label: string;
  value: string;
  unit?: string;
  delta?: { value: string; dir: "up" | "down" | "flat"; good?: boolean };
  data?: number[];
  color?: string;
}) {
  const deltaColor =
    delta?.dir === "flat"
      ? "var(--text-low)"
      : delta?.good === false
      ? "var(--color-danger)"
      : "var(--color-success)";
  const arrow = delta?.dir === "up" ? "↑" : delta?.dir === "down" ? "↓" : "→";
  return (
    <div className="card" style={{ padding: 18, position: "relative", overflow: "hidden" }}>
      <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-low)" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 8 }}>
        <span className="font-mono" style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, color: "var(--text-hi)" }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 13, color: "var(--text-low)", marginBottom: 3 }}>{unit}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, gap: 8 }}>
        {delta ? (
          <span
            className="font-mono"
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: deltaColor,
              background: `color-mix(in srgb, ${deltaColor} 12%, transparent)`,
              padding: "2px 8px",
              borderRadius: 999,
            }}
          >
            {arrow} {delta.value}
          </span>
        ) : (
          <span />
        )}
        {data && <Sparkline data={data} width={90} height={30} color={color} />}
      </div>
    </div>
  );
}
