"use client";

import { useCallback, useEffect, useMemo, useState, useActionState, useTransition } from "react";
import Link from "next/link";
import {
  MICROGREEN_RECIPES,
  BLOCKED_MICROGREENS,
  SAFETY_LABELS,
  computeTrayCost,
  DEFAULT_TRAY_INPUT,
  type MicrogreenRecipe,
  type TrayCostInput,
} from "@/data/microgreens";
import type { RoomProfile, CapacityPlan } from "@/lib/microCapacity";
import type { RealSubscription } from "@/server/repositories/microCapacity";
import {
  saveRoomAction,
  addSubscriptionAction,
  removeSubscriptionAction,
  type MikrofilizFormState,
} from "./actions";
import { COMPARISON_METRICS, findBestRecipeIndex } from "@/lib/compareMicrogreens";
import {
  SoilLineStages,
  NumberedHeading,
  StampBadge,
  RadialGauge,
  WaveDivider,
} from "@/components/graphics";
import { KpiCard } from "@/components/visuals";
import { Reveal } from "@/components/ui";
import {
  Layers,
  Calendar,
  Store,
  ShieldCheck,
  Beaker,
  X,
  Droplet,
  Scale,
  Sun,
  ArrowRight,
  Sprout,
  Leaf,
  Check,
} from "@/components/icons";

/* ============================================================================
   Mikro Filiz Stüdyosu — reçete uzmanlığı + tepsi maliyet hesaplayıcı.
   Reçeteler ARALIK'tır (Penn State / Utah State Extension), yerel tepsi ile
   kalibre edilir. Uygun olmayan türler SERT blok. Skor değil, girdi + kanıt.
   ============================================================================ */

// Her çeşide özel renk kimliği (yalnız aksan/şerit/nokta — metin --text-hi kalır).
const RECIPE_COLORS: Record<string, string> = {
  brokoli: "#2c6b49", // koyu orman yeşili
  turp: "#d0492f", // biberimsi kırmızı
  bezelye: "#6faa63", // taze bezelye yeşili
  aycicegi: "#e0912b", // hasat altını
  hardal: "#b8892a", // hardal amberi
  kale: "#2f6d63", // mavi-yeşil
  roka: "#6f9138", // fındıksı zeytin yeşili
  amarant: "#a5344f", // canlı kırmızı
  kisnis: "#3f8a5c", // kişniş yeşili
  feslegen: "#417a4a", // fesleğen yeşili
};

const EVIDENCE_TR: Record<
  MicrogreenRecipe["evidence"],
  { label: string; cls: string }
> = {
  A: { label: "Güçlü kanıt", cls: "chip-ok" },
  B: { label: "İyi kanıt", cls: "chip-info" },
  C: { label: "Sınırlı kanıt", cls: "chip-warn" },
  D: { label: "Zayıf kanıt", cls: "chip-danger" },
};

const DIFFICULTY_TR = ["", "Kolay", "Orta", "Zor"] as const;
const WEEKDAYS_TR = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

function fmt(n: number, d = 0): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

function safetyChipClass(tone: "ok" | "warn" | "danger"): string {
  return tone === "ok" ? "chip-ok" : tone === "warn" ? "chip-warn" : "chip-danger";
}

/* ---------- Tepsi mockup (SVG, seçili reçete rengiyle boyanır) ---------- */
function TrayMockup({ color }: { color: string }) {
  const sprigs = Array.from({ length: 22 }, (_, i) => {
    const x = 40 + (i * 240) / 21;
    const h = 44 + ((i * 41) % 34); // 44–78 psödo-rastgele
    const lean = ((i * 53) % 7) - 3;
    return { x, h, lean };
  });
  const soilY = 168;
  return (
    <svg viewBox="0 0 320 220" role="img" aria-label="Mikro filiz tepsisi kesiti" style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="mf-tray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--color-paper-200)" />
          <stop offset="1" stopColor="var(--color-paper-300)" />
        </linearGradient>
        <linearGradient id="mf-soil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2c20" />
          <stop offset="1" stopColor="#241a12" />
        </linearGradient>
      </defs>

      {/* sürgünler (soil'in arkasından çıkar) */}
      <g strokeLinecap="round">
        {sprigs.map((s, i) => {
          const topY = soilY - s.h;
          const c = i % 3 === 0 ? color : `color-mix(in srgb, ${color} 78%, #1a3a2a)`;
          return (
            <g key={i} className="mf-sprig" style={{ ["--d" as string]: `${(i % 6) * 0.35}s` }}>
              <path
                d={`M ${s.x} ${soilY} C ${s.x + s.lean} ${soilY - s.h * 0.5} ${s.x + s.lean} ${topY + 8} ${s.x + s.lean} ${topY}`}
                fill="none"
                stroke={c}
                strokeWidth="2"
              />
              {/* kotiledon çift yaprak */}
              <path d={`M ${s.x + s.lean} ${topY} q -9 -5 -12 -13 q 9 1 12 8 Z`} fill={c} opacity="0.92" />
              <path d={`M ${s.x + s.lean} ${topY} q 9 -5 12 -13 q -9 1 -12 8 Z`} fill={c} opacity="0.92" />
            </g>
          );
        })}
      </g>

      {/* toprak bandı */}
      <rect x="26" y={soilY} width="268" height="26" rx="4" fill="url(#mf-soil)" />
      {/* 10×20 tepsi gövdesi */}
      <rect x="20" y={soilY + 22} width="280" height="20" rx="7" fill="url(#mf-tray)" stroke="var(--border-soft)" />
      <rect x="20" y={soilY + 20} width="280" height="6" rx="3" fill="color-mix(in srgb, var(--color-paper-300) 70%, #000)" opacity="0.35" />
      {/* tepsi etiketi */}
      <text x="160" y={soilY + 36} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--text-low)" letterSpacing="1">
        10 × 20 TEPSİ
      </text>
    </svg>
  );
}

/* ---------- Reçete kartı ---------- */
function RecipeCard({
  recipe,
  selected,
  open,
  onSelect,
  onToggle,
  compareChecked,
  onToggleCompare,
  compareDisabled,
}: {
  recipe: MicrogreenRecipe;
  selected: boolean;
  open: boolean;
  onSelect: () => void;
  onToggle: () => void;
  compareChecked: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const color = RECIPE_COLORS[recipe.id] ?? "var(--primary)";
  const safety = SAFETY_LABELS[recipe.safety];
  const ev = EVIDENCE_TR[recipe.evidence];
  const SafetyIcon =
    safety.tone === "ok" ? ShieldCheck : safety.tone === "warn" ? Beaker : X;

  return (
    <article
      className={`mf-recipe card ${selected ? "mf-recipe--on" : ""}`}
      style={{ ["--rc" as string]: color }}
    >
      <span className="mf-recipe-strip" aria-hidden="true" />
      <label
        className="compare-toggle"
        title={compareDisabled && !compareChecked ? "En fazla 4 reçete karşılaştırılabilir" : "Karşılaştırmaya ekle"}
      >
        <input
          type="checkbox"
          checked={compareChecked}
          disabled={compareDisabled && !compareChecked}
          onChange={onToggleCompare}
          aria-label={`${recipe.name} — karşılaştırmaya ekle`}
        />
        <span className="font-mono">Karşılaştır</span>
      </label>
      <div className="mf-recipe-body">
        <div className="mf-recipe-head">
          <span className="mf-emoji" aria-hidden="true">
            {recipe.emoji}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 className="mf-recipe-name">{recipe.name}</h3>
            <p className="mf-sci">{recipe.scientificName}</p>
            <p className="mf-family font-mono">{recipe.family}</p>
          </div>
        </div>

        <div className="mf-tags">
          <span className={`chip ${safetyChipClass(safety.tone)}`}>
            <SafetyIcon size={13} /> {safety.label}
          </span>
          <span className={`chip ${ev.cls}`} title="Kaynak kanıt seviyesi">
            Kanıt {recipe.evidence} · {ev.label}
          </span>
        </div>

        <p className="mf-flavor">{recipe.flavor}</p>

        <div className="mf-diff" aria-label={`Zorluk: ${DIFFICULTY_TR[recipe.difficulty]}`}>
          <span className="mf-diff-label">Zorluk</span>
          <span className="mf-dots" aria-hidden="true">
            {[1, 2, 3].map((d) => (
              <span key={d} className="mf-dot" data-on={d <= recipe.difficulty} />
            ))}
          </span>
          <span className="mf-diff-word">{DIFFICULTY_TR[recipe.difficulty]}</span>
        </div>

        <dl className="mf-metrics font-mono">
          <div>
            <dt>Tohum</dt>
            <dd>
              {recipe.seedDensityGper1020[0]}–{recipe.seedDensityGper1020[1]} g
            </dd>
          </div>
          <div>
            <dt>Islatma</dt>
            <dd>
              {recipe.presoakHours[1] === 0
                ? "Yok"
                : `${recipe.presoakHours[0]}–${recipe.presoakHours[1]} sa`}
            </dd>
          </div>
          <div>
            <dt>Karartma</dt>
            <dd>
              {recipe.blackoutDays[0]}–{recipe.blackoutDays[1]} gün
            </dd>
          </div>
          <div>
            <dt>Hasat</dt>
            <dd>
              {recipe.harvestDays[0]}–{recipe.harvestDays[1]} gün
            </dd>
          </div>
          <div>
            <dt>Verim</dt>
            <dd>
              {recipe.expectedYieldG[0]}–{recipe.expectedYieldG[1]} g
            </dd>
          </div>
        </dl>

        <p className="mf-note">{recipe.note}</p>

        {open && (
          <ul className="mf-fails">
            {recipe.commonFailures.map((f, i) => (
              <li key={i}>
                <X size={13} /> <span>{f}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mf-recipe-foot">
          <button
            type="button"
            onClick={onSelect}
            className={`btn btn-sm ${selected ? "btn-primary" : "btn-secondary"}`}
            aria-pressed={selected}
          >
            {selected ? (
              <>
                <ShieldCheck size={15} /> Seçili
              </>
            ) : (
              <>Bu reçeteyi seç</>
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            className="btn btn-ghost btn-sm"
            aria-expanded={open}
          >
            Sık hatalar
            <span className="mf-caret" data-open={open} aria-hidden="true">
              ▾
            </span>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Kaydırıcı girdi ---------- */
function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (n: number) => void;
  hint?: string;
}) {
  return (
    <label className="mf-field">
      <span className="mf-field-top">
        <span className="mf-field-label">{label}</span>
        <span className="mf-field-val font-mono">
          {fmt(value, step < 1 ? 1 : 0)} <em>{unit}</em>
        </span>
      </span>
      <input
        type="range"
        className="mf-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
      {hint && <span className="mf-hint">{hint}</span>}
    </label>
  );
}

/* ---------- Reçete karşılaştırma modalı ---------- */
function RecipeCompareModal({
  recipes,
  onClose,
  onRemove,
}: {
  recipes: MicrogreenRecipe[];
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reçete karşılaştırması"
      style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(10,15,12,0.55)", backdropFilter: "blur(2px)" }}
        aria-hidden="true"
      />
      <div
        className="card"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 900,
          maxHeight: "82vh",
          margin: "0 auto 24px",
          padding: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border-hair)" }}>
          <h3 style={{ margin: 0, fontSize: "var(--fs-lg)" }}>Reçete karşılaştırması</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div style={{ overflow: "auto", padding: 20 }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Özellik</th>
                {recipes.map((r) => (
                  <th key={r.id}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 22 }} aria-hidden="true">{r.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{r.name}</span>
                      <button onClick={() => onRemove(r.id)} className="chip" style={{ cursor: "pointer", border: "none", fontSize: 10 }}>
                        <X size={10} /> Kaldır
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((m) => {
                const bestIdx = findBestRecipeIndex(recipes, m);
                return (
                  <tr key={m.key}>
                    <td className="font-mono" style={{ color: "var(--text-low)", fontSize: "var(--fs-xs)" }}>{m.label}</td>
                    {recipes.map((r, i) => (
                      <td key={r.id} style={{ textAlign: "center" }}>
                        <span
                          className={i === bestIdx ? "chip chip-ok" : undefined}
                          style={i === bestIdx ? undefined : { color: "var(--text-mid)" }}
                        >
                          {i === bestIdx && <Check size={11} />} {m.getValue(r)}
                        </span>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 16 }}>
            Yeşil rozet, o metrikte tek başına en iyi adayı gösterir — eşitlik durumunda hiçbiri vurgulanmaz.
          </p>
        </div>
      </div>
    </div>
  );
}

const INITIAL_FORM_STATE: MikrofilizFormState = {};

export interface StudioProps {
  hasSession: boolean;
  room: RoomProfile | null;
  subscriptions: RealSubscription[];
  capacityPlan: CapacityPlan | null;
}

export function Studio({ hasSession, room, subscriptions, capacityPlan }: StudioProps) {
  const [input, setInput] = useState<TrayCostInput>(DEFAULT_TRAY_INPUT);
  const [openId, setOpenId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const MAX_COMPARE = 4;

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }, []);

  const [roomState, roomAction, roomPending] = useActionState(saveRoomAction, INITIAL_FORM_STATE);
  const [subState, subAction, subPending] = useActionState(addSubscriptionAction, INITIAL_FORM_STATE);
  const [removePending, startRemoveTransition] = useTransition();
  const [removeMsg, setRemoveMsg] = useState<Record<string, string>>({});

  function handleRemoveSubscription(id: string) {
    startRemoveTransition(async () => {
      const res = await removeSubscriptionAction(id);
      setRemoveMsg((m) => ({ ...m, [id]: res.error ?? res.success ?? "" }));
    });
  }

  const recipe = useMemo(
    () => MICROGREEN_RECIPES.find((r) => r.id === input.recipeId) ?? MICROGREEN_RECIPES[0],
    [input.recipeId],
  );
  const result = useMemo(() => computeTrayCost(input), [input]);
  const accent = RECIPE_COLORS[recipe.id] ?? "var(--primary)";

  const set = <K extends keyof TrayCostInput>(k: K, v: TrayCostInput[K]) =>
    setInput((p) => ({ ...p, [k]: v }));

  // Veriden türetilen dürüst istatistikler.
  const stats = useMemo(() => {
    const hMin = Math.min(...MICROGREEN_RECIPES.map((r) => r.harvestDays[0]));
    const hMax = Math.max(...MICROGREEN_RECIPES.map((r) => r.harvestDays[1]));
    return { count: MICROGREEN_RECIPES.length, blocked: BLOCKED_MICROGREENS.length, hMin, hMax };
  }, []);

  // Büyüme evreleri — seçili reçetenin gerçek günleriyle.
  const stages = useMemo(() => {
    const s: { emoji: string; label: string; day: string }[] = [
      { emoji: "🌰", label: "Ekim", day: "Gün 0" },
    ];
    if (recipe.presoakHours[1] > 0)
      s.push({
        emoji: "💧",
        label: "Ön ıslatma",
        day: `${recipe.presoakHours[0]}–${recipe.presoakHours[1]} sa`,
      });
    s.push({
      emoji: "🌑",
      label: "Karartma",
      day: `${recipe.blackoutDays[0]}–${recipe.blackoutDays[1]} gün`,
    });
    s.push({ emoji: "☀️", label: "Işık", day: `${recipe.blackoutDays[1]}. günden` });
    s.push({
      emoji: "✂️",
      label: "Hasat",
      day: `${recipe.harvestDays[0]}–${recipe.harvestDays[1]} gün`,
    });
    return s;
  }, [recipe]);

  // Maliyet dökümü segmentleri.
  const breakdown = [
    { key: "seed", label: "Tohum", value: result.seedCost, color: "#2c6b49" },
    { key: "substrate", label: "Substrat", value: result.substrateCost, color: "#8fc2a2" },
    { key: "labor", label: "İşçilik", value: result.laborCost, color: "#e8a33d" },
    { key: "energy", label: "Enerji", value: result.energyCost, color: "#b0741b" },
    { key: "packaging", label: "Ambalaj", value: result.packagingCost, color: "#66736b" },
  ];
  const total = result.totalCostPerTray || 1;
  const profitable = result.profitPerTray >= 0;

  // Restoran aboneliği — geriye planlama (sabit teslimat gününe kilitle).
  const deliveryIdx = 5; // Cuma
  const avgHarvest = Math.round((recipe.harvestDays[0] + recipe.harvestDays[1]) / 2);
  const sowIdx = (((deliveryIdx - avgHarvest) % 7) + 7) % 7;
  const growWeeks = Math.max(1, Math.round(avgHarvest / 7));
  const totalWeeks = growWeeks + 3; // 3 ardışık parti

  return (
    <div className="mf-root">
      {/* ============================ 1. HERO ============================ */}
      <section className="mesh-light grain mf-hero">
        <div
          className="blob"
          style={{ width: 380, height: 380, background: accent, top: -80, right: -60, opacity: 0.28 }}
          aria-hidden="true"
        />
        <div className="container-x mf-hero-grid">
          <div className="hero-stagger">
            <span className="eyebrow">Mikro Filiz Uzmanlık Stüdyosu</span>
            <h1 className="mf-hero-title text-balance">
              En küçük alandan <span className="shimmer-text">en hızlı hasat</span>.
            </h1>
            <p className="mf-lead text-pretty">
              Mikro filiz, m² başına en yüksek verimli organik üretim biçimi: {stats.hMin}–{stats.hMax} günlük
              döngüler, tezgah üstü raflar ve şeflerin sürekli talep ettiği bir ürün. Burada reçete tür
              sayfasından ayrıdır — her çeşit doğrulanmış aralıklarla gelir, uygun olmayan türler ise reçeteye
              hiç eklenemez.
            </p>

            <div className="mf-vprops">
              <div className="mf-vprop">
                <span className="mf-vicon"><Layers size={18} /></span>
                <div>
                  <strong>m² başına verim</strong>
                  <span>Dikey raf + yoğun ekim ile alan başına maksimum gram.</span>
                </div>
              </div>
              <div className="mf-vprop">
                <span className="mf-vicon"><Calendar size={18} /></span>
                <div>
                  <strong>Hızlı döngü</strong>
                  <span>Haftalık ekim–hasat ritmi; nakit dönüşü günlerle ölçülür.</span>
                </div>
              </div>
              <div className="mf-vprop">
                <span className="mf-vicon"><Store size={18} /></span>
                <div>
                  <strong>Restoran talebi</strong>
                  <span>Tabak sunumu ve garnitür için düzenli, taze tedarik.</span>
                </div>
              </div>
            </div>

            <div className="mf-hero-cta">
              <a href="#hesaplayici" className="btn btn-primary btn-lg">
                Tepsi maliyetini hesapla <ArrowRight size={18} />
              </a>
              <a href="#recete" className="btn btn-secondary btn-lg">
                Reçeteleri gör
              </a>
            </div>

            <div className="mf-hero-stats">
              <div>
                <span className="font-mono mf-stat-n">{stats.count}</span>
                <span className="mf-stat-l">doğrulanmış reçete</span>
              </div>
              <div>
                <span className="font-mono mf-stat-n">{stats.hMin}–{stats.hMax}</span>
                <span className="mf-stat-l">gün hasat aralığı</span>
              </div>
              <div>
                <span className="font-mono mf-stat-n" style={{ color: "var(--color-danger)" }}>
                  {stats.blocked}
                </span>
                <span className="mf-stat-l">tür sert blok</span>
              </div>
            </div>
          </div>

          <div className="mf-hero-visual">
            <div className="card mf-tray-card" style={{ ["--rc" as string]: accent }}>
              <div className="mf-tray-card-top">
                <span className="chip" style={{ borderColor: "color-mix(in srgb, var(--rc) 40%, transparent)" }}>
                  <span aria-hidden="true">{recipe.emoji}</span> {recipe.name}
                </span>
                <span className="font-mono mf-tray-cycle">
                  {recipe.harvestDays[0]}–{recipe.harvestDays[1]} gün
                </span>
              </div>
              <TrayMockup color={accent} />
              <p className="mf-tray-cap">
                Görsel, seçtiğin reçetenin rengini alır. Aşağıdan bir çeşit seç → tepsi, evreler ve hesaplayıcı
                birlikte güncellenir.
              </p>
              <div className="mf-stamp">
                <StampBadge
                  ring="MİKRO FİLİZ · STÜDYO · 2026 · "
                  size={104}
                  center={
                    <div style={{ lineHeight: 1 }}>
                      <div className="font-mono" style={{ fontSize: 22, fontWeight: 600 }}>{stats.count}</div>
                      <div style={{ fontSize: 9, letterSpacing: "0.1em" }}>REÇETE</div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fill="var(--color-paper-50)" />

      {/* ==================== 2. GÜVENLİK KATALOĞU ==================== */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading
            n="01"
            eyebrow="Önce gıda güvenliği"
            title="Sert blok: bu türler reçeteye eklenemez"
          />
          <Reveal>
            <p className="mf-section-lead">
              Yenebilir bir bitkinin tohumu her zaman yenebilir mikro filiz vermez. Reçete motoru, aşağıdaki türleri
              <strong> sert blok</strong> olarak işaretler — bunlar bir çeşit olarak listeye <em>hiç</em> gelmez, bir
              uyarıyla geçiştirilmez. Kaynak: Penn State Extension, FDA FSMA Produce Safety, Utah State Extension.
            </p>
          </Reveal>

          <div className="mf-blocked">
            {BLOCKED_MICROGREENS.map((b, i) => (
              <Reveal i={i} key={b.name}>
                <div className="card mf-block-card">
                  <div className="mf-block-top">
                    <span className="mf-block-x" aria-hidden="true">
                      <X size={18} />
                    </span>
                    <div>
                      <strong className="mf-block-name">{b.name}</strong>
                      <span className="font-mono mf-block-fam">{b.family}</span>
                    </div>
                    <span className="chip chip-danger" style={{ marginLeft: "auto" }}>
                      <X size={12} /> Uygun değil
                    </span>
                  </div>
                  <p className="mf-block-reason">{b.reason}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mf-callout mf-callout--warn">
            <span className="mf-callout-ic"><Droplet size={18} /></span>
            <p>
              <strong>Yıkama varsayılan değildir.</strong> Mikro filizde yıkama, mikrobiyel riski her zaman
              düşürmez; ıslak ürün raf ömrünü kısaltır. Yıkama kararı tohum kaynağı, su kalitesi ve teslimat
              zincirine göre ayrı verilir — reçete bunu otomatik varsaymaz.
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 3. REÇETE KARTLARI ==================== */}
      <section className="section" id="recete">
        <div className="container-x">
          <NumberedHeading
            n="02"
            eyebrow="Doğrulanmış reçeteler"
            title="Her çeşit bir aralık, tek bir sabit değil"
          />
          <Reveal>
            <p className="mf-section-lead">
              Yoğunluk, karartma ve hasat günleri birer <strong>aralık</strong> olarak verilir — tek bir “doğru
              sayı” yoktur. Bu aralıklar Penn State ve Utah State Extension verilerine dayanır ve kendi tepsin,
              tohum lotun ve iklimin ile kalibre edilir. Bir kartı seçtiğinde büyüme evreleri ve maliyet
              hesaplayıcısı o reçeteye göre güncellenir.
            </p>
          </Reveal>

          <div className="mf-recipes">
            {MICROGREEN_RECIPES.map((r, i) => (
              <Reveal i={i % 4} key={r.id}>
                <RecipeCard
                  recipe={r}
                  selected={r.id === input.recipeId}
                  open={openId === r.id}
                  onSelect={() => set("recipeId", r.id)}
                  onToggle={() => setOpenId((o) => (o === r.id ? null : r.id))}
                  compareChecked={compareIds.includes(r.id)}
                  onToggleCompare={() => toggleCompare(r.id)}
                  compareDisabled={compareIds.length >= MAX_COMPARE}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 4. BÜYÜME EVRELERİ ==================== */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading
            n="03"
            eyebrow="Sürekli toprak çizgisi"
            title="Ekimden hasada büyüme evreleri"
          />
          <div className="card mf-stages-card" style={{ ["--rc" as string]: accent }}>
            <div className="mf-stages-head">
              <span className="mf-emoji mf-emoji--lg" aria-hidden="true">{recipe.emoji}</span>
              <div>
                <h3 style={{ margin: 0 }}>{recipe.name}</h3>
                <p className="mf-sci">{recipe.scientificName}</p>
              </div>
              <span className="chip" style={{ marginLeft: "auto" }}>
                <Calendar size={13} /> Toplam {recipe.harvestDays[0]}–{recipe.harvestDays[1]} gün
              </span>
            </div>

            <SoilLineStages stages={stages} />

            <p className="mf-stages-note">
              {recipe.presoakHours[1] === 0 ? (
                <>
                  <Sprout size={15} /> Bu çeşit <strong>ön ıslatma istemez</strong> — tohum doğrudan ekilir.
                </>
              ) : (
                <>
                  <Droplet size={15} /> Ön ıslatma <strong>{recipe.presoakHours[0]}–{recipe.presoakHours[1]} saat</strong>{" "}
                  zorunludur; atlanırsa çimlenme düzensizleşir.
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* ==================== 5. TEPSİ MALİYET HESAPLAYICI ==================== */}
      <section className="section" id="hesaplayici">
        <div className="container-x">
          <NumberedHeading
            n="04"
            eyebrow="GTM · edinme aracı"
            title="Tepsi başına maliyet ve marj hesaplayıcı"
          />
          <Reveal>
            <p className="mf-section-lead">
              Kendi rakamlarını gir; hesaplayıcı seçili reçetenin verim ve yoğunluk ortalamalarını kullanır. Bütün
              çıktılar girdilerinden türetilir — sahte bir “sektör ortalaması” eklenmez.
            </p>
          </Reveal>

          <div className="mf-calc">
            {/* --- Girdiler --- */}
            <div className="card mf-inputs">
              <div className="mf-inputs-group">
                <span className="mf-group-title">Reçete &amp; hacim</span>
                <label className="mf-field">
                  <span className="mf-field-top">
                    <span className="mf-field-label">Reçete</span>
                    <span className="mf-field-val font-mono">{recipe.emoji}</span>
                  </span>
                  <select
                    className="mf-select"
                    value={input.recipeId}
                    onChange={(e) => set("recipeId", e.target.value)}
                    aria-label="Reçete seç"
                  >
                    {MICROGREEN_RECIPES.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.expectedYieldG[0]}–{r.expectedYieldG[1]} g / tepsi
                      </option>
                    ))}
                  </select>
                </label>
                <SliderField
                  label="Haftalık tepsi"
                  value={input.traysPerWeek}
                  min={1}
                  max={200}
                  unit="tepsi"
                  onChange={(v) => set("traysPerWeek", v)}
                />
              </div>

              <div className="mf-inputs-group">
                <span className="mf-group-title">Maliyet girdileri</span>
                <SliderField
                  label="Tohum fiyatı"
                  value={input.seedCostPerKg}
                  min={20}
                  max={800}
                  step={5}
                  unit="TL/kg"
                  onChange={(v) => set("seedCostPerKg", v)}
                  hint={`Bu tepside ~${fmt((recipe.seedDensityGper1020[0] + recipe.seedDensityGper1020[1]) / 2)} g tohum`}
                />
                <SliderField
                  label="Substrat (tepsi başı)"
                  value={input.substrateCostPerTray}
                  min={0}
                  max={60}
                  unit="TL"
                  onChange={(v) => set("substrateCostPerTray", v)}
                />
                <SliderField
                  label="İşçilik ücreti"
                  value={input.laborCostPerHour}
                  min={40}
                  max={500}
                  step={5}
                  unit="TL/sa"
                  onChange={(v) => set("laborCostPerHour", v)}
                />
                <SliderField
                  label="İşçilik süresi (tepsi başı)"
                  value={input.laborMinutesPerTray}
                  min={1}
                  max={30}
                  unit="dk"
                  onChange={(v) => set("laborMinutesPerTray", v)}
                />
                <SliderField
                  label="Enerji (ışık + iklim)"
                  value={input.energyCostPerTray}
                  min={0}
                  max={40}
                  unit="TL"
                  onChange={(v) => set("energyCostPerTray", v)}
                />
                <SliderField
                  label="Ambalaj (tepsi başı)"
                  value={input.packagingPerTray}
                  min={0}
                  max={40}
                  unit="TL"
                  onChange={(v) => set("packagingPerTray", v)}
                />
              </div>

              <div className="mf-inputs-group">
                <span className="mf-group-title">Fire &amp; fiyat</span>
                <SliderField
                  label="Fire oranı"
                  value={input.wastePct}
                  min={0}
                  max={40}
                  unit="%"
                  onChange={(v) => set("wastePct", v)}
                  hint={`Satılabilir: ~${fmt(result.sellableGrams)} g`}
                />
                <SliderField
                  label="Satış fiyatı"
                  value={input.sellPricePer100g}
                  min={20}
                  max={300}
                  step={5}
                  unit="TL/100g"
                  onChange={(v) => set("sellPricePer100g", v)}
                />
              </div>
            </div>

            {/* --- Sonuçlar --- */}
            <div className="mf-results">
              <div className="mf-kpis">
                <KpiCard
                  label="Tepsi başı kâr"
                  value={fmt(result.profitPerTray, 0)}
                  unit="TL"
                  delta={{
                    value: `%${fmt(result.marginPct)} marj`,
                    dir: profitable ? "up" : "down",
                    good: profitable,
                  }}
                  color={accent}
                />
                <KpiCard
                  label="Net marj"
                  value={`%${fmt(result.marginPct)}`}
                  delta={{
                    value: profitable ? "kârlı" : "zararına",
                    dir: profitable ? "up" : "down",
                    good: profitable,
                  }}
                  color={accent}
                />
                <KpiCard
                  label="Haftalık kâr"
                  value={fmt(result.weeklyProfit, 0)}
                  unit="TL"
                  delta={{ value: `${fmt(input.traysPerWeek)} tepsi/hafta`, dir: "flat" }}
                  color={accent}
                />
                <KpiCard
                  label="Aylık kâr"
                  value={fmt(result.monthlyProfit, 0)}
                  unit="TL"
                  data={[
                    result.weeklyProfit,
                    result.weeklyProfit * 2,
                    result.weeklyProfit * 3,
                    result.weeklyProfit * 4,
                    result.weeklyProfit * 4.33,
                  ]}
                  color={accent}
                />
              </div>

              <div className="mf-result-lower">
                <div className="card mf-margin-card">
                  <RadialGauge
                    value={Math.max(0, result.marginPct)}
                    size={148}
                    label={`%${fmt(result.marginPct)}`}
                    sub="net marj"
                    color={profitable ? accent : "var(--color-danger)"}
                  />
                  <div className="mf-be">
                    <span className="mf-be-label font-mono">Başabaş fiyat</span>
                    <span className="mf-be-val font-mono">
                      {fmt(result.breakEvenPricePer100g, 1)} <em>TL/100g</em>
                    </span>
                    <span
                      className={`chip ${input.sellPricePer100g >= result.breakEvenPricePer100g ? "chip-ok" : "chip-danger"}`}
                    >
                      {input.sellPricePer100g >= result.breakEvenPricePer100g ? (
                        <>
                          <ShieldCheck size={12} /> Fiyat başabaşın üstünde
                        </>
                      ) : (
                        <>
                          <X size={12} /> Fiyat başabaşın altında
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="card mf-breakdown">
                  <div className="mf-bd-head">
                    <span className="mf-group-title" style={{ margin: 0 }}>Tepsi başı maliyet dökümü</span>
                    <div className="mf-bd-totals font-mono">
                      <span>
                        Gelir <strong style={{ color: "var(--color-success)" }}>{fmt(result.revenuePerTray)} TL</strong>
                      </span>
                      <span>
                        Maliyet <strong>{fmt(result.totalCostPerTray)} TL</strong>
                      </span>
                    </div>
                  </div>
                  <div className="mf-bd-bar" role="img" aria-label="Maliyet bileşenleri oranı">
                    {breakdown.map((b) => (
                      <span
                        key={b.key}
                        style={{ width: `${(b.value / total) * 100}%`, background: b.color }}
                        title={`${b.label}: ${fmt(b.value)} TL`}
                      />
                    ))}
                  </div>
                  <ul className="mf-bd-legend">
                    {breakdown.map((b) => (
                      <li key={b.key}>
                        <span className="mf-bd-sw" style={{ background: b.color }} aria-hidden="true" />
                        <span className="mf-bd-name">{b.label}</span>
                        <span className="font-mono mf-bd-val">
                          {fmt(b.value)} TL
                          <em>· %{fmt((b.value / total) * 100)}</em>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mf-callout">
                <span className="mf-callout-ic"><Scale size={18} /></span>
                <p>
                  Bu model reçetenin <strong>verim ortalamasını</strong> kullanır ({recipe.expectedYieldG[0]}–
                  {recipe.expectedYieldG[1]} g aralığının ortası). Gerçek verim tohum lotu, mevsim ve rafına göre
                  değişir — sonuçları kendi ilk üç tepsinle kalibre et. Skor değil, senin girdilerin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. RESTORAN ABONELİĞİ ==================== */}
      <section className="section paper-section">
        <div className="container-x">
          <NumberedHeading
            n="05"
            eyebrow="Restoran aboneliği"
            title="Sabit teslimat gününe geriye planlama"
          />
          <div className="mf-sub">
            <div className="card mf-sub-plan">
              <p className="mf-sub-intro">
                Şeflere <strong>her hafta aynı gün</strong> teslim etmek için ekim gününü geriye doğru planlarsın.
                <span className="font-mono mf-sub-recipe"> {recipe.emoji} {recipe.name}</span> için ortalama{" "}
                <strong>{avgHarvest} gün</strong> hasat süresi:
              </p>
              <div className="mf-plan-line" style={{ ["--rc" as string]: accent }}>
                <div className="mf-plan-node">
                  <span className="mf-plan-ic"><Sprout size={16} /></span>
                  <strong>Ekim</strong>
                  <span className="font-mono">{WEEKDAYS_TR[sowIdx]}</span>
                </div>
                <span className="mf-plan-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
                <div className="mf-plan-node">
                  <span className="mf-plan-ic"><Sun size={16} /></span>
                  <strong>Işık</strong>
                  <span className="font-mono">{recipe.blackoutDays[1]}. gün</span>
                </div>
                <span className="mf-plan-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
                <div className="mf-plan-node">
                  <span className="mf-plan-ic"><Leaf size={16} /></span>
                  <strong>Hasat</strong>
                  <span className="font-mono">{avgHarvest}. gün</span>
                </div>
                <span className="mf-plan-arrow" aria-hidden="true"><ArrowRight size={16} /></span>
                <div className="mf-plan-node mf-plan-node--end">
                  <span className="mf-plan-ic"><Store size={16} /></span>
                  <strong>Teslimat</strong>
                  <span className="font-mono">{WEEKDAYS_TR[deliveryIdx]}</span>
                </div>
              </div>
              <p className="mf-hint" style={{ marginTop: 6 }}>
                Cuma teslimatını yakalamak için {WEEKDAYS_TR[sowIdx]} günü ek. Reçeteyi değiştirince ekim günü
                yeniden hesaplanır.
              </p>
            </div>

            <div className="card mf-sub-succ">
              <span className="mf-group-title">Ardışık ekim → kesintisiz arz</span>
              <p className="mf-hint" style={{ marginBottom: 14 }}>
                Her hafta yeni bir parti ekersen, {growWeeks} haftalık döngü kaydırmalı ilerler ve her hafta bir
                hasat düşer.
              </p>
              <div
                className="mf-succ-grid"
                style={{
                  ["--cols" as string]: totalWeeks,
                  ["--rc" as string]: accent,
                }}
              >
                <div className="mf-succ-weeks">
                  {Array.from({ length: totalWeeks }, (_, w) => (
                    <span key={w} className="font-mono">H{w + 1}</span>
                  ))}
                </div>
                {[0, 1, 2].map((batch) => (
                  <div key={batch} className="mf-succ-row">
                    <span className="mf-succ-label font-mono">P{batch + 1}</span>
                    <span
                      className="mf-succ-bar"
                      style={{
                        gridColumnStart: batch + 2,
                        gridColumnEnd: batch + 2 + growWeeks,
                      }}
                    >
                      <span className="mf-succ-harvest" aria-hidden="true">✂</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="mf-hint" style={{ marginTop: 12 }}>
                <Store size={14} /> Bu bir planlama şablonudur, garantili verim değil — parti sayısını gerçek
                sipariş hacmine göre ayarla.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 6. GERÇEK KAPASİTE PLANLAMA ==================== */}
      <section className="section" id="kapasite">
        <div className="container-x">
          <NumberedHeading
            n="06"
            eyebrow="Gerçek oda + abonelik"
            title="Kendi odanın kapasitesini planla"
          />
          {!hasSession ? (
            <div className="card mf-callout">
              <span className="mf-callout-ic"><ShieldCheck size={18} /></span>
              <p>
                Kendi oda profilini ve restoran aboneliklerini kaydetmek için giriş yapmalısın.{" "}
                <Link href="/giris" className="btn btn-primary btn-sm" style={{ marginLeft: 8 }}>
                  Giriş yap
                </Link>
              </p>
            </div>
          ) : (
            <div className="mf-calc">
              <div className="card mf-inputs" style={{ position: "static" }}>
                <span className="mf-group-title">Oda profili</span>
                <form action={roomAction} style={{ display: "grid", gap: 10 }}>
                  <label className="mf-field">
                    <span className="mf-field-label">Raf sayısı</span>
                    <input name="shelves" type="number" min={1} step={1} defaultValue={room?.shelves ?? 4} required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-label">Raf başına kat</span>
                    <input name="levelsPerShelf" type="number" min={1} step={1} defaultValue={room?.levelsPerShelf ?? 4} required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-label">Kat başına tepsi</span>
                    <input name="traysPerLevel" type="number" min={1} step={1} defaultValue={room?.traysPerLevel ?? 6} required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-label">Hava akımı faktörü (0–1)</span>
                    <input name="airflowFactor" type="number" min={0.1} max={1} step={0.05} defaultValue={room?.airflowFactor ?? 0.85} required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  </label>
                  <button type="submit" disabled={roomPending} className="btn btn-primary btn-sm" style={{ justifySelf: "start" }}>
                    Oda profilini kaydet
                  </button>
                  {(roomState.error || roomState.success) && (
                    <p style={{ fontSize: "var(--fs-xs)", color: roomState.error ? "var(--color-danger)" : "var(--text-mid)" }}>
                      {roomState.error ?? roomState.success}
                    </p>
                  )}
                </form>

                <span className="mf-group-title" style={{ marginTop: 18 }}>Restoran aboneliği ekle</span>
                <form action={subAction} style={{ display: "grid", gap: 10 }}>
                  <label className="mf-field">
                    <span className="mf-field-label">Reçete</span>
                    <select name="recipeId" className="btn btn-secondary" defaultValue={MICROGREEN_RECIPES[0]?.id}>
                      {MICROGREEN_RECIPES.map((r) => (
                        <option key={r.id} value={r.id}>{r.emoji} {r.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-label">Haftalık tepsi</span>
                    <input name="traysPerWeek" type="number" min={1} step={1} defaultValue={4} required className="btn btn-secondary" style={{ textAlign: "left" }} />
                  </label>
                  <label className="mf-field">
                    <span className="mf-field-label">Teslimat günü</span>
                    <select name="deliveryDay" className="btn btn-secondary" defaultValue={5}>
                      {WEEKDAYS_TR.map((d, i) => (
                        <option key={d} value={i}>{d}</option>
                      ))}
                    </select>
                  </label>
                  <button type="submit" disabled={subPending} className="btn btn-primary btn-sm" style={{ justifySelf: "start" }}>
                    Abonelik ekle
                  </button>
                  {(subState.error || subState.success) && (
                    <p style={{ fontSize: "var(--fs-xs)", color: subState.error ? "var(--color-danger)" : "var(--text-mid)" }}>
                      {subState.error ?? subState.success}
                    </p>
                  )}
                </form>
              </div>

              <div className="mf-results">
                <div className="card" style={{ padding: 18 }}>
                  <span className="mf-group-title">Aktif abonelikler</span>
                  {subscriptions.length === 0 ? (
                    <p className="mf-hint" style={{ marginTop: 10 }}>Henüz abonelik eklenmedi.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {subscriptions.map((s) => {
                        const r = MICROGREEN_RECIPES.find((rec) => rec.id === s.recipeId);
                        return (
                          <div key={s.id} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hair)", paddingBottom: 8 }}>
                            <p style={{ fontSize: "var(--fs-sm)" }}>
                              {r?.emoji} {r?.name ?? s.recipeId} — {s.traysPerWeek} tepsi/hafta, {WEEKDAYS_TR[s.deliveryDay]} teslim
                            </p>
                            <button type="button" className="btn btn-ghost btn-sm" disabled={removePending} onClick={() => handleRemoveSubscription(s.id)}>
                              Kaldır
                            </button>
                            {removeMsg[s.id] && <p style={{ width: "100%", fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{removeMsg[s.id]}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {!room ? (
                  <div className="card mf-callout mf-callout--warn">
                    <span className="mf-callout-ic"><Beaker size={18} /></span>
                    <p>Kapasite hesaplanamıyor — önce sol taraftan bir oda profili kaydet.</p>
                  </div>
                ) : capacityPlan ? (
                  <div className={`card mf-callout ${capacityPlan.feasible ? "" : "mf-callout--warn"}`}>
                    <span className="mf-callout-ic">{capacityPlan.feasible ? <ShieldCheck size={18} /> : <X size={18} />}</span>
                    <div>
                      <p>
                        Haftalık toplam <strong>{capacityPlan.totalTraysPerWeek} tepsi</strong> talep, oda kapasitesi{" "}
                        <strong>{capacityPlan.capacity} tepsi</strong>.{" "}
                        {capacityPlan.feasible ? "Kapasite yeterli." : `${capacityPlan.overflowTrays} tepsi kapasiteyi aşıyor.`}
                      </p>
                      {capacityPlan.suggestion && <p style={{ marginTop: 6 }}>{capacityPlan.suggestion}</p>}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {compareIds.length > 0 && !compareOpen && (
        <div className="compare-bar" role="status">
          <span className="font-mono" style={{ fontSize: "var(--fs-sm)" }}>
            {compareIds.length} reçete seçili {compareIds.length < 2 && "(en az 2 seçin)"}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setCompareIds([])}>
              Temizle
            </button>
            <button className="btn btn-primary btn-sm" disabled={compareIds.length < 2} onClick={() => setCompareOpen(true)}>
              Karşılaştır <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {compareOpen && compareIds.length >= 2 && (
        <RecipeCompareModal
          recipes={compareIds.map((id) => MICROGREEN_RECIPES.find((r) => r.id === id)).filter((r): r is MicrogreenRecipe => Boolean(r))}
          onClose={() => setCompareOpen(false)}
          onRemove={(id) => {
            setCompareIds((prev) => prev.filter((x) => x !== id));
            if (compareIds.length <= 2) setCompareOpen(false);
          }}
        />
      )}

      {/* ---------- sayfa-özel stil (global CSS'e dokunmadan) ---------- */}
      <style>{`
        .mf-root { --mf-radius: var(--radius-card); }

        /* HERO */
        .mf-hero { position: relative; overflow: hidden; padding-block: clamp(3rem, 7vw, 6rem); }
        .mf-hero-grid {
          display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 3rem; align-items: center;
        }
        .mf-hero-title { font-size: var(--fs-display); line-height: 1.02; margin: 0.4rem 0 0; }
        .mf-lead { font-size: var(--fs-lead); color: var(--text-mid); max-width: 40ch; margin-top: 1rem; }
        .mf-vprops { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
        .mf-vprop { display: flex; gap: 0.75rem; align-items: flex-start; }
        .mf-vicon {
          flex: none; width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center;
          background: color-mix(in srgb, var(--primary) 10%, transparent); color: var(--primary);
          border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
        }
        .mf-vprop strong { display: block; font-size: var(--fs-base); }
        .mf-vprop span { color: var(--text-mid); font-size: var(--fs-sm); }
        .mf-hero-cta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.75rem; }
        .mf-hero-stats { display: flex; gap: 2rem; margin-top: 2rem; flex-wrap: wrap; }
        .mf-hero-stats > div { display: flex; flex-direction: column; }
        .mf-stat-n { font-size: 1.6rem; font-weight: 600; color: var(--text-hi); line-height: 1; }
        .mf-stat-l { font-size: var(--fs-sm); color: var(--text-low); margin-top: 4px; }

        .mf-hero-visual { position: relative; }
        .mf-tray-card { position: relative; padding: 1.25rem; overflow: visible; }
        .mf-tray-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
        .mf-tray-cycle { font-size: var(--fs-sm); color: var(--text-mid); }
        .mf-tray-cap { font-size: var(--fs-sm); color: var(--text-mid); margin-top: 0.75rem; line-height: 1.5; }
        .mf-stamp { position: absolute; right: -18px; bottom: -22px; }

        /* Bölüm ortak */
        .mf-section-lead { font-size: var(--fs-lead); color: var(--text-mid); max-width: 68ch; margin: -0.5rem 0 2rem; line-height: 1.55; }
        .mf-section-lead strong { color: var(--text-hi); }

        /* GÜVENLİK */
        .mf-blocked { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(280px, 100%), 1fr)); gap: 1rem; }
        .mf-block-card { padding: 1.1rem 1.2rem; border-left: 3px solid var(--color-danger); }
        .mf-block-top { display: flex; align-items: center; gap: 0.7rem; }
        .mf-block-x {
          flex: none; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center;
          background: color-mix(in srgb, var(--color-danger) 14%, transparent); color: var(--color-danger);
        }
        .mf-block-name { display: block; font-family: var(--font-display); font-size: var(--fs-lg); }
        .mf-block-fam { font-size: var(--fs-xs); color: var(--text-low); }
        .mf-block-reason { margin-top: 0.65rem; font-size: var(--fs-sm); color: var(--text-mid); line-height: 1.5; }

        .mf-callout {
          display: flex; gap: 0.85rem; align-items: flex-start; margin-top: 1.75rem;
          padding: 1rem 1.2rem; border-radius: var(--radius-card);
          background: var(--bg-surface-2); border: 1px solid var(--border-hair);
        }
        .mf-callout p { font-size: var(--fs-sm); color: var(--text-mid); line-height: 1.55; }
        .mf-callout strong { color: var(--text-hi); }
        .mf-callout-ic {
          flex: none; width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center;
          background: color-mix(in srgb, var(--primary) 12%, transparent); color: var(--primary);
        }
        .mf-callout--warn { border-color: color-mix(in srgb, var(--color-warning) 34%, transparent); background: color-mix(in srgb, var(--color-warning) 8%, transparent); }
        .mf-callout--warn .mf-callout-ic { background: color-mix(in srgb, var(--color-warning) 18%, transparent); color: var(--color-warning); }

        /* REÇETE KARTLARI */
        .mf-recipes { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(290px, 100%), 1fr)); gap: 1.1rem; }
        .mf-recipe { position: relative; overflow: hidden; padding: 0; transition: transform var(--dur-base) var(--ease-out-soft), border-color var(--dur-base) ease, box-shadow var(--dur-base) ease; }
        .mf-recipe:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
        .mf-recipe--on { border-color: var(--rc); box-shadow: 0 0 0 2px color-mix(in srgb, var(--rc) 40%, transparent), var(--shadow-md); }
        .mf-recipe-strip { display: block; height: 6px; background: var(--rc); }
        .mf-recipe-body { padding: 1.1rem 1.2rem 1.2rem; }
        .mf-recipe-head { display: flex; gap: 0.8rem; align-items: flex-start; }
        .mf-emoji {
          flex: none; width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center;
          font-size: 24px; background: color-mix(in srgb, var(--rc) 14%, transparent);
          border: 1px solid color-mix(in srgb, var(--rc) 30%, transparent);
        }
        .mf-emoji--lg { width: 56px; height: 56px; font-size: 30px; }
        .mf-recipe-name { margin: 0; font-size: var(--fs-lg); line-height: 1.1; }
        .mf-sci { font-style: italic; font-size: var(--fs-sm); color: var(--text-mid); margin: 2px 0 0; }
        .mf-family { font-size: 11px; color: var(--text-low); letter-spacing: 0.04em; margin: 2px 0 0; }
        .mf-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.85rem; }
        .mf-flavor { font-size: var(--fs-sm); color: var(--text-mid); margin-top: 0.75rem; }
        .mf-diff { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
        .mf-diff-label { font-size: var(--fs-xs); color: var(--text-low); text-transform: uppercase; letter-spacing: 0.06em; }
        .mf-dots { display: inline-flex; gap: 4px; }
        .mf-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--bg-inset); border: 1px solid var(--border-soft); }
        .mf-dot[data-on="true"] { background: var(--rc); border-color: var(--rc); }
        .mf-diff-word { font-size: var(--fs-xs); font-weight: 600; color: var(--text-mid); }
        .mf-metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.4rem 1rem; margin: 0.9rem 0 0; padding: 0.8rem 0 0; border-top: 1px solid var(--border-hair); }
        .mf-metrics > div { display: flex; justify-content: space-between; gap: 0.5rem; }
        .mf-metrics dt { font-size: var(--fs-xs); color: var(--text-low); }
        .mf-metrics dd { margin: 0; font-size: var(--fs-sm); font-weight: 600; color: var(--text-hi); }
        .mf-note { font-size: var(--fs-sm); color: var(--text-mid); margin-top: 0.85rem; line-height: 1.5; padding-left: 0.7rem; border-left: 2px solid color-mix(in srgb, var(--rc) 45%, transparent); }
        .mf-fails { list-style: none; margin: 0.85rem 0 0; padding: 0.75rem 0.9rem; display: grid; gap: 0.5rem; background: var(--bg-surface-2); border-radius: 10px; animation: fade-up 250ms var(--ease-out) both; }
        .mf-fails li { display: flex; gap: 0.5rem; align-items: flex-start; font-size: var(--fs-sm); color: var(--text-mid); }
        .mf-fails li svg { flex: none; margin-top: 2px; color: var(--color-danger); }
        .mf-recipe-foot { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-top: 1rem; }
        .mf-caret { display: inline-block; transition: transform var(--dur-fast) ease; margin-left: 4px; }
        .mf-caret[data-open="true"] { transform: rotate(180deg); }

        /* KARŞILAŞTIRMA (src/lib/compareCrops.ts'teki desenle aynı) */
        .compare-toggle {
          position: absolute; top: 10px; right: 10px; z-index: 2;
          display: flex; align-items: center; gap: 5px;
          padding: 4px 8px; border-radius: 999px;
          background: color-mix(in srgb, var(--bg-surface) 88%, transparent);
          border: 1px solid var(--border-hair);
          font-size: 10px; color: var(--text-low);
          cursor: pointer; backdrop-filter: blur(4px);
          transition: border-color 150ms ease, color 150ms ease;
        }
        .compare-toggle:has(input:checked) { border-color: var(--primary); color: var(--primary); }
        .compare-toggle input:disabled { cursor: not-allowed; }
        .compare-toggle input { cursor: pointer; }
        .compare-bar {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          z-index: 55; display: flex; align-items: center; gap: 16px;
          padding: 12px 18px; border-radius: 999px;
          background: var(--bg-surface); border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-lg);
        }
        .compare-table { border-collapse: collapse; width: 100%; min-width: 480px; }
        .compare-table th, .compare-table td { border-bottom: 1px solid var(--border-hair); padding: 10px 12px; }
        .compare-table thead th { border-bottom: 2px solid var(--border-soft); }

        /* BÜYÜME EVRELERİ */
        .mf-stages-card { padding: 1.5rem 1.6rem 1.6rem; }
        .mf-stages-head { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.5rem; }
        .mf-stages-note { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.5rem; font-size: var(--fs-sm); color: var(--text-mid); }
        .mf-stages-note svg { flex: none; color: var(--rc); }
        .mf-stages-note strong { color: var(--text-hi); }

        /* HESAPLAYICI */
        .mf-calc { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 1.25rem; align-items: start; }
        .mf-inputs { padding: 1.3rem; display: grid; gap: 1.4rem; position: sticky; top: 84px; }
        .mf-inputs-group { display: grid; gap: 0.9rem; }
        .mf-group-title { font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-low); }
        .mf-field { display: grid; gap: 0.4rem; }
        .mf-field-top { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
        .mf-field-label { font-size: var(--fs-sm); color: var(--text-mid); font-weight: 500; }
        .mf-field-val { font-size: var(--fs-sm); font-weight: 600; color: var(--text-hi); }
        .mf-field-val em { color: var(--text-low); font-style: normal; font-weight: 500; font-size: var(--fs-xs); }
        .mf-range { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 999px; background: var(--bg-inset); outline-offset: 4px; cursor: pointer; }
        .mf-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-surface); box-shadow: var(--shadow-sm); cursor: pointer; transition: transform var(--dur-fast) ease; }
        .mf-range::-webkit-slider-thumb:hover { transform: scale(1.15); }
        .mf-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--primary); border: 2px solid var(--bg-surface); box-shadow: var(--shadow-sm); cursor: pointer; }
        .mf-hint { font-size: var(--fs-xs); color: var(--text-low); display: inline-flex; align-items: center; gap: 0.35rem; }
        .mf-select { width: 100%; height: 40px; padding: 0 0.75rem; border-radius: var(--radius-control); border: 1px solid var(--border-soft); background: var(--bg-surface); color: var(--text-hi); font-family: var(--font-sans); font-size: var(--fs-sm); cursor: pointer; }
        .mf-select:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }

        .mf-results { display: grid; gap: 1.1rem; }
        .mf-kpis { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.9rem; }
        .mf-result-lower { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 1.1rem; }
        .mf-margin-card { padding: 1.3rem; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .mf-be { display: grid; justify-items: center; gap: 0.4rem; text-align: center; }
        .mf-be-label { font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-low); }
        .mf-be-val { font-size: 1.35rem; font-weight: 600; color: var(--text-hi); }
        .mf-be-val em { font-size: var(--fs-xs); color: var(--text-low); font-style: normal; }
        .mf-breakdown { padding: 1.3rem; }
        .mf-bd-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.9rem; }
        .mf-bd-totals { display: flex; flex-direction: column; gap: 2px; text-align: right; font-size: var(--fs-sm); color: var(--text-mid); }
        .mf-bd-bar { display: flex; height: 22px; border-radius: 999px; overflow: hidden; background: var(--bg-inset); }
        .mf-bd-bar > span { display: block; height: 100%; transition: width var(--dur-slow) var(--ease-out); }
        .mf-bd-legend { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: 0.55rem; }
        .mf-bd-legend li { display: flex; align-items: center; gap: 0.6rem; }
        .mf-bd-sw { width: 12px; height: 12px; border-radius: 3px; flex: none; }
        .mf-bd-name { font-size: var(--fs-sm); color: var(--text-mid); }
        .mf-bd-val { margin-left: auto; font-size: var(--fs-sm); font-weight: 600; color: var(--text-hi); }
        .mf-bd-val em { font-style: normal; font-weight: 500; color: var(--text-low); margin-left: 4px; font-size: var(--fs-xs); }

        /* RESTORAN */
        .mf-sub { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; align-items: start; }
        .mf-sub-plan, .mf-sub-succ { padding: 1.4rem 1.5rem; }
        .mf-sub-intro { font-size: var(--fs-base); color: var(--text-mid); line-height: 1.55; margin-bottom: 1.2rem; }
        .mf-sub-intro strong { color: var(--text-hi); }
        .mf-sub-recipe { color: var(--rc, var(--primary)); font-weight: 600; }
        .mf-plan-line { display: flex; align-items: stretch; gap: 0.5rem; flex-wrap: wrap; }
        .mf-plan-node { flex: 1; min-width: 92px; display: grid; justify-items: center; gap: 3px; padding: 0.75rem 0.5rem; border-radius: 12px; background: var(--bg-surface-2); border: 1px solid var(--border-hair); text-align: center; }
        .mf-plan-node strong { font-size: var(--fs-sm); }
        .mf-plan-node span.font-mono { font-size: var(--fs-xs); color: var(--text-low); }
        .mf-plan-node--end { background: color-mix(in srgb, var(--rc) 12%, transparent); border-color: color-mix(in srgb, var(--rc) 35%, transparent); }
        .mf-plan-ic { width: 30px; height: 30px; border-radius: 8px; display: grid; place-items: center; background: color-mix(in srgb, var(--rc) 14%, transparent); color: var(--rc); }
        .mf-plan-arrow { display: grid; place-items: center; color: var(--text-low); }

        .mf-succ-grid { display: grid; grid-template-columns: 28px repeat(var(--cols), 1fr); gap: 6px; align-items: center; }
        .mf-succ-weeks { grid-column: 2 / -1; display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 6px; margin-bottom: 4px; }
        .mf-succ-weeks span { font-size: 10px; color: var(--text-low); text-align: center; }
        .mf-succ-row { grid-column: 1 / -1; display: grid; grid-template-columns: 28px repeat(var(--cols), 1fr); gap: 6px; align-items: center; }
        .mf-succ-label { font-size: 11px; color: var(--text-low); }
        .mf-succ-bar { grid-row: 1; height: 22px; border-radius: 999px; background: linear-gradient(90deg, color-mix(in srgb, var(--rc) 55%, transparent), var(--rc)); display: flex; align-items: center; justify-content: flex-end; padding-right: 6px; color: #fff; font-size: 12px; }
        .mf-succ-bar { grid-column-start: 2; }
        .mf-succ-harvest { line-height: 1; }

        /* RESPONSIVE */
        @media (max-width: 960px) {
          .mf-hero-grid { grid-template-columns: 1fr; }
          .mf-hero-visual { max-width: 460px; }
          .mf-calc { grid-template-columns: 1fr; }
          .mf-inputs { position: static; }
          .mf-result-lower { grid-template-columns: 1fr; }
          .mf-sub { grid-template-columns: 1fr; }
        }
        @media (max-width: 560px) {
          .mf-kpis { grid-template-columns: 1fr; }
          .mf-metrics { grid-template-columns: 1fr; }
          .mf-hero-stats { gap: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
