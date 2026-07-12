"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  CROPS,
  CROP_BY_ID,
  METHOD_LABELS,
  SEASON_LABELS,
  EVIDENCE_LABELS,
  type Crop,
  type GrowMethod,
  type CropCategory,
  type Season,
  type EvidenceGrade,
} from "@/data/crops";
import { BotanicalScene } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { COMPARISON_METRICS, findBestCropIndex } from "@/lib/compareCrops";
import {
  Sun,
  Droplet,
  Calendar,
  Scale,
  Sprout,
  Leaf,
  Thermometer,
  Beaker,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
} from "@/components/icons";

/* CSS değişkeni taşıyabilen stil tipi (sayfa-özel). */
type Vars = CSSProperties & Record<string, string | number>;

/* ---------------------------------------------------------------- Sözlükler */

const CATEGORY_ORDER: CropCategory[] = [
  "meyveli-sebze",
  "yaprakli",
  "aromatik",
  "kok-yumru",
  "baklagil",
  "meyve",
  "agac-meyve",
];

// Her kategoriye kimlik rengi (hue). Seçiliyken tam renk, seçili değilken %12 tint.
const CATEGORY_META: Record<CropCategory, { label: string; color: string }> = {
  "meyveli-sebze": { label: "Meyveli sebze", color: "#b23f26" },
  yaprakli: { label: "Yapraklı", color: "#2b7a4b" },
  aromatik: { label: "Aromatik", color: "#0f7a71" },
  "kok-yumru": { label: "Kök & yumru", color: "#9a6410" },
  baklagil: { label: "Baklagil", color: "#5c7a26" },
  meyve: { label: "Meyve", color: "#a83560" },
  "agac-meyve": { label: "Ağaç meyvesi", color: "#6b4226" },
};

const METHOD_ORDER: GrowMethod[] = [
  "saksi",
  "yukseltilmis-yatak",
  "acik-alan",
  "sera",
  "hidroponik",
];

const SEASON_ORDER: Season[] = ["ilkbahar", "yaz", "sonbahar", "kis"];

const SHORT_METHOD: Record<GrowMethod, string> = {
  "acik-alan": "açık alan",
  "yukseltilmis-yatak": "yatak",
  saksi: "saksı",
  sera: "sera",
  hidroponik: "hidro",
};

const WATER_LABELS: [string, string, string] = ["Düşük", "Orta", "Yüksek"];
const CARE_LABELS: [string, string, string] = ["Hafif", "Orta", "Yoğun"];
const LEVEL_LABELS: [string, string, string] = ["Düşük", "Orta", "Yüksek"];

const EVIDENCE_COLOR: Record<EvidenceGrade, string> = {
  A: "var(--color-success)",
  B: "var(--color-info)",
  C: "var(--accent)",
  D: "var(--color-warning)",
  E: "var(--color-danger)",
};

const EFFECT_META: Record<
  Crop["companions"][number]["effect"],
  { label: string; cls: string; icon: ReactNode }
> = {
  faydali: { label: "Faydalı", cls: "chip-ok", icon: <Check size={13} /> },
  notr: {
    label: "Nötr",
    cls: "chip",
    icon: (
      <span aria-hidden style={{ display: "block", width: 9, height: 2, borderRadius: 2, background: "currentColor" }} />
    ),
  },
  riskli: { label: "Riskli", cls: "chip-danger", icon: <X size={13} /> },
};

/* Katalog dışı eş bitki adlarını okunur hale getir (ör. "patates" → "Patates"). */
function prettyId(id: string): string {
  return id
    .split("-")
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1))
    .join(" ");
}

function trLower(s: string) {
  return s.toLocaleLowerCase("tr");
}

/* --------------------------------------------------------- Küçük primitifler */

function SearchIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.2-4.2" />
    </svg>
  );
}

function EvidenceTag({ grade }: { grade: EvidenceGrade }) {
  const c = EVIDENCE_COLOR[grade];
  return (
    <span
      className="chip"
      title={EVIDENCE_LABELS[grade]}
      style={{
        borderColor: `color-mix(in srgb, ${c} 40%, transparent)`,
        color: c,
        background: `color-mix(in srgb, ${c} 12%, transparent)`,
      }}
    >
      <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: c }} />
      Kanıt {grade}
    </span>
  );
}

/** 1–3 ölçek — nokta çubukları + metin etiket (durum yalnız renkle verilmez). */
function ScaleDots({
  value,
  labels,
  color = "var(--primary)",
}: {
  value: 1 | 2 | 3;
  labels: [string, string, string];
  color?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-flex", gap: 3 }} aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 15,
              height: 6,
              borderRadius: 999,
              background: i < value ? color : "var(--bg-inset)",
            }}
          />
        ))}
      </span>
      <span style={{ fontSize: "var(--fs-sm)", fontWeight: 600 }}>{labels[value - 1]}</span>
    </span>
  );
}

/** Tolerans + ideal bantlı aralık göstergesi (tempC / pH). */
function RangeBand({
  label,
  icon,
  domain,
  min,
  optLow,
  optHigh,
  max,
  unit,
}: {
  label: string;
  icon: ReactNode;
  domain: [number, number];
  min: number;
  optLow: number;
  optHigh: number;
  max: number;
  unit: string;
}) {
  const [dmin, dmax] = domain;
  const p = (v: number) => Math.max(0, Math.min(100, ((v - dmin) / (dmax - dmin)) * 100));
  const tolL = p(min);
  const tolR = p(max);
  const optL = p(optLow);
  const optR = p(optHigh);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontWeight: 600, fontSize: "var(--fs-sm)" }}>
          <span style={{ color: "var(--primary)", display: "inline-flex" }}>{icon}</span>
          {label}
        </span>
        <span className="font-mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          ideal {optLow}–{optHigh}
          {unit}
        </span>
      </div>
      <div style={{ position: "relative", height: 14, borderRadius: 999, background: "var(--bg-inset)", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${tolL}%`,
            width: `${tolR - tolL}%`,
            background: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${optL}%`,
            width: `${optR - optL}%`,
            background: "linear-gradient(90deg, var(--color-forest-500), var(--color-forest-400))",
          }}
        />
      </div>
      <div className="font-mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--text-low)" }}>
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}

/** Modal spec kutusu. */
function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: "var(--bg-surface-2)", border: "1px solid var(--border-hair)" }}>
      <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-low)", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- Kart */

function SeedCard({
  crop,
  onOpen,
  compareChecked,
  onToggleCompare,
  compareDisabled,
}: {
  crop: Crop;
  onOpen: (id: string) => void;
  compareChecked: boolean;
  onToggleCompare: (id: string) => void;
  compareDisabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useRef(false);
  const meta = CATEGORY_META[crop.category];

  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const onMove = (e: React.MouseEvent) => {
    if (reduce.current) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-py * 5.5).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(px * 5.5).toFixed(2)}deg`);
  };
  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const methodLine =
    crop.methods.map((m) => SHORT_METHOD[m]).slice(0, 4).join(" · ") +
    ` — ${crop.daysToHarvest[0]}–${crop.daysToHarvest[1]} gün`;

  return (
    <div className="tilt-wrap">
      <div
        ref={ref}
        className="seed-card"
        role="button"
        tabIndex={0}
        aria-label={`${crop.name} — ${meta.label}. Detayı aç`}
        onMouseMove={onMove}
        onMouseLeave={reset}
        onClick={() => onOpen(crop.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen(crop.id);
          }
        }}
        style={{ "--sc": meta.color, position: "relative" } as Vars}
      >
        <span className="seed-strip" aria-hidden />

        <label
          className="compare-toggle"
          onClick={(e) => e.stopPropagation()}
          title={compareDisabled && !compareChecked ? "En fazla 4 ürün karşılaştırılabilir" : "Karşılaştırmaya ekle"}
        >
          <input
            type="checkbox"
            checked={compareChecked}
            disabled={compareDisabled && !compareChecked}
            onChange={() => onToggleCompare(crop.id)}
            aria-label={`${crop.name} — karşılaştırmaya ekle`}
          />
          <span className="font-mono">Karşılaştır</span>
        </label>

        <div className="seed-head">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 24, lineHeight: 1 }} aria-hidden>
              {crop.emoji}
            </span>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: "var(--fs-h3)", lineHeight: 1.1 }}>{crop.name}</h3>
              <div className="font-mono" style={{ fontSize: 11, color: "var(--text-low)", marginTop: 4, lineHeight: 1.35 }}>
                {crop.cultivarNote}
              </div>
            </div>
          </div>
        </div>

        <div className="seed-illus">
          <span className="seed-illus-bg" aria-hidden />
          <BotanicalScene
            className="seed-illus-art"
            style={{ color: `color-mix(in srgb, ${meta.color} 60%, transparent)` }}
          />
          <span className="cat-tag" aria-hidden>
            {meta.label}
          </span>
          <span
            className="ev-badge"
            title={EVIDENCE_LABELS[crop.evidence]}
            aria-label={`Kanıt seviyesi ${crop.evidence}`}
            style={{ "--ec": EVIDENCE_COLOR[crop.evidence] } as Vars}
          >
            <span className="font-mono">{crop.evidence}</span>
          </span>
        </div>

        <div className="seed-content">
          <div style={{ fontStyle: "italic", color: "var(--text-mid)", fontSize: "var(--fs-sm)" }}>
            {crop.scientificName}
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: "var(--text-low)", marginTop: 4, marginBottom: 12 }}>
            {methodLine}
          </div>

          <div className="metrics">
            <MetricRow icon={<Sun size={16} />} label="Güneş" value={`${crop.sunMinHours}–${crop.sunOptHours} sa`} />
            <MetricRow icon={<Droplet size={16} />} label="Su" value={WATER_LABELS[crop.waterNeed - 1]} />
            <MetricRow icon={<Calendar size={16} />} label="İlk hasat" value={`${crop.daysToHarvest[0]}–${crop.daysToHarvest[1]} gün`} />
            <MetricRow icon={<Scale size={16} />} label="Verim" value={`${crop.yieldPerM2Kg[0]}–${crop.yieldPerM2Kg[1]} kg/m²`} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="metric-row">
      <span style={{ color: "var(--primary)", display: "inline-flex" }}>{icon}</span>
      <span style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)" }}>{label}</span>
      <span className="font-mono" style={{ fontWeight: 600, fontSize: "var(--fs-sm)", textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

function DetailModal({
  crop,
  onClose,
  onNavigate,
}: {
  crop: Crop;
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const meta = CATEGORY_META[crop.category];

  useEffect(() => {
    closeRef.current?.focus();
  }, [crop.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ "--sc": meta.color } as Vars}
      >
        <span className="modal-strip" aria-hidden />

        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 30, lineHeight: 1 }} aria-hidden>
              {crop.emoji}
            </span>
            <div style={{ minWidth: 0 }}>
              <h2 id="modal-title" style={{ margin: 0, fontSize: "var(--fs-h2)" }}>
                {crop.name}
              </h2>
              <div style={{ fontStyle: "italic", color: "var(--text-mid)", marginTop: 2 }}>
                {crop.scientificName} · {crop.family}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                <span
                  className="chip"
                  style={{
                    color: meta.color,
                    background: `color-mix(in srgb, ${meta.color} 12%, transparent)`,
                    borderColor: `color-mix(in srgb, ${meta.color} 30%, transparent)`,
                  }}
                >
                  {meta.label}
                </span>
                <EvidenceTag grade={crop.evidence} />
              </div>
            </div>
          </div>
          <button ref={closeRef} className="btn btn-ghost btn-sm" aria-label="Kapat" onClick={onClose} style={{ width: 38, height: 38, padding: 0, flexShrink: 0 }}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Çeşit profili uyarısı — tür geneliyle karıştırma */}
          <div className="note-cultivar">
            <Leaf size={16} />
            <span>
              <strong>Çeşit profili:</strong> {crop.cultivarNote}. Bu kart bir tür geneli değil, bu çeşit/pazar tipinin
              profilidir.
            </span>
          </div>

          <p style={{ color: "var(--text-mid)", lineHeight: 1.6, margin: "16px 0 24px" }}>{crop.description}</p>

          {/* Tam gereksinim */}
          <SectionTitle n="01" title="Tam gereksinim" />
          <div style={{ display: "grid", gap: 18, marginBottom: 20 }}>
            <RangeBand label="Sıcaklık aralığı" icon={<Thermometer size={16} />} domain={[-10, 40]} min={crop.tempC.min} optLow={crop.tempC.optLow} optHigh={crop.tempC.optHigh} max={crop.tempC.max} unit="°C" />
            <RangeBand label="Toprak pH aralığı" icon={<Beaker size={16} />} domain={[4, 9]} min={crop.ph.min} optLow={crop.ph.optLow} optHigh={crop.ph.optHigh} max={crop.ph.max} unit="" />
          </div>
          <div className="legend-line">
            <span><span className="lg-swatch" style={{ background: "color-mix(in srgb, var(--primary) 20%, transparent)" }} /> açık bant: yaşayabilir tolerans</span>
            <span><span className="lg-swatch" style={{ background: "linear-gradient(90deg, var(--color-forest-500), var(--color-forest-400))" }} /> koyu bant: ideal aralık</span>
          </div>

          <div className="spec-grid">
            <Spec label="Güneş / gün">
              {crop.sunMinHours}–{crop.sunOptHours} sa
            </Spec>
            <Spec label="Min. saksı hacmi">{crop.minContainerL != null ? `${crop.minContainerL} L` : "Saksı önerilmez"}</Spec>
            <Spec label="Dikim aralığı">{crop.spacingCm} cm</Spec>
            <Spec label="İlk hasat">
              {crop.daysToHarvest[0]}–{crop.daysToHarvest[1]} gün
            </Spec>
            <Spec label="Verim (m²)">
              {crop.yieldPerM2Kg[0]}–{crop.yieldPerM2Kg[1]} kg
            </Spec>
            <Spec label="Su ihtiyacı">
              <ScaleDots value={crop.waterNeed} labels={WATER_LABELS} color="var(--color-info)" />
            </Spec>
            <Spec label="Haftalık bakım">
              <ScaleDots value={crop.careLoad} labels={CARE_LABELS} color="var(--accent)" />
            </Spec>
            <Spec label="Pazar talebi">
              <ScaleDots value={crop.marketDemand} labels={LEVEL_LABELS} />
            </Spec>
            <Spec label="Zararlı direnci">
              <ScaleDots value={crop.pestResilience} labels={LEVEL_LABELS} />
            </Spec>
            <Spec label="Sürdürülebilirlik">
              <ScaleDots value={crop.sustainability} labels={LEVEL_LABELS} />
            </Spec>
          </div>

          {/* Durum çipleri — ikon + etiket */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
            <span className={`chip ${crop.frostTolerant ? "chip-ok" : "chip-warn"}`}>
              {crop.frostTolerant ? <ShieldCheck size={13} /> : <Thermometer size={13} />}
              {crop.frostTolerant ? "Dona dayanıklı" : "Dona hassas"}
            </span>
            <span className={`chip ${crop.beginnerFriendly ? "chip-ok" : ""}`}>
              <Sprout size={13} />
              {crop.beginnerFriendly ? "Yeni başlayana uygun" : "Deneyim ister"}
            </span>
            {crop.successionCrop && (
              <span className="chip chip-info">
                <Calendar size={13} /> Ardışık ekime uygun
              </span>
            )}
            {crop.petCaution && (
              <span className="chip chip-warn">
                <ShieldCheck size={13} /> Evcil hayvan / çocuk temkin
              </span>
            )}
          </div>

          {/* Birlikte ekim */}
          <SectionTitle n="02" title="Birlikte ekim ilişkileri" style={{ marginTop: 32 }} />
          <p className="muted-hint">
            Her ilişki mekanizması ve kanıt seviyesiyle verilir; mekanizma gösterilmeden &ldquo;uyumlu&rdquo; denmez.
          </p>
          {crop.companions.length > 0 ? (
            <ul className="companion-list">
              {crop.companions.map((c, i) => {
                const partner = CROP_BY_ID[c.cropId];
                const name = partner ? partner.name : prettyId(c.cropId);
                const em = EFFECT_META[c.effect];
                return (
                  <li key={i} className="companion-item">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span aria-hidden style={{ fontSize: 16 }}>
                          {partner ? partner.emoji : "•"}
                        </span>
                        {partner ? (
                          <button className="companion-link" onClick={() => onNavigate(partner.id)}>
                            {name}
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <span style={{ fontWeight: 600 }}>
                            {name}
                            <span style={{ color: "var(--text-low)", fontWeight: 400, fontSize: "var(--fs-xs)", marginLeft: 6 }}>(katalog dışı)</span>
                          </span>
                        )}
                      </div>
                      <span className={`chip ${em.cls}`}>
                        {em.icon}
                        {em.label}
                      </span>
                    </div>
                    <div style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", marginTop: 8, lineHeight: 1.5 }}>
                      {c.mechanism}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <EvidenceTag grade={c.evidence} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted-hint">Bu ürün için doğrulanmış birlikte ekim ilişkisi kayıtlı değil.</p>
          )}

          {/* Ekim nöbeti */}
          <SectionTitle n="03" title="Ekim nöbeti uyarısı" style={{ marginTop: 32 }} />
          {crop.rotationAvoidFamilies.length > 0 ? (
            <div className="rotation-box">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "var(--color-warning)", fontWeight: 600 }}>
                <ShieldCheck size={16} /> Aynı yeri arka arkaya paylaşmayın
              </div>
              <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", margin: "0 0 12px", lineHeight: 1.5 }}>
                Bu ürünü, şu familyalardan bir üründen hemen sonra aynı toprağa ekmeyin (hastalık ve zararlı birikimi):
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {crop.rotationAvoidFamilies.map((f) => (
                  <span key={f} className="chip chip-warn">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="muted-hint">Bu ürün için özel bir rotasyon kısıtı bildirilmemiş (familya: {crop.family}).</p>
          )}

          {/* İpuçları */}
          <SectionTitle n="04" title="Saha ipuçları" style={{ marginTop: 32 }} />
          <ul className="tips-list">
            {crop.tips.map((t, i) => (
              <li key={i}>
                <span style={{ color: "var(--primary)", display: "inline-flex", marginTop: 2 }}>
                  <Sprout size={16} />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          {/* Yöntem + sezon */}
          <div className="tag-blocks">
            <div>
              <div className="tag-label">Yetiştirme yöntemleri</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {crop.methods.map((m) => (
                  <span key={m} className="chip">
                    {METHOD_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="tag-label">Dikim sezonları</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {crop.plantingSeasons.map((s) => (
                  <span key={s} className="chip">
                    {SEASON_LABELS[s]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Kaynak + kanıt */}
          <div className="source-box">
            <div className="tag-label">Kaynak &amp; kanıt seviyesi</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{crop.source.title}</div>
            <div style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)" }}>
              {crop.source.org} · {crop.source.year}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
              <EvidenceTag grade={crop.evidence} />
              <span style={{ color: "var(--text-low)", fontSize: "var(--fs-sm)" }}>{EVIDENCE_LABELS[crop.evidence]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareModal({ crops, onClose, onRemove }: { crops: Crop[]; onClose: () => void; onRemove: (id: string) => void }) {
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
      aria-label="Ürün karşılaştırması"
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
          <h3 style={{ margin: 0, fontSize: "var(--fs-lg)" }}>Ürün karşılaştırması</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <div style={{ overflow: "auto", padding: 20 }}>
          <table className="compare-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Özellik</th>
                {crops.map((c) => (
                  <th key={c.id}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 22 }} aria-hidden="true">{c.emoji}</span>
                      <span style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{c.name}</span>
                      <button onClick={() => onRemove(c.id)} className="chip" style={{ cursor: "pointer", border: "none", fontSize: 10 }}>
                        <X size={10} /> Kaldır
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_METRICS.map((m) => {
                const bestIdx = findBestCropIndex(crops, m);
                return (
                  <tr key={m.key}>
                    <td className="font-mono" style={{ color: "var(--text-low)", fontSize: "var(--fs-xs)" }}>{m.label}</td>
                    {crops.map((c, i) => (
                      <td key={c.id} style={{ textAlign: "center" }}>
                        <span
                          className={i === bestIdx ? "chip chip-ok" : undefined}
                          style={i === bestIdx ? undefined : { color: "var(--text-mid)" }}
                        >
                          {i === bestIdx && <Check size={11} />} {m.getValue(c)}
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
      <style>{`
        .compare-table { border-collapse: collapse; width: 100%; min-width: 480px; }
        .compare-table th, .compare-table td { border-bottom: 1px solid var(--border-hair); padding: 10px 12px; }
        .compare-table thead th { border-bottom: 2px solid var(--border-soft); }
      `}</style>
    </div>
  );
}

function SectionTitle({ n, title, style }: { n: string; title: string; style?: CSSProperties }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10, ...style }}>
      <span className="font-mono" style={{ fontSize: "var(--fs-sm)", color: "var(--accent)", fontWeight: 600, letterSpacing: "0.1em" }}>
        {n}
      </span>
      <h3 style={{ margin: 0, fontSize: "var(--fs-h3)" }}>{title}</h3>
      <span style={{ flex: 1, height: 1, background: "var(--border-hair)" }} />
    </div>
  );
}

/* ------------------------------------------------------------ Ana bileşen */

export function Explorer() {
  const [cats, setCats] = useState<CropCategory[]>([]);
  const [methods, setMethods] = useState<GrowMethod[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [query, setQuery] = useState("");
  const [beginnerOnly, setBeginnerOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of CROPS) m[c.category] = (m[c.category] ?? 0) + 1;
    return m;
  }, []);

  const toggle = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, val: T) =>
    set((arr) => (arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]));

  const q = trLower(query.trim());
  const results = useMemo(() => {
    return CROPS.filter((c) => {
      if (cats.length && !cats.includes(c.category)) return false;
      if (methods.length && !methods.some((m) => c.methods.includes(m))) return false;
      if (seasons.length && !seasons.some((s) => c.plantingSeasons.includes(s))) return false;
      if (beginnerOnly && !c.beginnerFriendly) return false;
      if (q && !(trLower(c.name).includes(q) || trLower(c.scientificName).includes(q))) return false;
      return true;
    });
  }, [cats, methods, seasons, beginnerOnly, q]);

  const anyFilter = cats.length > 0 || methods.length > 0 || seasons.length > 0 || beginnerOnly || query.trim() !== "";
  const clearAll = () => {
    setCats([]);
    setMethods([]);
    setSeasons([]);
    setBeginnerOnly(false);
    setQuery("");
  };

  const selected = selectedId ? CROP_BY_ID[selectedId] : null;

  // Kararlı referans: DetailModal içindeki escape/scroll-lock effect'inin
  // her Explorer render'ında (ör. companion navigasyonunda) gereksiz yere
  // temizlenip yeniden kurulmasını önler (yanlış bağımlılık/gereksiz efekt riski).
  const closeModal = useCallback(() => setSelectedId(null), []);

  return (
    <>
      {/* HERO */}
      <section className="mesh-light grain" style={{ position: "relative", overflow: "hidden" }}>
        <div className="container-x" style={{ paddingBlock: "clamp(3rem, 6vw, 5rem)" }}>
          <Reveal i={0}>
            <span className="eyebrow">Bilgi grafiği · Dalga 1</span>
          </Reveal>
          <Reveal i={1}>
            <h1 style={{ fontSize: "var(--fs-h1)", maxWidth: 760, marginTop: 18 }} className="text-balance">
              Ürün ve çeşit kâşifi
            </h1>
          </Reveal>
          <Reveal i={2}>
            <p style={{ fontSize: "var(--fs-lead)", color: "var(--text-mid)", maxWidth: 640, marginTop: 14, lineHeight: 1.55 }} className="text-pretty">
              Her kart bir <strong>çeşit/pazar tipi profilidir</strong> — tür geneliyle karıştırılmaz. Işık, su, sıcaklık,
              pH, verim ve birlikte ekim ilişkileri aralık ve kanıt seviyesiyle verilir; kesin vaat değil.
            </p>
          </Reveal>

          <Reveal i={3}>
            <div style={{ marginTop: 30, maxWidth: 720 }}>
              <div className="spectrum-labels">
                <span>yaprak · yeşil · toprak</span>
                <span className="font-mono">Lezzet &amp; özellik spektrumu</span>
                <span>meyve · tatlı · altın</span>
              </div>
              <div className="spectrum-bar" aria-hidden />
              <div className="evidence-legend">
                {(Object.keys(EVIDENCE_LABELS) as EvidenceGrade[]).map((g) => (
                  <span key={g} title={EVIDENCE_LABELS[g]} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: EVIDENCE_COLOR[g] }} />
                    <span className="font-mono" style={{ fontSize: 11 }}>{g}</span>
                  </span>
                ))}
                <span style={{ color: "var(--text-low)", fontSize: "var(--fs-xs)" }}>kanıt: A güçlü → E hipotez</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FİLTRE + GRID */}
      <section className="paper-section" style={{ borderTop: "1px solid var(--border-hair)" }}>
        <div className="container-x" style={{ paddingBlock: "clamp(2rem, 4vw, 3rem) clamp(4rem, 8vw, 6rem)" }}>
          {/* Araç çubuğu */}
          <div className="toolbar">
            <div className="search-wrap">
              <span className="search-icon" aria-hidden>
                <SearchIcon />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim veya bilimsel ad ara…"
                aria-label="Ürün ara"
                className="search-input"
              />
            </div>
            <button
              className="toggle-chip"
              aria-pressed={beginnerOnly}
              onClick={() => setBeginnerOnly((v) => !v)}
            >
              <Sprout size={16} />
              Yeni başlayana uygun
            </button>
          </div>

          {/* Kategori çipleri */}
          <div className="filter-group">
            <span className="filter-label">Kategori</span>
            <div className="chip-row">
              {CATEGORY_ORDER.map((cat) => {
                const on = cats.includes(cat);
                const m = CATEGORY_META[cat];
                const style: CSSProperties = on
                  ? { background: m.color, color: "#fff", borderColor: m.color }
                  : {
                      background: `color-mix(in srgb, ${m.color} 12%, transparent)`,
                      color: m.color,
                      borderColor: `color-mix(in srgb, ${m.color} 32%, transparent)`,
                    };
                return (
                  <button key={cat} className="fchip" aria-pressed={on} onClick={() => toggle(setCats, cat)} style={style}>
                    {m.label}
                    <span className="fchip-count" style={{ background: on ? "rgba(255,255,255,0.22)" : `color-mix(in srgb, ${m.color} 18%, transparent)` }}>
                      {catCounts[cat] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Yöntem + sezon */}
          <div className="filter-double">
            <div className="filter-group">
              <span className="filter-label">Yöntem</span>
              <div className="chip-row">
                {METHOD_ORDER.map((mth) => {
                  const on = methods.includes(mth);
                  return (
                    <button key={mth} className={`fchip ${on ? "fchip-primary" : ""}`} aria-pressed={on} onClick={() => toggle(setMethods, mth)}>
                      {METHOD_LABELS[mth]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="filter-group">
              <span className="filter-label">Sezon</span>
              <div className="chip-row">
                {SEASON_ORDER.map((s) => {
                  const on = seasons.includes(s);
                  return (
                    <button key={s} className={`fchip ${on ? "fchip-primary" : ""}`} aria-pressed={on} onClick={() => toggle(setSeasons, s)}>
                      {SEASON_LABELS[s]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sonuç sayısı */}
          <div className="result-bar">
            <span>
              <strong className="tnum">{results.length}</strong> ürün profili
              {anyFilter && <span style={{ color: "var(--text-low)" }}> · {CROPS.length} içinde</span>}
            </span>
            {anyFilter && (
              <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                <X size={15} /> Filtreleri temizle
              </button>
            )}
          </div>

          {/* Grid ya da boş durum */}
          {results.length > 0 ? (
            <div className="seed-grid">
              {results.map((c) => (
                <SeedCard
                  key={c.id}
                  crop={c}
                  onOpen={setSelectedId}
                  compareChecked={compareIds.includes(c.id)}
                  onToggleCompare={toggleCompare}
                  compareDisabled={compareIds.length >= MAX_COMPARE}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span style={{ color: "var(--text-low)", display: "inline-flex" }}>
                <Leaf size={30} />
              </span>
              <p style={{ margin: "12px 0 16px", color: "var(--text-mid)" }}>Bu filtrelerle eşleşen ürün yok.</p>
              <button className="btn btn-secondary btn-sm" onClick={clearAll}>
                <X size={15} /> Filtreleri temizle
              </button>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <DetailModal crop={selected} onClose={closeModal} onNavigate={(id) => setSelectedId(id)} />
      )}

      {compareIds.length > 0 && !compareOpen && (
        <div className="compare-bar" role="status">
          <span className="font-mono" style={{ fontSize: "var(--fs-sm)" }}>
            {compareIds.length} ürün seçili {compareIds.length < 2 && "(en az 2 seçin)"}
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
        <CompareModal
          crops={compareIds.map((id) => CROP_BY_ID[id]).filter(Boolean)}
          onClose={() => setCompareOpen(false)}
          onRemove={(id) => {
            setCompareIds((prev) => prev.filter((x) => x !== id));
            if (compareIds.length <= 2) setCompareOpen(false);
          }}
        />
      )}

      <style>{`
        .compare-bar {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
          z-index: 55; display: flex; align-items: center; gap: 16px;
          padding: 12px 18px; border-radius: 999px;
          background: var(--bg-surface); border: 1px solid var(--border-soft);
          box-shadow: var(--shadow-lg);
        }
        /* ---- Spektrum ---- */
        .spectrum-labels {
          display: flex; justify-content: space-between; align-items: baseline;
          font-size: var(--fs-xs); color: var(--text-low); margin-bottom: 8px; gap: 12px;
        }
        .spectrum-labels .font-mono { letter-spacing: 0.08em; text-transform: uppercase; font-size: 10px; }
        .spectrum-bar {
          height: 16px; border-radius: 999px;
          background: linear-gradient(135deg,
            var(--color-forest-800), var(--color-forest-600) 26%, var(--color-forest-400) 48%,
            var(--color-gold-400) 72%, var(--color-gold-300));
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06), var(--shadow-sm);
        }
        .evidence-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 14px; }

        /* ---- Araç çubuğu ---- */
        .toolbar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; margin-bottom: 22px; }
        .search-wrap { position: relative; flex: 1; min-width: 220px; }
        .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-low); pointer-events: none; }
        .search-input {
          width: 100%; height: 46px; padding: 0 16px 0 42px;
          border-radius: var(--radius-control); border: 1px solid var(--border-soft);
          background: var(--bg-surface); color: var(--text-hi); font-size: var(--fs-base);
          transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
        }
        .search-input::placeholder { color: var(--text-low); }
        .search-input:focus-visible { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 22%, transparent); }

        .toggle-chip, .fchip {
          display: inline-flex; align-items: center; gap: 6px;
          height: 40px; padding: 0 14px; border-radius: 999px; cursor: pointer;
          font-size: var(--fs-sm); font-weight: 600; white-space: nowrap;
          border: 1px solid var(--border-soft); background: var(--bg-surface); color: var(--text-mid);
          transition: background var(--dur-fast) ease, border-color var(--dur-fast) ease, color var(--dur-fast) ease, transform var(--dur-instant) var(--ease-out);
        }
        .toggle-chip:hover, .fchip:hover { border-color: var(--color-forest-300); }
        .toggle-chip:active, .fchip:active { transform: scale(0.97); }
        .toggle-chip[aria-pressed="true"] {
          background: color-mix(in srgb, var(--primary) 12%, transparent);
          border-color: color-mix(in srgb, var(--primary) 40%, transparent); color: var(--primary);
        }
        .fchip { height: 36px; }
        .fchip-primary { background: var(--primary); color: var(--primary-fg); border-color: var(--primary); }
        .fchip-count {
          display: inline-grid; place-items: center; min-width: 18px; height: 18px; padding: 0 5px;
          border-radius: 999px; font-size: 10px; font-family: var(--font-mono);
        }

        /* ---- Filtre grupları ---- */
        .filter-group { margin-bottom: 18px; }
        .filter-label {
          display: block; font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--text-low); margin-bottom: 10px;
        }
        .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .filter-double { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 720px) { .filter-double { grid-template-columns: 1fr; gap: 8px; } }

        .result-bar {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin: 8px 0 24px; padding-top: 18px; border-top: 1px solid var(--border-hair);
          font-size: var(--fs-base); color: var(--text-mid); flex-wrap: wrap;
        }
        .result-bar strong { color: var(--text-hi); font-size: var(--fs-lg); }

        /* ---- Grid ---- */
        .seed-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(288px, 1fr)); gap: 20px; }
        @media (max-width: 480px) { .seed-grid { grid-template-columns: 1fr; } }
        .tilt-wrap { perspective: 900px; }

        .seed-card {
          --rx: 0deg; --ry: 0deg;
          position: relative; height: 100%; display: flex; flex-direction: column;
          background: var(--bg-surface); border: 1px solid var(--border-hair);
          border-radius: var(--radius-card); box-shadow: var(--shadow-sm);
          cursor: pointer; transform-style: preserve-3d;
          transform: rotateX(var(--rx)) rotateY(var(--ry));
          transition: transform 240ms var(--ease-out), box-shadow 240ms var(--ease-out), border-color 200ms ease;
          animation: card-in 460ms var(--ease-out) both; will-change: transform;
        }
        @keyframes card-in { from { opacity: 0; } to { opacity: 1; } }
        .seed-card:hover { box-shadow: var(--shadow-lg); border-color: color-mix(in srgb, var(--sc) 55%, var(--border-hair)); }
        .seed-card:focus-visible { outline: 2px solid var(--ring); outline-offset: 3px; }

        .seed-strip {
          position: absolute; top: 0; left: 0; right: 0; height: 4px;
          background: var(--sc); border-radius: var(--radius-card) var(--radius-card) 0 0;
        }
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
        .seed-head { padding: 20px 18px 12px; transform: translateZ(26px); }
        .seed-content { padding: 14px 18px 18px; margin-top: auto; }

        .seed-illus {
          position: relative; height: 118px; overflow: hidden;
          border-block: 1px solid var(--border-hair);
        }
        .seed-illus-bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(120% 80% at 15% 10%, color-mix(in srgb, var(--sc) 22%, var(--bg-surface)), transparent 60%),
            linear-gradient(150deg, color-mix(in srgb, var(--sc) 16%, var(--bg-surface)), color-mix(in srgb, var(--sc) 4%, var(--bg-surface)));
        }
        .seed-illus-art {
          position: absolute; right: -18px; top: -14px; width: 168px; height: 168px;
          opacity: 0.85;
        }
        .cat-tag {
          position: absolute; left: 12px; bottom: 12px; transform: translateZ(30px);
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 999px; color: #fff;
          background: color-mix(in srgb, var(--sc) 82%, black 4%);
          box-shadow: var(--shadow-sm);
        }
        .ev-badge {
          position: absolute; right: 12px; top: 12px; transform: translateZ(42px);
          width: 30px; height: 30px; border-radius: 999px; display: grid; place-items: center;
          background: var(--bg-surface); border: 1.5px solid var(--ec);
          color: var(--ec); box-shadow: var(--shadow-sm);
        }
        .ev-badge .font-mono { font-size: 13px; font-weight: 700; line-height: 1; }

        .metrics { display: grid; gap: 9px; }
        .metric-row { display: grid; grid-template-columns: 18px 1fr auto; align-items: center; gap: 10px; }

        /* ---- Boş durum ---- */
        .empty-state {
          text-align: center; padding: 64px 20px; border: 1px dashed var(--border-soft);
          border-radius: var(--radius-card); background: var(--bg-surface);
        }

        /* ---- Modal ---- */
        .modal-backdrop {
          position: fixed; inset: 0; z-index: 100; display: flex; align-items: flex-start; justify-content: center;
          padding: clamp(12px, 4vw, 48px) 16px; overflow-y: auto;
          background: color-mix(in srgb, var(--color-ink-900) 55%, transparent);
          backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
          animation: fade-up 200ms var(--ease-out) both;
        }
        .modal-card {
          position: relative; width: 100%; max-width: 720px; margin: auto;
          background: var(--bg-surface); border: 1px solid var(--border-soft);
          border-radius: var(--radius-bento); box-shadow: var(--shadow-lg); overflow: hidden;
          animation: grow-in 260ms var(--ease-out) both;
        }
        .modal-strip { position: absolute; top: 0; left: 0; right: 0; height: 5px; background: var(--sc); z-index: 2; }
        .modal-head {
          display: flex; align-items: flex-start; gap: 12px; padding: 26px 24px 18px;
          border-bottom: 1px solid var(--border-hair); position: sticky; top: 0;
          background: color-mix(in srgb, var(--bg-surface) 92%, transparent);
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); z-index: 1;
        }
        .modal-body { padding: 24px; }

        .note-cultivar {
          display: flex; gap: 10px; padding: 12px 14px; border-radius: 12px;
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 26%, transparent);
          color: var(--text-mid); font-size: var(--fs-sm); line-height: 1.5;
        }
        .note-cultivar strong { color: var(--text-hi); }
        .note-cultivar > span:first-child, .note-cultivar svg { color: var(--color-gold-600); flex-shrink: 0; }
        .dark .note-cultivar svg { color: var(--accent); }

        .legend-line {
          display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 22px;
          font-size: var(--fs-xs); color: var(--text-low);
        }
        .legend-line > span { display: inline-flex; align-items: center; gap: 6px; }
        .lg-swatch { width: 16px; height: 10px; border-radius: 3px; display: inline-block; }

        .spec-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }

        .muted-hint { color: var(--text-low); font-size: var(--fs-sm); margin: 0 0 14px; line-height: 1.5; }

        .companion-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
        .companion-item { padding: 14px; border-radius: 12px; border: 1px solid var(--border-hair); background: var(--bg-surface-2); }
        .companion-link {
          display: inline-flex; align-items: center; gap: 5px; font-weight: 600; color: var(--primary);
          background: none; border: none; cursor: pointer; padding: 0; font-size: var(--fs-base);
        }
        .companion-link:hover { color: var(--primary-hover); text-decoration: underline; }

        .rotation-box {
          padding: 16px; border-radius: 12px;
          background: color-mix(in srgb, var(--color-warning) 8%, transparent);
          border: 1px solid color-mix(in srgb, var(--color-warning) 26%, transparent);
        }

        .tips-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
        .tips-list li { display: flex; gap: 10px; align-items: flex-start; color: var(--text-mid); font-size: var(--fs-sm); line-height: 1.55; }

        .tag-blocks { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 30px; }
        @media (max-width: 560px) { .tag-blocks { grid-template-columns: 1fr; } }
        .tag-label { font-size: var(--fs-xs); font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-low); margin-bottom: 10px; }

        .source-box { margin-top: 30px; padding: 18px; border-radius: 14px; background: var(--bg-surface-2); border: 1px solid var(--border-hair); }

        @media (prefers-reduced-motion: reduce) {
          .seed-card { animation: none; transition: box-shadow 200ms ease, border-color 200ms ease; }
          .modal-card, .modal-backdrop { animation: none; }
        }
      `}</style>
    </>
  );
}
