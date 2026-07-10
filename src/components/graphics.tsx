import type { CSSProperties, ReactNode } from "react";

/* ============================================================================
   Saf SVG/CSS grafik primitifleri (server component uyumlu).
   Araştırma imza move'larından: radial gauge, segmentli faz çubuğu, sparkline,
   dalga ayraç, dönen mühür, kemer maske, sürekli toprak-çizgisi büyüme evreleri,
   gizli-harf botanik sahnesi.
   ============================================================================ */

/** Conic-gradient radial gauge — JS'siz. Skor 0-100. */
export function RadialGauge({
  value,
  size = 120,
  label,
  sub,
  color = "var(--primary)",
  track = "var(--bg-inset)",
}: {
  value: number;
  size?: number;
  label?: string;
  sub?: string;
  color?: string;
  track?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const thickness = size * 0.11;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${pct * 3.6}deg, ${track} 0)`,
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${thickness}px), #000 calc(100% - ${thickness}px))`,
          transition: "background var(--dur-slow) var(--ease-out)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div className="font-mono" style={{ fontSize: size * 0.26, fontWeight: 600, lineHeight: 1, color: "var(--text-hi)" }}>
            {label ?? Math.round(pct)}
          </div>
          {sub && <div style={{ fontSize: size * 0.1, color: "var(--text-low)", marginTop: 2 }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

/** Segmentli faz çubuğu — tamamlanan / mevcut (baskın) / bekleyen. */
export function SegmentedBar({
  segments,
  current,
  height = 8,
}: {
  segments: number;
  current: number; // 0-indexed aktif segment; current tamamlanmış sayısı
  height?: number;
}) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: segments }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: 999,
              background: done
                ? "var(--primary)"
                : active
                ? "var(--accent)"
                : "var(--bg-inset)",
              boxShadow: active ? "0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent)" : undefined,
              transition: "background var(--dur-base) var(--ease-out)",
            }}
          />
        );
      })}
    </div>
  );
}

/** Mini sparkline (KPI kartı arka planı). */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "var(--primary)",
  fill = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / span) * (height - 4) - 2;
    return [x, y];
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = `spark-${Math.round(pts[0][1] * 100)}-${data.length}`;
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }} aria-hidden="true">
      {fill && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.22" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Dalga section ayracı — keskin yatay çizgi yerine organik geçiş. */
export function WaveDivider({
  fill = "var(--bg-page)",
  flip = false,
  height = 80,
}: {
  fill?: string;
  flip?: boolean;
  height?: number;
}) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? "scaleY(-1)" : undefined }}>
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
        aria-hidden="true"
      >
        <path d="M0,64 C280,8 560,8 720,52 C900,100 1160,120 1440,56 L1440,120 L0,120 Z" fill={fill} />
      </svg>
    </div>
  );
}

/** Dönen mühür rozeti — foto/kart köşesine somut etki istatistiği taşır. */
export function StampBadge({
  ring = "SMARTGROWTH · ORGANİK · 2026 · ",
  center,
  size = 118,
}: {
  ring?: string;
  center: ReactNode;
  size?: number;
}) {
  const r = size / 2 - 14;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--bg-surface)",
        border: "1.5px dashed var(--primary)",
        display: "grid",
        placeItems: "center",
        boxShadow: "var(--shadow-md)",
        position: "relative",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: "absolute", inset: 0, animation: "spin 24s linear infinite" }}
        aria-hidden="true"
      >
        <defs>
          <path id={`stamp-${size}`} d={`M ${size / 2},${size / 2} m -${r},0 a ${r},${r} 0 1,1 ${r * 2},0 a ${r},${r} 0 1,1 -${r * 2},0`} />
        </defs>
        <text fontSize="9.5" fontWeight={600} letterSpacing="1.5" fill="var(--text-low)" fontFamily="var(--font-mono)">
          <textPath href={`#stamp-${size}`}>{ring}</textPath>
        </text>
      </svg>
      <div style={{ textAlign: "center", fontFamily: "var(--font-display)", color: "var(--primary)" }}>{center}</div>
    </div>
  );
}

/** Kemer maskeli görsel çerçevesi (persona kartları). */
export function ArchFrame({
  children,
  ratio = "4 / 5",
  className,
  style,
}: {
  children: ReactNode;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        aspectRatio: ratio,
        borderRadius: "50% 50% 14px 14px / 32% 32% 14px 14px",
        overflow: "hidden",
        position: "relative",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Sürekli toprak-çizgisi üzerinde büyüme evreleri (tohum→hasat). */
export function SoilLineStages({
  stages,
}: {
  stages: { emoji: string; label: string; day: string }[];
}) {
  return (
    <div style={{ position: "relative", padding: "8px 0 0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
          position: "relative",
        }}
      >
        {/* sürekli toprak çizgisi */}
        <div
          style={{
            position: "absolute",
            left: `${50 / stages.length}%`,
            right: `${50 / stages.length}%`,
            top: 34,
            height: 2,
            background: "linear-gradient(90deg, var(--color-forest-300), var(--color-gold-400))",
          }}
        />
        {stages.map((s, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                background: "var(--bg-surface)",
                border: "2px solid var(--color-forest-300)",
                marginBottom: 10,
              }}
            >
              {s.emoji}
            </div>
            <div style={{ fontSize: "var(--fs-sm)", fontWeight: 600, textAlign: "center" }}>{s.label}</div>
            <div className="font-mono" style={{ fontSize: 11, color: "var(--text-low)" }}>{s.day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Gizli 'S' harf formu üzerine dizili botanik hero sahnesi (kendi kendini çizen). */
export function BotanicalScene({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg
      viewBox="0 0 400 400"
      fill="none"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
        {/* S formunu izleyen ana sürgün */}
        <path d="M300 60 C220 90 300 170 200 200 C100 230 180 320 110 350" />
        {/* yapraklar */}
        <path d="M258 78C258 78 246 60 224 62C230 82 246 90 258 88Z" />
        <path d="M280 96C280 96 300 88 306 68C286 68 276 82 280 96Z" />
        <path d="M214 178C214 178 196 166 176 174C188 192 206 190 214 178Z" />
        <path d="M232 208C232 208 252 204 260 186C240 182 228 196 232 208Z" />
        <path d="M150 316C150 316 132 306 114 316C128 332 144 328 150 316Z" />
        <path d="M132 342C132 342 150 340 158 324C138 318 126 330 132 342Z" />
        {/* tohum noktaları */}
        <circle cx="300" cy="60" r="3.4" fill="currentColor" stroke="none" />
        <circle cx="110" cy="350" r="3.4" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}

/** Numaralı bölüm başlığı — mono rakam + serif başlık + hairline. */
export function NumberedHeading({
  n,
  title,
  eyebrow,
}: {
  n: string;
  title: string;
  eyebrow?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 28 }}>
      <span
        className="font-mono"
        style={{ fontSize: "var(--fs-base)", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em" }}
      >
        {n}
      </span>
      <div style={{ flex: 1 }}>
        {eyebrow && (
          <div style={{ fontSize: "var(--fs-xs)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-low)", fontWeight: 600, marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <h2 style={{ fontSize: "var(--fs-h2)", margin: 0 }}>{title}</h2>
      </div>
      <span style={{ flex: 1, height: 1, background: "var(--border-hair)", alignSelf: "center" }} className="hairline-fill" />
    </div>
  );
}
