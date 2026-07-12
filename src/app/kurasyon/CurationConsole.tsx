"use client";

import { useMemo, useState } from "react";
import { CROPS, CROP_BY_ID, type Crop } from "@/data/crops";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import {
  submitCorrection,
  reviewCorrection,
  withdrawSubmission,
  canReview,
  currentApprovedValue,
  CURATION_STATUS_LABELS,
  type CorrectionSubmission,
  type SubjectType,
} from "@/lib/curation";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Clipboard, Check, X } from "@/components/icons";

type FieldKey = "sunOptHours" | "phRange" | "daysToHarvest";

const FIELD_OPTIONS: { field: FieldKey; label: string }[] = [
  { field: "sunOptHours", label: "Optimum güneş (saat/gün)" },
  { field: "phRange", label: "Toprak pH aralığı" },
  { field: "daysToHarvest", label: "Hasada gün aralığı" },
];

function readFieldValue(crop: Crop, field: FieldKey): string {
  if (field === "sunOptHours") return String(crop.sunOptHours);
  if (field === "phRange") return `${crop.ph.optLow}-${crop.ph.optHigh}`;
  return `${crop.daysToHarvest[0]}-${crop.daysToHarvest[1]}`;
}

interface Persona {
  id: string;
  label: string;
  role: Role;
  userId: string;
}

const PERSONAS: Persona[] = [
  { id: "uretici", label: "Cem — üretici (öneri sahibi)", role: "saha-calisani", userId: "uretici@ornek.com" },
  { id: "satis", label: "Ayşe — satış (inceleme yetkisi yok)", role: "satis", userId: "ayse@ornek.com" },
  { id: "kalite", label: "Mert — kalite (inceleyebilir)", role: "kalite", userId: "mert@ornek.com" },
  { id: "uzman", label: "Dr. Naz — uzman (inceleyebilir)", role: "uzman", userId: "naz@ornek.com" },
];

const STATUS_CHIP_CLASS: Record<CorrectionSubmission["status"], string> = {
  incelemede: "chip-warn",
  onaylandi: "chip-ok",
  reddedildi: "chip-danger",
  "geri-cekildi": "chip-info",
};

function buildSeedSubmissions(): CorrectionSubmission[] {
  const s1 = submitCorrection(
    { subjectType: "crop", subjectId: "domates", field: "sunOptHours", currentValue: "6", proposedValue: "7", submittedBy: "uretici@ornek.com" },
    "2026-06-01T09:00:00Z",
    []
  );
  const approved1 = reviewCorrection(s1, "uzman", "onayla", "naz@ornek.com", "2026-06-02T09:00:00Z", "Saha verisiyle doğrulandı").submission;

  const s2 = submitCorrection(
    { subjectType: "crop", subjectId: "domates", field: "sunOptHours", currentValue: "7", proposedValue: "9", submittedBy: "uretici@ornek.com" },
    "2026-06-10T09:00:00Z",
    [approved1]
  );
  const withdrawn2 = withdrawSubmission(s2, "uretici@ornek.com").submission;

  const s3 = submitCorrection(
    { subjectType: "crop", subjectId: "marul", field: "phRange", currentValue: "6-6.8", proposedValue: "6.2-7", sourceUrl: "https://extension.example/marul-ph", submittedBy: "baska-uretici@ornek.com" },
    "2026-06-15T09:00:00Z",
    [approved1, withdrawn2]
  );

  const s4 = submitCorrection(
    { subjectType: "crop", subjectId: "biber", field: "daysToHarvest", currentValue: "60-75", proposedValue: "50-60", submittedBy: "baska-uretici@ornek.com" },
    "2026-06-16T09:00:00Z",
    [approved1, withdrawn2, s3]
  );
  const rejected4 = reviewCorrection(s4, "kalite", "reddet", "mert@ornek.com", "2026-06-17T09:00:00Z", "Kaynak doğrulanamadı").submission;

  return [approved1, withdrawn2, s3, rejected4];
}

const SEED = buildSeedSubmissions();
const DEMO_NOW = "2026-07-12T09:00:00Z";

export function CurationConsole() {
  const [submissions, setSubmissions] = useState<CorrectionSubmission[]>(SEED);
  const [personaId, setPersonaId] = useState<string>("uretici");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [subjectId, setSubjectId] = useState<string>(CROPS[0].id);
  const [field, setField] = useState<FieldKey>("sunOptHours");
  const [proposedValue, setProposedValue] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");

  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const crop = CROP_BY_ID[subjectId];
  const currentValue = crop ? readFieldValue(crop, field) : "";

  const approvedValues = useMemo(() => {
    const pairs = new Map<string, { subjectId: string; field: string }>();
    for (const s of submissions) pairs.set(`${s.subjectId}::${s.field}`, { subjectId: s.subjectId, field: s.field });
    return Array.from(pairs.values()).map((p) => ({
      ...p,
      resolved: currentApprovedValue(p.subjectId, p.field, submissions),
    }));
  }, [submissions]);

  const sorted = useMemo(
    () => [...submissions].sort((a, b) => (a.submittedAtISO < b.submittedAtISO ? 1 : -1)),
    [submissions]
  );

  function handleSubmit() {
    if (!proposedValue.trim() || !crop) return;
    const next = submitCorrection(
      {
        subjectType: "crop" as SubjectType,
        subjectId,
        field,
        currentValue,
        proposedValue: proposedValue.trim(),
        sourceUrl: sourceUrl.trim() || undefined,
        submittedBy: persona.userId,
      },
      DEMO_NOW,
      submissions
    );
    setSubmissions((prev) => [...prev, next]);
    setProposedValue("");
    setSourceUrl("");
  }

  function handleReview(sub: CorrectionSubmission, decision: "onayla" | "reddet") {
    const outcome = reviewCorrection(sub, persona.role, decision, persona.userId, DEMO_NOW);
    if (!outcome.applied) {
      setErrors((prev) => ({ ...prev, [sub.id]: outcome.reason ?? "İşlem uygulanamadı" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [sub.id]: "" }));
    setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? outcome.submission : s)));
  }

  function handleWithdraw(sub: CorrectionSubmission) {
    const outcome = withdrawSubmission(sub, persona.userId);
    if (!outcome.applied) {
      setErrors((prev) => ({ ...prev, [sub.id]: outcome.reason ?? "İşlem uygulanamadı" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [sub.id]: "" }));
    setSubmissions((prev) => prev.map((s) => (s.id === sub.id ? outcome.submission : s)));
  }

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <Clipboard size={13} /> İçerik kürasyon konsolu
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Düzeltme öner, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>uzman incelesin</em>, sürüm kaybolmasın.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 640, margin: "0 auto" }} className="text-pretty">
            Yalnız <code className="tnum">compliance.review</code> izinli rol (kalite, uzman, sahip, yönetici) öneriyi
            değerlendirebilir. Bir düzeltme sonradan geri çekilse bile önceki onaylı karar kökeni korunur — sessizce değişmez.
          </p>
        </div>
      </section>

      {/* ---------- PERSONA SEÇİMİ ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Canlı demo" title="Kim olarak bakıyorsun?" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersonaId(p.id)}
                className="chip"
                aria-pressed={personaId === p.id}
                style={{
                  cursor: "pointer",
                  border: "none",
                  background: personaId === p.id ? "var(--primary)" : "var(--bg-surface-2)",
                  color: personaId === p.id ? "var(--primary-fg)" : "var(--text-mid)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className={`chip ${canReview(persona.role) ? "chip-ok" : "chip-danger"}`}>
              {canReview(persona.role) ? <Check size={13} /> : <X size={13} />}
              {ROLE_LABELS[persona.role]} — compliance.review
            </span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>
              {canReview(persona.role)
                ? "Bu rolle öneri onaylayabilir/reddedebilirsin."
                : "Bu rolle yalnız öneri gönderebilir ve kendi önerini geri çekebilirsin."}
            </span>
          </div>
        </div>
      </section>

      {/* ---------- ÖNERİ GÖNDER ---------- */}
      <section className="paper-section section">
        <div className="container-x">
          <NumberedHeading n="02" eyebrow="Adım 1" title="Düzeltme önerisi gönder" />
          <Reveal i={0} className="card" style={{ padding: 24, display: "grid", gap: 16, maxWidth: 640 }}>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Ürün/çeşit
              <select className="btn btn-secondary" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Alan
              <select className="btn btn-secondary" value={field} onChange={(e) => setField(e.target.value as FieldKey)}>
                {FIELD_OPTIONS.map((f) => (
                  <option key={f.field} value={f.field}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
              Mevcut değer: <strong className="tnum">{currentValue}</strong>
            </div>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Önerilen değer
              <input
                className="btn btn-secondary"
                style={{ textAlign: "left" }}
                value={proposedValue}
                onChange={(e) => setProposedValue(e.target.value)}
                placeholder="ör. 8-9"
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Kaynak URL (opsiyonel)
              <input
                className="btn btn-secondary"
                style={{ textAlign: "left" }}
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </label>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
              Gönderen: <strong>{persona.userId}</strong> ({ROLE_LABELS[persona.role]})
            </div>
            <button onClick={handleSubmit} disabled={!proposedValue.trim()} className="btn btn-primary" style={{ justifySelf: "start" }}>
              Öneriyi gönder
            </button>
          </Reveal>
        </div>
      </section>

      {/* ---------- İNCELEME KUYRUĞU ---------- */}
      <section className="section">
        <div className="container-x">
          <NumberedHeading n="03" eyebrow="Adım 2" title="İnceleme kuyruğu" />
          <div style={{ display: "grid", gap: 12 }}>
            {sorted.map((s) => {
              const c = CROP_BY_ID[s.subjectId];
              const fieldLabel = FIELD_OPTIONS.find((f) => f.field === s.field)?.label ?? s.field;
              const isPending = s.status === "incelemede";
              const isOwner = s.submittedBy === persona.userId;
              const mayReview = isPending && canReview(persona.role);
              return (
                <div key={s.id} className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <strong>
                      {c ? `${c.emoji} ${c.name}` : s.subjectId} — {fieldLabel}
                    </strong>
                    <span className={`chip ${STATUS_CHIP_CLASS[s.status]}`}>{CURATION_STATUS_LABELS[s.status]}</span>
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>
                    <span className="tnum" style={{ textDecoration: "line-through", color: "var(--text-low)" }}>
                      {s.currentValue}
                    </span>{" "}
                    → <strong className="tnum">{s.proposedValue}</strong> · sürüm v{s.version}
                  </div>
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Gönderen: {s.submittedBy} · {s.submittedAtISO.slice(0, 10)}
                    {s.sourceUrl ? (
                      <>
                        {" "}
                        ·{" "}
                        <a href={s.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
                          kaynak
                        </a>
                      </>
                    ) : null}
                    {s.reviewerId ? ` · İnceleyen: ${s.reviewerId}${s.reviewNote ? ` (${s.reviewNote})` : ""}` : ""}
                  </div>
                  {errors[s.id] ? (
                    <div className="chip chip-danger" style={{ justifyContent: "flex-start" }}>
                      <X size={13} /> {errors[s.id]}
                    </div>
                  ) : null}
                  {isPending ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {mayReview ? (
                        <>
                          <button onClick={() => handleReview(s, "onayla")} className="btn btn-primary btn-sm">
                            Onayla
                          </button>
                          <button onClick={() => handleReview(s, "reddet")} className="btn btn-ghost btn-sm">
                            Reddet
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                          {ROLE_LABELS[persona.role]} rolüyle onaylayamaz/reddedemezsin — compliance.review gerekir.
                        </span>
                      )}
                      {isOwner ? (
                        <button onClick={() => handleWithdraw(s)} className="btn btn-secondary btn-sm">
                          Geri çek
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- ONAYLI SÜRÜM GEÇMİŞİ ---------- */}
      <section className="pine-band grain section">
        <div className="container-x">
          <span className="eyebrow">Köken korunur</span>
          <h2 style={{ fontSize: "var(--fs-h2)", marginTop: 14, marginBottom: 10 }}>Onaylı sürüm geçmişi</h2>
          <p style={{ color: "#c7d2ca", fontSize: "var(--fs-sm)", maxWidth: 640, marginBottom: 24 }}>
            Geri çekilen veya reddedilen bir düzeltme, önceki onaylı kararı asla geçersiz kılmaz.
          </p>
          <Reveal i={0} style={{ overflowX: "auto" }}>
            <table className="curation-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Alan</th>
                  <th>Geçerli onaylı değer</th>
                  <th>Sürüm</th>
                </tr>
              </thead>
              <tbody>
                {approvedValues.map(({ subjectId: sid, field: f, resolved }) => {
                  const c = CROP_BY_ID[sid];
                  const fieldLabel = FIELD_OPTIONS.find((fo) => fo.field === f)?.label ?? f;
                  return (
                    <tr key={`${sid}::${f}`}>
                      <td>{c ? `${c.emoji} ${c.name}` : sid}</td>
                      <td>{fieldLabel}</td>
                      <td className="tnum">
                        {resolved ? (
                          resolved.value
                        ) : (
                          <span className="chip chip-info" style={{ display: "inline-flex" }}>
                            Onaylı sürüm yok
                          </span>
                        )}
                      </td>
                      <td className="tnum">{resolved ? `v${resolved.version}` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <style>{`
        .curation-table { border-collapse: collapse; width: 100%; min-width: 560px; font-size: var(--fs-sm); color: #e8ede9; }
        .curation-table th, .curation-table td { border-bottom: 1px solid rgba(232,237,233,.15); padding: 10px 14px; text-align: left; white-space: nowrap; }
        .curation-table thead th { color: #c7d2ca; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .curation-table tbody tr:hover { background: rgba(255,255,255,.04); }
      `}</style>
    </>
  );
}
