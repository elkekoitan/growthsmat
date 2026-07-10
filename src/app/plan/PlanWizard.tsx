"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  runAssessment,
  assessCrop,
  CITIES,
  CLIMATE_ZONES,
  CITY_TO_ZONE,
  GOAL_LABELS,
  ENGINE_VERSION,
  type SiteProfile,
  type CandidateResult,
  type AssessmentResult,
  type Goal,
} from "@/lib/suitability";
import {
  METHOD_LABELS,
  SEASON_LABELS,
  EVIDENCE_LABELS,
  type GrowMethod,
  type Season,
} from "@/data/crops";
import { RadialGauge, NumberedHeading } from "@/components/graphics";
import { SpotlightCard, CompareSlider } from "@/components/visuals";
import {
  MapPin,
  Layers,
  Sun,
  Droplet,
  Calendar,
  Scale,
  Check,
  X,
  ShieldCheck,
  Beaker,
  Sparkles,
  Leaf,
  Sprout,
  Store,
  ArrowRight,
  Clipboard,
} from "@/components/icons";

/* ============================================================================
   /plan — Üretim planı sihirbazı + uygunluk sonuçları
   Dürüstlük ilkesi: uygunluk SKORU (0-100) ile veri GÜVENİ (0-1) ayrı gösterilir.
   ============================================================================ */

const STORAGE_KEY = "sg-plan";

const DEFAULT_PROFILE: SiteProfile = {
  city: "İstanbul",
  method: "saksi",
  areaM2: 4,
  sunHours: 6,
  containerL: 20,
  waterAccess: 2,
  weeklyMinutes: 90,
  experience: 1,
  goal: "oz-tuketim",
  hasKidsOrPets: false,
  season: "ilkbahar",
  soilPh: undefined,
};

const nf = (n: number, d = 1) =>
  n.toLocaleString("tr-TR", { maximumFractionDigits: d });

function resolveProfile(
  raw: SiteProfile,
  phMeasured: boolean,
  phValue: number
): SiteProfile {
  return {
    ...raw,
    containerL: raw.method === "saksi" ? raw.containerL : undefined,
    soilPh: phMeasured ? phValue : undefined,
  };
}

const CONFIDENCE_META: Record<
  CandidateResult["confidenceLevel"],
  { label: string; chip: string; icon: ReactNode }
> = {
  yuksek: { label: "Yüksek güven", chip: "chip-ok", icon: <ShieldCheck size={13} /> },
  orta: { label: "Orta güven", chip: "chip-warn", icon: <Beaker size={13} /> },
  dusuk: { label: "Düşük güven", chip: "chip-danger", icon: <Beaker size={13} /> },
};

const METHOD_ICON: Record<GrowMethod, ReactNode> = {
  "acik-alan": <Sun size={18} />,
  "yukseltilmis-yatak": <Layers size={18} />,
  saksi: <Sprout size={18} />,
  sera: <ShieldCheck size={18} />,
  hidroponik: <Droplet size={18} />,
};

const GOAL_ICON: Record<Goal, ReactNode> = {
  "oz-tuketim": <Leaf size={18} />,
  ogrenme: <Beaker size={18} />,
  gelir: <Store size={18} />,
  "az-bakim": <Sun size={18} />,
};

const SEASON_DOT: Record<Season, string> = {
  ilkbahar: "var(--color-forest-400)",
  yaz: "var(--accent)",
  sonbahar: "var(--color-gold-600)",
  kis: "var(--color-info)",
};

const STEP_META = [
  { title: "Konum & yöntem", sub: "Nerede ve nasıl üreteceksiniz?", icon: <MapPin size={16} /> },
  { title: "Alan & kaynak", sub: "Elinizdeki alan, güneş, su ve zaman.", icon: <Sun size={16} /> },
  { title: "Hedef & profil", sub: "Neyi hedefliyor, neyi biliyorsunuz?", icon: <Sparkles size={16} /> },
];

function scoreColor(score: number) {
  return score >= 70
    ? "var(--primary)"
    : score >= 50
    ? "var(--accent)"
    : "var(--color-warning)";
}

/* — küçük yerel uyarı üçgeni (dikkat notları için, renk + biçim) — */
const WarnMark = () => (
  <svg
    width={15}
    height={15}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.9}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    style={{ flexShrink: 0, marginTop: 2 }}
  >
    <path d="M12 3l9 16H3L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export function PlanWizard() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<SiteProfile>(DEFAULT_PROFILE);
  const [phMeasured, setPhMeasured] = useState(false);
  const [phValue, setPhValue] = useState(6.5);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [runId, setRunId] = useState(0);

  // localStorage'tan geri yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.profile) setProfile({ ...DEFAULT_PROFILE, ...saved.profile });
      if (typeof saved.phMeasured === "boolean") setPhMeasured(saved.phMeasured);
      if (typeof saved.phValue === "number") setPhValue(saved.phValue);
      if (saved.completed && saved.profile) {
        const res = runAssessment(
          resolveProfile(
            { ...DEFAULT_PROFILE, ...saved.profile },
            saved.phMeasured ?? false,
            saved.phValue ?? 6.5
          )
        );
        setResult(res);
        setSelectedScenario(res.scenarios[0]?.id ?? null);
      }
    } catch {
      /* yok say */
    }
  }, []);

  const patch = (p: Partial<SiteProfile>) => setProfile((prev) => ({ ...prev, ...p }));

  const persist = (completed: boolean) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ profile, phMeasured, phValue, completed })
      );
    } catch {
      /* yok say */
    }
  };

  const generate = () => {
    const res = runAssessment(resolveProfile(profile, phMeasured, phValue));
    setResult(res);
    setSelectedScenario(res.scenarios[0]?.id ?? null);
    setRunId((n) => n + 1);
    persist(true);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const editPlan = () => {
    setResult(null);
    persist(false);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const zoneName = CLIMATE_ZONES[CITY_TO_ZONE[profile.city] ?? "marmara"].name;

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section
        className="mesh-light grain"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div
          className="container-narrow hero-stagger"
          style={{
            position: "relative",
            zIndex: 1,
            paddingBlock: "clamp(3rem, 7vw, 5rem) 2.25rem",
          }}
        >
          <span className="eyebrow">
            <Clipboard size={13} /> Üretim planı motoru · {ENGINE_VERSION}
          </span>
          <h1
            className="text-balance"
            style={{ margin: "18px 0 0", fontSize: "var(--fs-h1)", lineHeight: 1.05 }}
          >
            Konumunuza göre <span className="shimmer-text">dürüst</span> bir üretim
            planı
          </h1>
          <p
            className="text-pretty"
            style={{
              margin: "16px 0 0",
              color: "var(--text-mid)",
              fontSize: "var(--fs-lead)",
              maxWidth: 620,
            }}
          >
            Birkaç soruyla alanınıza uygun ürünleri sıralarız. Uygunluk{" "}
            <strong>skoru</strong> ile veri <strong>güveni</strong> ayrı gösterilir —
            veriniz eksikse bunu saklamayız, açıkça yazarız.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
            <span className="chip chip-info">
              <ShieldCheck size={13} /> Skor ≠ güven
            </span>
            <span className="chip">
              <MapPin size={13} /> 7 iklim bölgesi · 21 ürün
            </span>
            <span className="chip">
              <Beaker size={13} /> Kanıt seviyeli veri
            </span>
          </div>
        </div>
      </section>

      {result ? (
        <ResultsView
          key={runId}
          result={result}
          profile={profile}
          phValue={phValue}
          selectedScenario={selectedScenario}
          onSelectScenario={setSelectedScenario}
          onEdit={editPlan}
        />
      ) : (
        <Wizard
          step={step}
          setStep={setStep}
          profile={profile}
          patch={patch}
          phMeasured={phMeasured}
          setPhMeasured={setPhMeasured}
          phValue={phValue}
          setPhValue={setPhValue}
          zoneName={zoneName}
          onGenerate={generate}
        />
      )}
    </>
  );
}

/* ============================================================================
   SİHİRBAZ
   ============================================================================ */

function Wizard({
  step,
  setStep,
  profile,
  patch,
  phMeasured,
  setPhMeasured,
  phValue,
  setPhValue,
  zoneName,
  onGenerate,
}: {
  step: number;
  setStep: (n: number) => void;
  profile: SiteProfile;
  patch: (p: Partial<SiteProfile>) => void;
  phMeasured: boolean;
  setPhMeasured: (b: boolean) => void;
  phValue: number;
  setPhValue: (n: number) => void;
  zoneName: string;
  onGenerate: () => void;
}) {
  const last = STEP_META.length - 1;

  return (
    <section className="section" style={{ paddingBlock: "2.5rem 4.5rem" }}>
      <div className="container-narrow">
        {/* İlerleme */}
        <div style={{ marginBottom: 26 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 12,
                letterSpacing: "0.08em",
                color: "var(--text-low)",
                textTransform: "uppercase",
              }}
            >
              Adım {step + 1} / {STEP_META.length}
            </span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
              {STEP_META[step].sub}
            </span>
          </div>
          <div className="wiz-steps">
            {STEP_META.map((s, i) => {
              const state = i < step ? "done" : i === step ? "active" : "todo";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  className="wiz-step"
                  data-state={state}
                  disabled={i > step}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className="wiz-step-bar" />
                  <span className="wiz-step-label">
                    <span style={{ display: "inline-flex" }}>{s.icon}</span>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Adım içeriği */}
        <div key={step} className="wiz-panel">
          {step === 0 && <StepLocation profile={profile} patch={patch} zoneName={zoneName} />}
          {step === 1 && <StepResources profile={profile} patch={patch} />}
          {step === 2 && (
            <StepGoal
              profile={profile}
              patch={patch}
              phMeasured={phMeasured}
              setPhMeasured={setPhMeasured}
              phValue={phValue}
              setPhValue={setPhValue}
            />
          )}
        </div>

        {/* Navigasyon */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            marginTop: 28,
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Geri
          </button>
          {step < last ? (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
              İleri <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onGenerate}>
              <Sparkles size={16} /> Planı oluştur
            </button>
          )}
        </div>

        {/* Dürüstlük notu */}
        <div className="honesty-note" style={{ marginTop: 26 }}>
          <ShieldCheck size={18} />
          <p style={{ margin: 0 }}>
            İklim verisi <strong>{zoneName}</strong> bölge normalidir — parselinizin
            mikroklimasını temsil etmeyebilir. Toprak pH&apos;ınızı ölçmezseniz plan orta
            güvenle ilerler ve bunu her üründe belirtiriz.
          </p>
        </div>
      </div>

      <WizardStyles />
    </section>
  );
}

/* ---------- Adım 1: Konum & yöntem ---------- */

function StepLocation({
  profile,
  patch,
  zoneName,
}: {
  profile: SiteProfile;
  patch: (p: Partial<SiteProfile>) => void;
  zoneName: string;
}) {
  return (
    <div className="field-stack">
      <FieldShell n="01" icon={<MapPin size={16} />} label="Şehir">
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="select-wrap" style={{ flex: "1 1 220px" }}>
            <select
              value={profile.city}
              onChange={(e) => patch({ city: e.target.value })}
              aria-label="Şehir seçin"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <span className="chip chip-info">
            <MapPin size={13} /> {zoneName} bölgesi
          </span>
        </div>
        <p className="field-hint">
          Şehir, ürünleri bölgesel iklim normaline göre puanlar; parsel ölçümü değildir.
        </p>
      </FieldShell>

      <FieldShell n="02" icon={<Layers size={16} />} label="Üretim yöntemi">
        <OptionCards
          columns={3}
          value={profile.method}
          onChange={(v) => patch({ method: v })}
          options={(Object.keys(METHOD_LABELS) as GrowMethod[]).map((m) => ({
            v: m,
            label: METHOD_LABELS[m],
            icon: METHOD_ICON[m],
          }))}
        />
      </FieldShell>

      <FieldShell n="03" icon={<Calendar size={16} />} label="Ekim sezonu">
        <OptionCards
          columns={4}
          value={profile.season}
          onChange={(v) => patch({ season: v })}
          options={(Object.keys(SEASON_LABELS) as Season[]).map((s) => ({
            v: s,
            label: SEASON_LABELS[s],
            dot: SEASON_DOT[s],
          }))}
        />
        <p className="field-hint">
          Sera/tünel dışında, sezon penceresi kapalı ürünler sert kısıtla elenir.
        </p>
      </FieldShell>
    </div>
  );
}

/* ---------- Adım 2: Alan & kaynak ---------- */

function StepResources({
  profile,
  patch,
}: {
  profile: SiteProfile;
  patch: (p: Partial<SiteProfile>) => void;
}) {
  return (
    <div className="field-stack">
      <FieldShell n="01" icon={<Layers size={16} />} label="Ekilebilir alan">
        <SliderRow
          value={profile.areaM2}
          min={0.5}
          max={60}
          step={0.5}
          onChange={(v) => patch({ areaM2: v })}
          display={`${nf(profile.areaM2, 1)} m²`}
          minLabel="0,5 m² (balkon)"
          maxLabel="60 m²"
        />
      </FieldShell>

      <FieldShell n="02" icon={<Sun size={16} />} label="Günlük doğrudan güneş">
        <SliderRow
          value={profile.sunHours}
          min={0}
          max={14}
          step={0.5}
          onChange={(v) => patch({ sunHours: v })}
          display={`${nf(profile.sunHours, 1)} saat`}
          minLabel="Gölge"
          maxLabel="14 saat"
        />
        <p className="field-hint">
          Bir günü izleyip en güneşli aralığı sayın; yetersiz güneş sert kısıttır.
        </p>
      </FieldShell>

      {profile.method === "saksi" && (
        <FieldShell n="03" icon={<Sprout size={16} />} label="Tipik saksı / kap hacmi">
          <SliderRow
            value={profile.containerL ?? 0}
            min={2}
            max={80}
            step={1}
            onChange={(v) => patch({ containerL: v })}
            display={`${profile.containerL ?? 0} L`}
            minLabel="2 L"
            maxLabel="80 L"
          />
          <p className="field-hint">
            Kök hacmi türün minimumunun altındaysa o ürün elenir (ör. domates ≥ 20 L).
          </p>
        </FieldShell>
      )}

      <FieldShell
        n={profile.method === "saksi" ? "04" : "03"}
        icon={<Droplet size={16} />}
        label="Su erişimi"
      >
        <Segmented
          value={profile.waterAccess}
          onChange={(v) => patch({ waterAccess: v as 1 | 2 | 3 })}
          options={[
            { v: 1, label: "Kısıtlı" },
            { v: 2, label: "Orta" },
            { v: 3, label: "Rahat" },
          ]}
        />
      </FieldShell>

      <FieldShell
        n={profile.method === "saksi" ? "05" : "04"}
        icon={<Calendar size={16} />}
        label="Haftalık ayırabileceğiniz bakım süresi"
      >
        <SliderRow
          value={profile.weeklyMinutes}
          min={15}
          max={480}
          step={15}
          onChange={(v) => patch({ weeklyMinutes: v })}
          display={`${profile.weeklyMinutes} dk`}
          minLabel="15 dk"
          maxLabel={`8 sa · ~${nf(profile.weeklyMinutes / 60, 1)} sa`}
        />
      </FieldShell>
    </div>
  );
}

/* ---------- Adım 3: Hedef & profil ---------- */

function StepGoal({
  profile,
  patch,
  phMeasured,
  setPhMeasured,
  phValue,
  setPhValue,
}: {
  profile: SiteProfile;
  patch: (p: Partial<SiteProfile>) => void;
  phMeasured: boolean;
  setPhMeasured: (b: boolean) => void;
  phValue: number;
  setPhValue: (n: number) => void;
}) {
  return (
    <div className="field-stack">
      <FieldShell n="01" icon={<Sparkles size={16} />} label="Öncelikli hedefiniz">
        <OptionCards
          columns={2}
          value={profile.goal}
          onChange={(v) => patch({ goal: v })}
          options={(Object.keys(GOAL_LABELS) as Goal[]).map((g) => ({
            v: g,
            label: GOAL_LABELS[g],
            icon: GOAL_ICON[g],
          }))}
        />
        <p className="field-hint">
          &quot;Gelir&quot; seçilirse pazar talebi puana katılır; aksi halde nötr kalır.
        </p>
      </FieldShell>

      <FieldShell n="02" icon={<Leaf size={16} />} label="Deneyim seviyeniz">
        <Segmented
          value={profile.experience}
          onChange={(v) => patch({ experience: v as 1 | 2 | 3 })}
          options={[
            { v: 1, label: "Yeni" },
            { v: 2, label: "Orta" },
            { v: 3, label: "Deneyimli" },
          ]}
        />
      </FieldShell>

      <FieldShell n="03" icon={<ShieldCheck size={16} />} label="Evde çocuk / evcil hayvan">
        <ToggleRow
          checked={profile.hasKidsOrPets}
          onChange={(b) => patch({ hasKidsOrPets: b })}
          onLabel="Var — temkin notları göster"
          offLabel="Yok"
        />
        <p className="field-hint">
          Açıksa, yaprağı/olgunlaşmamış kısmı riskli türlerde ek uyarı gösteririz.
        </p>
      </FieldShell>

      <FieldShell n="04" icon={<Beaker size={16} />} label="Toprak pH (opsiyonel)">
        <ToggleRow
          checked={phMeasured}
          onChange={setPhMeasured}
          onLabel="Ölçtüm"
          offLabel="Ölçmedim — bölgesel varsayım kullan"
        />
        {phMeasured && (
          <div style={{ marginTop: 14 }}>
            <SliderRow
              value={phValue}
              min={4.5}
              max={8.5}
              step={0.1}
              onChange={setPhValue}
              display={`pH ${nf(phValue, 1)}`}
              minLabel="4,5 asidik"
              maxLabel="8,5 bazik"
            />
          </div>
        )}
        <div
          className={phMeasured ? "chip chip-ok" : "chip chip-warn"}
          style={{ marginTop: 12 }}
        >
          {phMeasured ? <ShieldCheck size={13} /> : <WarnMark />}
          {phMeasured
            ? "Ölçüm mevcut — toprak skoru ve güven yükselir"
            : "Varsayım kullanılacak — güven düşer, boşluk olarak listelenir"}
        </div>
      </FieldShell>
    </div>
  );
}

/* ============================================================================
   ORTAK ALAN BİLEŞENLERİ
   ============================================================================ */

function FieldShell({
  n,
  label,
  icon,
  children,
}: {
  n: string;
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="field-shell">
      <div className="field-head">
        <span className="font-mono field-num">{n}</span>
        <span className="field-ic">{icon}</span>
        <span className="field-label">{label}</span>
      </div>
      {children}
    </div>
  );
}

function OptionCards<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string; icon?: ReactNode; dot?: string; sub?: string }[];
  columns?: number;
}) {
  return (
    <div
      className="opt-grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const active = o.v === value;
        return (
          <button
            key={o.v}
            type="button"
            className="opt-card"
            data-active={active}
            aria-pressed={active}
            onClick={() => onChange(o.v)}
          >
            {o.icon && <span className="opt-ic">{o.icon}</span>}
            {o.dot && (
              <span
                aria-hidden="true"
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 999,
                  background: o.dot,
                  display: "inline-block",
                }}
              />
            )}
            <span className="opt-label">{o.label}</span>
            {o.sub && <span className="opt-sub">{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

function Segmented<T extends number | string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string }[];
}) {
  return (
    <div className="seg" role="group">
      {options.map((o) => (
        <button
          key={String(o.v)}
          type="button"
          className="seg-btn"
          data-active={o.v === value}
          aria-pressed={o.v === value}
          onClick={() => onChange(o.v)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SliderRow({
  value,
  min,
  max,
  step,
  onChange,
  display,
  minLabel,
  maxLabel,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div>
      <output className="font-mono slider-val">{display}</output>
      <input
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
      />
      <div className="slider-ends">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}

function ToggleRow({
  checked,
  onChange,
  onLabel,
  offLabel,
}: {
  checked: boolean;
  onChange: (b: boolean) => void;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className="toggle-row"
      data-on={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track">
        <span className="toggle-knob" />
      </span>
      <span className="toggle-text">{checked ? onLabel : offLabel}</span>
    </button>
  );
}

/* ============================================================================
   SONUÇLAR
   ============================================================================ */

function ResultsView({
  result,
  profile,
  phValue,
  selectedScenario,
  onSelectScenario,
  onEdit,
}: {
  result: AssessmentResult;
  profile: SiteProfile;
  phValue: number;
  selectedScenario: string | null;
  onSelectScenario: (id: string) => void;
  onEdit: () => void;
}) {
  const candidates = result.candidates.slice(0, 8);
  const excluded = result.excluded.slice(0, 4);
  const top = result.candidates[0] ?? result.excluded[0] ?? null;

  // Yerel test etkisi: aynı ürün, pH varsayıldı vs. ölçüldü
  const compare = useMemo(() => {
    if (!top) return null;
    const midPh = (top.crop.ph.optLow + top.crop.ph.optHigh) / 2;
    const before = assessCrop(top.crop, resolveProfile(profile, false, phValue));
    const after = assessCrop(top.crop, resolveProfile(profile, true, midPh));
    return { crop: top.crop, before, after, midPh };
  }, [top, profile, phValue]);

  return (
    <section className="section results" style={{ paddingBlock: "2.5rem 5rem", animation: "fade-up 500ms var(--ease-out) both" }}>
      <div className="container-x">
        {/* ---- Özet başlığı ---- */}
        <div className="result-summary card">
          <div style={{ flex: "1 1 320px" }}>
            <span className="eyebrow">
              <MapPin size={13} /> {result.zone.name} bölgesi
            </span>
            <h2 style={{ margin: "14px 0 0", fontSize: "var(--fs-h2)" }}>
              {result.candidates.length > 0
                ? `${result.candidates.length} ürün uygun bulundu`
                : "Bu profile birebir uygun ürün çıkmadı"}
            </h2>
            <p style={{ margin: "10px 0 0", color: "var(--text-mid)", maxWidth: 520 }}>
              {result.zone.note}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              <span className="chip font-mono">{result.engineVersion}</span>
              <span className="chip">
                <Calendar size={13} /> {SEASON_LABELS[profile.season]}
              </span>
              <span className="chip">
                <Layers size={13} /> {METHOD_LABELS[profile.method]}
              </span>
              <span className="chip">
                <X size={13} /> {result.excluded.length} elenen
              </span>
            </div>
          </div>

          {top && (
            <div className="result-summary-gauge">
              <RadialGauge
                value={top.totalScore}
                size={132}
                sub="en yüksek skor"
                color={scoreColor(top.totalScore)}
              />
              <div style={{ textAlign: "center", marginTop: 8 }}>
                <div style={{ fontWeight: 600 }}>
                  {top.crop.emoji} {top.crop.name}
                </div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                  uygunluk skoru · güven ayrı ölçülür
                </div>
              </div>
            </div>
          )}

          <div className="result-summary-actions">
            <button className="btn btn-secondary" onClick={onEdit} type="button">
              <ArrowRight size={16} style={{ transform: "rotate(180deg)" }} /> Planı düzenle
            </button>
          </div>
        </div>

        {/* Global veri boşlukları */}
        {result.globalGaps.length > 0 && (
          <div className="global-gaps">
            {result.globalGaps.map((g, i) => (
              <div key={i} className="gap-row">
                <span className="chip chip-warn" style={{ flexShrink: 0 }}>
                  <WarnMark /> Veri boşluğu
                </span>
                <span style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)" }}>{g}</span>
              </div>
            ))}
          </div>
        )}

        {/* ---- Senaryolar ---- */}
        {result.scenarios.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <NumberedHeading
              n="01"
              eyebrow="Başlangıç senaryoları"
              title="Size uygun üç yol"
            />
            <div className="scenario-grid">
              {result.scenarios.map((s) => {
                const active = s.id === selectedScenario;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className="scenario-card"
                    data-active={active}
                    aria-pressed={active}
                    onClick={() => onSelectScenario(s.id)}
                  >
                    <div className="scenario-head">
                      <h3 style={{ margin: 0, fontSize: "var(--fs-h3)" }}>{s.title}</h3>
                      {active && (
                        <span className="chip chip-ok">
                          <Check size={13} /> Seçili
                        </span>
                      )}
                    </div>
                    <p className="scenario-tag">{s.tagline}</p>
                    <div className="scenario-crops">
                      {s.crops.map((c) => (
                        <span key={c.crop.id} className="scenario-crop">
                          <span aria-hidden="true">{c.crop.emoji}</span>
                          {c.crop.name}
                          <span className="font-mono scenario-crop-score">
                            {c.totalScore}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className="scenario-meta">
                      <span>
                        <Calendar size={14} /> Bakım ~
                        {nf(s.weeklyCareMin / 60, 1)} sa/hafta
                      </span>
                      <span>
                        <Sprout size={14} /> İlk hasat ~{s.firstHarvestDays} gün
                      </span>
                    </div>
                    <div className="scenario-risk">
                      <WarnMark />
                      <span>{s.riskNote}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ---- Aday ürünler ---- */}
        {candidates.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <NumberedHeading
              n="02"
              eyebrow="Uygunluk sıralaması"
              title="Aday ürünler ve gerekçeleri"
            />
            <div className="cand-list">
              {candidates.map((c) => (
                <CandidateCard key={c.crop.id} c={c} />
              ))}
            </div>
          </div>
        )}

        {/* ---- Elenenler ---- */}
        {excluded.length > 0 && (
          <div style={{ marginTop: 56 }}>
            <NumberedHeading
              n="03"
              eyebrow="Sert kısıtla elenenler"
              title="Neden elendi, nasıl giderilir?"
            />
            <div className="excluded-grid">
              {excluded.map((c) => (
                <div key={c.crop.id} className="excluded-card">
                  <div className="excluded-head">
                    <span style={{ fontSize: 22 }} aria-hidden="true">
                      {c.crop.emoji}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.crop.name}</div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                        {c.crop.cultivarNote}
                      </div>
                    </div>
                  </div>
                  <ul className="hardfail-list">
                    {c.hardFails.map((h, i) => (
                      <li key={i}>
                        <div className="hardfail-rule">
                          <span className="chip chip-danger">
                            <X size={13} /> {h.rule}
                          </span>
                        </div>
                        <p className="hardfail-detail">{h.detail}</p>
                        <p className="hardfail-remedy">
                          <ArrowRight size={13} /> <strong>Nasıl giderilir:</strong>{" "}
                          {h.remedy}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Yerel test etkisi ---- */}
        {compare && (
          <div style={{ marginTop: 56 }}>
            <NumberedHeading
              n="04"
              eyebrow="Yerel test üstündür"
              title="Toprak pH ölçümü güveni nasıl değiştirir?"
            />
            <p
              className="text-pretty"
              style={{ margin: "-10px 0 20px", color: "var(--text-mid)", maxWidth: 640 }}
            >
              Aynı ürün ({compare.crop.emoji} {compare.crop.name}), aynı koşullar — tek
              fark toprak pH&apos;ının ölçülüp ölçülmediği. Sürgüyü kaydırın: skor küçük
              değişir ama <strong>veri güveni</strong> belirgin artar. Küresel tahmin bir
              başlangıçtır; asıl doğruluk sizin ölçümünüzden gelir.
            </p>
            <CompareSlider
              height={340}
              beforeLabel="pH varsayıldı"
              afterLabel="pH ölçüldü"
              before={<TestPanel variant="before" res={compare.before} phText="Bölgesel varsayım" />}
              after={
                <TestPanel
                  variant="after"
                  res={compare.after}
                  phText={`Yerel ölçüm · pH ${nf(compare.midPh, 1)}`}
                />
              }
            />
          </div>
        )}
      </div>

      <ResultsStyles />
    </section>
  );
}

/* ---------- Aday kartı ---------- */

function CandidateCard({ c }: { c: CandidateResult }) {
  const conf = CONFIDENCE_META[c.confidenceLevel];
  const confPct = Math.round(c.confidence * 100);

  return (
    <SpotlightCard className="cand-card">
      <div className="cand-grid">
        {/* Sol: kimlik + gauge + güven + verim + kanıt */}
        <div className="cand-left">
          <div className="cand-id">
            <span style={{ fontSize: 26 }} aria-hidden="true">
              {c.crop.emoji}
            </span>
            <div>
              <div style={{ fontWeight: 600, fontSize: "var(--fs-md)" }}>{c.crop.name}</div>
              <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                {c.crop.cultivarNote}
              </div>
            </div>
          </div>

          <div className="cand-gauge">
            <RadialGauge value={c.totalScore} size={104} sub="uygunluk" color={scoreColor(c.totalScore)} />
          </div>

          {/* Güven — skordan AYRI */}
          <div className="conf-box">
            <div className="conf-head">
              <span
                className="font-mono"
                style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--text-low)" }}
              >
                VERİ GÜVENİ
              </span>
              <span className={`chip ${conf.chip}`}>
                {conf.icon} {conf.label}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
              <span className="font-mono" style={{ fontSize: 22, fontWeight: 600, color: "var(--text-hi)" }}>
                %{confPct}
              </span>
              <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                veri kalitesi (uygunluktan ayrı)
              </span>
            </div>
          </div>

          {/* Verim aralığı */}
          <div className="yield-box">
            <div className="yield-label">
              <Scale size={14} /> Beklenen verim (alan bazlı)
            </div>
            <YieldBar y={c.yieldRange} />
            <div className="yield-nums">
              <div>
                <span className="yield-k">Temkinli</span>
                <span className="font-mono yield-v">{nf(c.yieldRange.pessimist, 1)} kg</span>
              </div>
              <div>
                <span className="yield-k" style={{ color: "var(--primary)" }}>
                  Beklenen
                </span>
                <span className="font-mono yield-v" style={{ color: "var(--text-hi)" }}>
                  {nf(c.yieldRange.expected, 1)} kg
                </span>
              </div>
              <div>
                <span className="yield-k">İyimser</span>
                <span className="font-mono yield-v">{nf(c.yieldRange.optimist, 1)} kg</span>
              </div>
            </div>
            <div className="yield-harvest font-mono">
              <Sprout size={13} /> İlk hasat {c.firstHarvestDays[0]}–{c.firstHarvestDays[1]} gün
            </div>
          </div>

          {/* Kanıt seviyesi */}
          <div className="evidence-row">
            <span className="evidence-grade">{c.crop.evidence}</span>
            <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>
              {EVIDENCE_LABELS[c.crop.evidence]}
            </span>
          </div>
        </div>

        {/* Sağ: faktörler + gerekçe + uyarı + boşluk */}
        <div className="cand-right">
          <div className="factor-grid">
            {c.factors.map((f) => (
              <div key={f.key} className="factor" title={f.detail}>
                <div className="factor-top">
                  <span>{f.label}</span>
                  <span className="font-mono">{f.score}</span>
                </div>
                <div className="meter">
                  <span style={{ width: `${f.score}%` }} />
                </div>
                <div className="factor-detail">{f.detail}</div>
              </div>
            ))}
          </div>

          {c.reasons.length > 0 && (
            <div className="note-block">
              <div className="note-head" style={{ color: "var(--color-success)" }}>
                <Check size={15} /> Neden önerildi
              </div>
              <ul>
                {c.reasons.map((r, i) => (
                  <li key={i}>
                    <Check size={14} style={{ color: "var(--color-success)" }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.cautions.length > 0 && (
            <div className="note-block">
              <div className="note-head" style={{ color: "var(--color-warning)" }}>
                <WarnMark /> Dikkat
              </div>
              <ul>
                {c.cautions.map((r, i) => (
                  <li key={i}>
                    <span style={{ color: "var(--color-warning)" }}>
                      <WarnMark />
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {c.dataGaps.length > 0 && (
            <div className="note-block gap-block">
              <div className="note-head" style={{ color: "var(--text-low)" }}>
                <Beaker size={15} /> Veri boşlukları
              </div>
              <ul>
                {c.dataGaps.map((r, i) => (
                  <li key={i} className="font-mono">
                    <Beaker size={13} style={{ color: "var(--text-low)" }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </SpotlightCard>
  );
}

function YieldBar({
  y,
}: {
  y: { pessimist: number; expected: number; optimist: number };
}) {
  const max = y.optimist || 1;
  const pPct = Math.min(100, (y.pessimist / max) * 100);
  const ePct = Math.min(100, (y.expected / max) * 100);
  return (
    <div className="yield-track" role="img" aria-label={`Verim aralığı: temkinli ${nf(y.pessimist, 1)}, beklenen ${nf(y.expected, 1)}, iyimser ${nf(y.optimist, 1)} kilogram`}>
      <span
        className="yield-band"
        style={{ left: `${pPct}%`, right: 0 }}
      />
      <span className="yield-marker" style={{ left: `${ePct}%` }} />
    </div>
  );
}

/* ---------- Yerel test paneli (CompareSlider içeriği) ---------- */

function TestPanel({
  variant,
  res,
  phText,
}: {
  variant: "before" | "after";
  res: CandidateResult;
  phText: string;
}) {
  const soil = res.factors.find((f) => f.key === "soil");
  const confPct = Math.round(res.confidence * 100);
  const isAfter = variant === "after";
  const accent = isAfter ? "var(--color-success)" : "var(--color-warning)";
  const conf = CONFIDENCE_META[res.confidenceLevel];

  return (
    <div className="test-panel" data-variant={variant}>
      <div className="test-inner">
        <div className={`chip ${isAfter ? "chip-ok" : "chip-warn"}`}>
          {isAfter ? <ShieldCheck size={13} /> : <WarnMark />} {phText}
        </div>
        <RadialGauge value={confPct} size={120} sub="veri güveni" color={accent} />
        <div className={`chip ${conf.chip}`} style={{ marginTop: 2 }}>
          {conf.icon} {conf.label}
        </div>
        <div className="test-soil">
          <div className="test-soil-top">
            <span>Toprak skoru</span>
            <span className="font-mono">{soil?.score ?? 0}</span>
          </div>
          <div className="meter">
            <span
              style={{
                width: `${soil?.score ?? 0}%`,
                background: isAfter
                  ? "linear-gradient(90deg, var(--color-forest-500), var(--color-forest-400))"
                  : "linear-gradient(90deg, var(--color-gold-600), var(--color-gold-400))",
              }}
            />
          </div>
        </div>
        <p className="test-note">
          {isAfter
            ? "Ölçüm, toprak skorunu ve güveni yükseltir."
            : "Varsayım; skor makul ama güven düşük kalır."}
        </p>
      </div>
    </div>
  );
}

/* ============================================================================
   SAYFA-ÖZEL STİLLER
   ============================================================================ */

function WizardStyles() {
  return (
    <style>{`
      .field-stack { display: grid; gap: 16px; }
      .field-shell {
        border: 1px solid var(--border-hair);
        border-radius: var(--radius-card);
        background: var(--bg-surface);
        padding: 18px 18px 20px;
        box-shadow: var(--shadow-sm);
      }
      .field-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
      .field-num { font-size: 11px; font-weight: 600; color: var(--accent); letter-spacing: 0.12em; }
      .field-ic { display: inline-flex; color: var(--primary); }
      .field-label { font-weight: 600; font-size: var(--fs-md); }
      .field-hint { margin: 12px 0 0; color: var(--text-low); font-size: var(--fs-sm); line-height: 1.5; }

      .wiz-panel { animation: grow-in 320ms var(--ease-out) both; }
      .wiz-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .wiz-step { display: flex; flex-direction: column; gap: 8px; background: none; border: none; padding: 0; cursor: pointer; text-align: left; }
      .wiz-step:disabled { cursor: default; }
      .wiz-step-bar { height: 8px; border-radius: 999px; background: var(--bg-inset); transition: background var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out); }
      .wiz-step[data-state="done"] .wiz-step-bar { background: var(--primary); }
      .wiz-step[data-state="active"] .wiz-step-bar { background: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent); }
      .wiz-step-label { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 600; color: var(--text-low); }
      .wiz-step[data-state="active"] .wiz-step-label { color: var(--text-hi); }
      .wiz-step[data-state="done"] .wiz-step-label { color: var(--text-mid); }

      .select-wrap { position: relative; }
      .select-wrap::after {
        content: ""; position: absolute; right: 14px; top: 50%; width: 8px; height: 8px;
        border-right: 2px solid var(--text-low); border-bottom: 2px solid var(--text-low);
        transform: translateY(-70%) rotate(45deg); pointer-events: none;
      }
      .select-wrap select {
        appearance: none; -webkit-appearance: none; width: 100%;
        height: 46px; padding: 0 38px 0 14px;
        border-radius: var(--radius-control); border: 1px solid var(--border-soft);
        background: var(--bg-surface); color: var(--text-hi); font-size: var(--fs-base);
        font-family: var(--font-sans); cursor: pointer;
      }
      .select-wrap select:hover { border-color: var(--color-forest-300); }

      .opt-grid { display: grid; gap: 8px; }
      .opt-card {
        display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
        text-align: left; padding: 13px 14px; border-radius: var(--radius-control);
        border: 1px solid var(--border-hair); background: var(--bg-surface); cursor: pointer;
        transition: border-color .15s ease, background .15s ease, box-shadow .15s ease, transform .12s var(--ease-out);
      }
      .opt-card:hover { border-color: var(--color-forest-300); transform: translateY(-1px); }
      .opt-card[data-active="true"] {
        border-color: var(--primary);
        background: color-mix(in srgb, var(--primary) 8%, transparent);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
      }
      .opt-ic { display: inline-flex; color: var(--primary); }
      .opt-label { font-weight: 600; font-size: var(--fs-sm); }
      .opt-sub { font-size: var(--fs-xs); color: var(--text-low); }

      .seg { display: flex; gap: 4px; padding: 4px; background: var(--bg-inset); border-radius: var(--radius-control); }
      .seg-btn {
        flex: 1; padding: 9px 10px; border: none; background: transparent; border-radius: 8px;
        font-weight: 600; font-size: var(--fs-sm); color: var(--text-mid); cursor: pointer;
        transition: background .15s ease, color .15s ease, box-shadow .15s ease;
      }
      .seg-btn:hover { color: var(--text-hi); }
      .seg-btn[data-active="true"] { background: var(--bg-surface); color: var(--primary); box-shadow: var(--shadow-sm); }

      .range { width: 100%; accent-color: var(--primary); height: 6px; cursor: pointer; }
      .slider-val { display: inline-block; font-size: 22px; font-weight: 600; color: var(--text-hi); margin-bottom: 6px; }
      .slider-ends { display: flex; justify-content: space-between; margin-top: 6px; font-size: var(--fs-xs); color: var(--text-low); }

      .toggle-row { display: inline-flex; align-items: center; gap: 12px; background: none; border: none; padding: 0; cursor: pointer; color: var(--text-hi); }
      .toggle-track {
        width: 46px; height: 26px; border-radius: 999px; background: var(--bg-inset);
        border: 1px solid var(--border-soft); position: relative; transition: background .2s ease, border-color .2s ease; flex-shrink: 0;
      }
      .toggle-knob {
        position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%;
        background: var(--bg-surface); box-shadow: var(--shadow-sm); transition: transform .2s var(--ease-out);
      }
      .toggle-row[data-on="true"] .toggle-track { background: var(--primary); border-color: var(--primary); }
      .toggle-row[data-on="true"] .toggle-knob { transform: translateX(20px); }
      .toggle-text { font-size: var(--fs-sm); font-weight: 600; color: var(--text-mid); }

      .honesty-note {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 16px 18px; border-radius: var(--radius-card);
        background: color-mix(in srgb, var(--primary) 6%, var(--bg-surface));
        border: 1px solid color-mix(in srgb, var(--primary) 22%, transparent);
        color: var(--text-mid); font-size: var(--fs-sm); line-height: 1.55;
      }
      .honesty-note > svg { color: var(--primary); flex-shrink: 0; margin-top: 1px; }
    `}</style>
  );
}

function ResultsStyles() {
  return (
    <style>{`
      .result-summary {
        display: flex; flex-wrap: wrap; gap: 28px; align-items: center;
        padding: 26px; position: relative; overflow: hidden;
      }
      .result-summary-gauge { display: flex; flex-direction: column; align-items: center; }
      .result-summary-actions { flex: 1 1 auto; display: flex; justify-content: flex-end; align-self: stretch; align-items: flex-start; }

      .global-gaps { display: grid; gap: 8px; margin-top: 16px; }
      .gap-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .gap-row .chip { align-items: center; }

      .scenario-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      .scenario-card {
        display: flex; flex-direction: column; gap: 12px; text-align: left; cursor: pointer;
        padding: 20px; border-radius: var(--radius-card); border: 1px solid var(--border-hair);
        background: var(--bg-surface); box-shadow: var(--shadow-sm);
        transition: border-color .18s ease, box-shadow .18s ease, transform .18s var(--ease-out-soft);
      }
      .scenario-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--color-forest-300); }
      .scenario-card[data-active="true"] {
        border-color: var(--primary);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 16%, transparent), var(--shadow-md);
      }
      .scenario-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .scenario-tag { margin: 0; color: var(--text-mid); font-size: var(--fs-sm); line-height: 1.5; }
      .scenario-crops { display: flex; flex-direction: column; gap: 6px; }
      .scenario-crop {
        display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); font-weight: 500;
        padding: 6px 8px; border-radius: 8px; background: var(--bg-surface-2);
      }
      .scenario-crop-score { margin-left: auto; font-size: 12px; color: var(--primary); font-weight: 600; }
      .scenario-meta { display: grid; gap: 6px; font-size: var(--fs-xs); color: var(--text-mid); }
      .scenario-meta span { display: inline-flex; align-items: center; gap: 6px; }
      .scenario-risk {
        display: flex; gap: 8px; align-items: flex-start; margin-top: auto;
        padding-top: 12px; border-top: 1px dashed var(--border-soft);
        font-size: var(--fs-xs); color: var(--text-low); line-height: 1.5;
      }
      .scenario-risk > svg { color: var(--color-warning); }

      .cand-list { display: grid; gap: 16px; }
      .cand-card { padding: 22px; }
      .cand-grid { display: grid; grid-template-columns: 260px 1fr; gap: 26px; }
      .cand-left { display: grid; gap: 16px; align-content: start; }
      .cand-id { display: flex; gap: 12px; align-items: center; }
      .cand-gauge { display: flex; justify-content: center; }

      .conf-box { padding: 12px 14px; border-radius: var(--radius-control); background: var(--bg-surface-2); border: 1px solid var(--border-hair); }
      .conf-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }

      .yield-box { display: grid; gap: 10px; }
      .yield-label { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 600; color: var(--text-mid); }
      .yield-track { position: relative; height: 12px; border-radius: 999px; background: var(--bg-inset); }
      .yield-band { position: absolute; top: 0; bottom: 0; border-radius: 999px; background: linear-gradient(90deg, var(--color-forest-400), var(--color-gold-400)); opacity: 0.85; }
      .yield-marker { position: absolute; top: -3px; width: 3px; height: 18px; border-radius: 2px; background: var(--text-hi); box-shadow: 0 0 0 2px var(--bg-surface); transform: translateX(-1.5px); }
      .yield-nums { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .yield-nums > div { display: flex; flex-direction: column; gap: 2px; }
      .yield-k { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-low); }
      .yield-v { font-size: var(--fs-sm); color: var(--text-mid); font-weight: 600; }
      .yield-harvest { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-low); }

      .evidence-row { display: flex; align-items: center; gap: 10px; padding-top: 4px; border-top: 1px solid var(--border-hair); padding-block: 12px 0; }
      .evidence-grade {
        display: grid; place-items: center; width: 30px; height: 30px; border-radius: 8px;
        background: color-mix(in srgb, var(--color-info) 14%, transparent);
        color: var(--color-info); font-family: var(--font-mono); font-weight: 700; font-size: 15px; flex-shrink: 0;
      }

      .cand-right { display: grid; gap: 18px; align-content: start; }
      .factor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
      .factor-top { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-sm); }
      .factor-top > span:first-child { color: var(--text-mid); }
      .factor-top > span:last-child { color: var(--text-hi); font-weight: 600; }
      .factor .meter { margin-top: 5px; }
      .factor-detail { margin-top: 5px; font-size: 11px; color: var(--text-low); line-height: 1.4; }

      .note-block { }
      .note-head { display: inline-flex; align-items: center; gap: 7px; font-size: var(--fs-sm); font-weight: 600; margin-bottom: 8px; }
      .note-block ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 7px; }
      .note-block li { display: flex; gap: 8px; align-items: flex-start; font-size: var(--fs-sm); color: var(--text-mid); line-height: 1.5; }
      .note-block li > svg, .note-block li > span:first-child { flex-shrink: 0; margin-top: 2px; }
      .gap-block li { font-size: 12px; color: var(--text-low); }

      .excluded-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
      .excluded-card {
        padding: 20px; border-radius: var(--radius-card);
        border: 1px solid color-mix(in srgb, var(--color-danger) 22%, var(--border-hair));
        background: color-mix(in srgb, var(--color-danger) 4%, var(--bg-surface));
      }
      .excluded-head { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
      .hardfail-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
      .hardfail-rule { margin-bottom: 6px; }
      .hardfail-detail { margin: 0; font-size: var(--fs-sm); color: var(--text-mid); line-height: 1.5; }
      .hardfail-remedy { margin: 6px 0 0; font-size: var(--fs-sm); color: var(--text-hi); line-height: 1.5; display: flex; gap: 6px; align-items: baseline; }
      .hardfail-remedy > svg { color: var(--primary); flex-shrink: 0; transform: translateY(2px); }

      .test-panel { height: 100%; display: grid; place-items: center; padding: 24px; }
      .test-panel[data-variant="before"] { background: color-mix(in srgb, var(--color-warning) 8%, var(--bg-surface)); }
      .test-panel[data-variant="after"] { background: color-mix(in srgb, var(--color-success) 8%, var(--bg-surface)); }
      .test-inner { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; max-width: 280px; }
      .test-soil { width: 100%; }
      .test-soil-top { display: flex; justify-content: space-between; font-size: var(--fs-xs); color: var(--text-mid); margin-bottom: 5px; }
      .test-note { margin: 2px 0 0; font-size: var(--fs-xs); color: var(--text-low); line-height: 1.45; }

      @media (max-width: 860px) {
        .cand-grid { grid-template-columns: 1fr; gap: 20px; }
        .cand-gauge { justify-content: flex-start; }
      }
      @media (max-width: 760px) {
        .scenario-grid { grid-template-columns: 1fr; }
        .excluded-grid { grid-template-columns: 1fr; }
        .result-summary-actions { justify-content: flex-start; }
      }
      @media (max-width: 520px) {
        .factor-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
