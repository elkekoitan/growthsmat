"use client";

import { useMemo, useState } from "react";
import { CROPS, CROP_BY_ID, EVIDENCE_LABELS, type EvidenceGrade } from "@/data/crops";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import {
  EXPERTS,
  canAnswerConsultation,
  matchExperts,
  openCase,
  assignCase,
  answerCase,
  closeCase,
  SPECIALTY_LABELS,
  VERIFICATION_LABELS,
  URGENCY_LABELS,
  CASE_STATUS_LABELS,
  type ConsultationCase,
  type ConsultSpecialty,
  type CaseUrgency,
  type ExpertProfile,
} from "@/lib/expertConsult";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { ShieldCheck, Check, X } from "@/components/icons";

const STATUS_CHIP_CLASS: Record<ConsultationCase["status"], string> = {
  acik: "chip-warn",
  atandi: "chip-info",
  yanitlandi: "chip-ok",
  kapatildi: "chip-info",
};

const VERIFICATION_CHIP_CLASS: Record<ExpertProfile["verification"], string> = {
  dogrulanmis: "chip-ok",
  dogrulanmamis: "chip-danger",
  askida: "chip-warn",
};

const PESTICIDE_DOSE_REASON =
  "Pestisit/girdi dozu ülke ve ürüne göre resmi olarak doğrulanmadan önerilemez. Etikette veya yetkili kaynakta olmayan doz/karışım AI tarafından üretilmez.";

// NOT: Bu fixture veri (vakalar) kasıtlı olarak Postgres'e taşınmadı — kimlik katmanı bu
// turda gerçek oturuma bağlandı, vaka/gönderi verisinin kendisi ayrı bir faz (Faz 4).
function buildSeedCases(): ConsultationCase[] {
  const seed: ConsultationCase[] = [];

  const c1 = openCase(
    {
      askedBy: "uretici@ornek.com",
      cropId: "feslegen",
      specialty: "bitki-korumasi",
      question: "Fesleğende yaprak lekesi var, ne yapmalıyım?",
      urgency: "orta",
      escalationSource: "dogrudan-talep",
    },
    "2026-07-01T09:00:00Z",
    seed
  );
  seed.push(c1);

  const c2Open = openCase(
    {
      askedBy: "baska-uretici@ornek.com",
      specialty: "toprak-bilimi",
      question: "Toprak pH'ı çok düşük çıktı, ne yapmalıyım?",
      urgency: "dusuk",
      escalationSource: "dogrudan-talep",
    },
    "2026-07-02T09:00:00Z",
    seed
  );
  seed.push(c2Open);
  const c2 = assignCase(c2Open, EXPERTS.find((e) => e.id === "exp-mert")!, "kalite", "2026-07-02T10:00:00Z").consultCase;

  const c3Open = openCase(
    {
      askedBy: "uretici@ornek.com",
      cropId: "cherry-domates-kompakt",
      specialty: "bitki-korumasi",
      question: "Domateste beyazsinek var, nasıl mücadele ederim?",
      urgency: "yuksek",
      escalationSource: "dogrudan-talep",
    },
    "2026-07-03T09:00:00Z",
    seed
  );
  seed.push(c3Open);
  const c3Assigned = assignCase(c3Open, EXPERTS.find((e) => e.id === "exp-naz")!, "kalite", "2026-07-03T10:00:00Z").consultCase;
  const c3 = answerCase(
    c3Assigned,
    "uzman",
    "exp-naz",
    "Sarı yapışkan tuzakla izleme + Beauveria bassiana bazlı biyolojik mücadele önerilir; kimyasal ilaç son çare.",
    "B",
    "2026-07-04T09:00:00Z"
  ).consultCase;

  const c4Open = openCase(
    {
      askedBy: "uretici@ornek.com",
      specialty: "organik-sertifikasyon",
      question: "Sertifikam geçiş sürecinde, ürünümü organik olarak satabilir miyim?",
      urgency: "orta",
      escalationSource: "dogrudan-talep",
    },
    "2026-07-04T09:00:00Z",
    seed
  );
  seed.push(c4Open);
  const c4Assigned = assignCase(c4Open, EXPERTS.find((e) => e.id === "exp-selin")!, "kalite", "2026-07-04T12:00:00Z").consultCase;
  const c4Answered = answerCase(
    c4Assigned,
    "uzman",
    "exp-selin",
    "Geçiş sürecindeki ürün yalnız açık 'geçiş sürecinde' etiketiyle satılabilir; 'organik' etiketi kullanılamaz.",
    "A",
    "2026-07-05T09:00:00Z"
  ).consultCase;
  const c4 = closeCase(c4Answered, "uretici@ornek.com", "saha-calisani", "2026-07-05T10:00:00Z").consultCase;

  const c5 = openCase(
    {
      askedBy: "uretici@ornek.com",
      specialty: "bitki-korumasi",
      question: "Domateste mildiyö için kaç ml ilaçlama yapmalıyım?",
      urgency: "yuksek",
      escalationSource: "asistan-guvenlik-blok",
      escalationReason: PESTICIDE_DOSE_REASON,
    },
    "2026-07-06T09:00:00Z",
    seed
  );

  return [c1, c2, c3, c4, c5];
}

const SEED = buildSeedCases();
const EVIDENCE_GRADES: EvidenceGrade[] = ["A", "B", "C", "D", "E"];

export interface ExpertConsultProps {
  email: string;
  role: Role;
  /** İstek anında hesaplanan gerçek saat — yalnız BUNDAN SONRA açılan/atanan/yanıtlanan
   * vakaları etkiler; yukarıdaki fixture vakaların kendi zaman damgaları değişmez. */
  nowISO: string;
}

export function ExpertConsult({ email, role, nowISO }: ExpertConsultProps) {
  const [cases, setCases] = useState<ConsultationCase[]>(SEED);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, { text: string; evidence: EvidenceGrade }>>({});

  const [specialty, setSpecialty] = useState<ConsultSpecialty>("bitki-korumasi");
  const [cropId, setCropId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [urgency, setUrgency] = useState<CaseUrgency>("orta");

  const sorted = useMemo(() => [...cases].sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1)), [cases]);

  function handleOpenCase() {
    if (!question.trim()) return;
    const next = openCase(
      {
        askedBy: email,
        cropId: cropId || undefined,
        specialty,
        question: question.trim(),
        urgency,
        escalationSource: "dogrudan-talep",
      },
      nowISO,
      cases
    );
    setCases((prev) => [...prev, next]);
    setQuestion("");
  }

  function handleAssign(c: ConsultationCase, expert: ExpertProfile) {
    const outcome = assignCase(c, expert, role, nowISO);
    if (!outcome.applied) {
      setErrors((prev) => ({ ...prev, [c.id]: outcome.reason ?? "İşlem uygulanamadı" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [c.id]: "" }));
    setCases((prev) => prev.map((x) => (x.id === c.id ? outcome.consultCase : x)));
  }

  function handleAnswer(c: ConsultationCase) {
    const draft = answerDrafts[c.id] ?? { text: "", evidence: "C" as EvidenceGrade };
    // NOT: gerçek hesaplar şu an fixture EXPERTS rosterindeki hiçbir kimliğe bağlı değil
    // (bu turun kapsamı yalnız kimlik katmanı) — bu yüzden hiçbir gerçek kullanıcı bir
    // vakaya "atanan uzman" olarak eşleşemez; bu, isAssignedToUser aşağıda hep false
    // döndüğü için dürüstçe UI'da hiç görünmez, sahte bir eşleşme uydurulmaz.
    const outcome = answerCase(c, role, "", draft.text, draft.evidence, nowISO);
    if (!outcome.applied) {
      setErrors((prev) => ({ ...prev, [c.id]: outcome.reason ?? "İşlem uygulanamadı" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [c.id]: "" }));
    setCases((prev) => prev.map((x) => (x.id === c.id ? outcome.consultCase : x)));
  }

  function handleClose(c: ConsultationCase) {
    const outcome = closeCase(c, email, role, nowISO);
    if (!outcome.applied) {
      setErrors((prev) => ({ ...prev, [c.id]: outcome.reason ?? "İşlem uygulanamadı" }));
      return;
    }
    setErrors((prev) => ({ ...prev, [c.id]: "" }));
    setCases((prev) => prev.map((x) => (x.id === c.id ? outcome.consultCase : x)));
  }

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Uzman danışma
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Asistan bloklarsa, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>gerçek bir uzman</em> devralır.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 640, margin: "0 auto" }} className="text-pretty">
            Uzman görüşü otomatik olarak &quot;kesin doğru&quot; sayılmaz — her yanıt kendi kanıt
            seviyesini taşır. Yalnız doğrulanmış ve uzmanlık alanı eşleşen uzmana atama yapılabilir.
          </p>
        </div>
      </section>

      {/* ---------- GERÇEK KİMLİK ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Gerçek oturum" title="Kimliğin" />
          <div className="card" style={{ padding: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span className={`chip ${canAnswerConsultation(role) ? "chip-ok" : "chip-danger"}`}>
              {canAnswerConsultation(role) ? <Check size={13} /> : <X size={13} />}
              {email} — {ROLE_LABELS[role]} — compliance.review
            </span>
            <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>
              {canAnswerConsultation(role)
                ? "Bu rolle vaka atayabilir ve (atanan uzman kimliğinle eşleşiyorsa) yanıtlayabilirsin."
                : "Bu rolle yalnız vaka açabilir ve kendi vakanı kapatabilirsin."}
            </span>
          </div>
        </div>
      </section>

      {/* ---------- YENİ VAKA AÇ ---------- */}
      <section className="paper-section section">
        <div className="container-x">
          <NumberedHeading n="02" eyebrow="Adım 1" title="Yeni danışma vakası aç" />
          <Reveal i={0} className="card" style={{ padding: 24, display: "grid", gap: 16, maxWidth: 640 }}>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Uzmanlık alanı
              <select className="btn btn-secondary" value={specialty} onChange={(e) => setSpecialty(e.target.value as ConsultSpecialty)}>
                {(Object.keys(SPECIALTY_LABELS) as ConsultSpecialty[]).map((s) => (
                  <option key={s} value={s}>
                    {SPECIALTY_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              İlgili ürün (opsiyonel)
              <select className="btn btn-secondary" value={cropId} onChange={(e) => setCropId(e.target.value)}>
                <option value="">— Belirtilmedi —</option>
                {CROPS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Soru
              <textarea
                className="btn btn-secondary"
                style={{ textAlign: "left", minHeight: 80, resize: "vertical" }}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Sorunu detaylıca yaz…"
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Aciliyet
              <select className="btn btn-secondary" value={urgency} onChange={(e) => setUrgency(e.target.value as CaseUrgency)}>
                {(Object.keys(URGENCY_LABELS) as CaseUrgency[]).map((u) => (
                  <option key={u} value={u}>
                    {URGENCY_LABELS[u]}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
              Soran: <strong>{email}</strong> ({ROLE_LABELS[role]})
            </div>
            <button onClick={handleOpenCase} disabled={!question.trim()} className="btn btn-primary" style={{ justifySelf: "start" }}>
              Vaka aç
            </button>
          </Reveal>
        </div>
      </section>

      {/* ---------- VAKA KUYRUĞU ---------- */}
      <section className="section">
        <div className="container-x">
          <NumberedHeading n="03" eyebrow="Adım 2" title="Vaka kuyruğu" />
          <div style={{ display: "grid", gap: 12 }}>
            {sorted.map((c) => {
              const crop = c.cropId ? CROP_BY_ID[c.cropId] : undefined;
              const candidates = matchExperts(EXPERTS, c.specialty);
              const topCandidate = candidates[0];
              const draft = answerDrafts[c.id] ?? { text: "", evidence: "C" as EvidenceGrade };
              // Gerçek hesapların EXPERTS rosterinde bir karşılığı yok (bkz. handleAnswer notu)
              // — bu yüzden yanıtlama paneli dürüstçe hiçbir hesap için açılmaz.
              const isAssignedToUser = false;
              const mayAssign = c.status === "acik" && canAnswerConsultation(role);
              const mayClose = c.status === "yanitlandi" && (email === c.askedBy || canAnswerConsultation(role));

              return (
                <div key={c.id} className="card" style={{ padding: 18, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <strong>
                      {crop ? `${crop.emoji} ${crop.name}` : SPECIALTY_LABELS[c.specialty]} — {c.id}
                    </strong>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span className="chip chip-info">{SPECIALTY_LABELS[c.specialty]}</span>
                      <span className="chip chip-warn">{URGENCY_LABELS[c.urgency]}</span>
                      <span className={`chip ${STATUS_CHIP_CLASS[c.status]}`}>{CASE_STATUS_LABELS[c.status]}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>{c.question}</div>
                  {c.escalationSource === "asistan-guvenlik-blok" && (
                    <div className="chip chip-danger" style={{ justifyContent: "flex-start" }}>
                      <ShieldCheck size={13} /> Asistan güvenlik bloğundan geldi: {c.escalationReason}
                    </div>
                  )}
                  <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    Soran: {c.askedBy} · {c.createdAtISO.slice(0, 10)}
                    {c.assignedExpertId ? ` · Atanan: ${EXPERTS.find((e) => e.id === c.assignedExpertId)?.name ?? c.assignedExpertId}` : ""}
                  </div>
                  {c.answer && (
                    <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", background: "var(--bg-surface-2)", padding: 12, borderRadius: "var(--radius-control)" }}>
                      <strong>Uzman yanıtı</strong> ({c.answerEvidence ? EVIDENCE_LABELS[c.answerEvidence] : ""}): {c.answer}
                    </div>
                  )}
                  {errors[c.id] ? (
                    <div className="chip chip-danger" style={{ justifyContent: "flex-start" }}>
                      <X size={13} /> {errors[c.id]}
                    </div>
                  ) : null}

                  {mayAssign && (
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      {topCandidate ? (
                        <button onClick={() => handleAssign(c, topCandidate)} className="btn btn-primary btn-sm">
                          {topCandidate.name}&apos;e ata
                        </button>
                      ) : (
                        <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>Bu uzmanlık alanında uygun doğrulanmış uzman yok.</span>
                      )}
                    </div>
                  )}
                  {c.status === "acik" && !canAnswerConsultation(role) && (
                    <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                      {ROLE_LABELS[role]} rolüyle atama yapamazsın — compliance.review gerekir.
                    </span>
                  )}

                  {isAssignedToUser && (
                    <div style={{ display: "grid", gap: 8 }}>
                      <textarea
                        className="btn btn-secondary"
                        style={{ textAlign: "left", minHeight: 60, resize: "vertical" }}
                        value={draft.text}
                        onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [c.id]: { ...draft, text: e.target.value } }))}
                        placeholder="Uzman görüşünü yaz…"
                      />
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select
                          className="btn btn-secondary btn-sm"
                          value={draft.evidence}
                          onChange={(e) => setAnswerDrafts((prev) => ({ ...prev, [c.id]: { ...draft, evidence: e.target.value as EvidenceGrade } }))}
                        >
                          {EVIDENCE_GRADES.map((g) => (
                            <option key={g} value={g}>
                              {g} — {EVIDENCE_LABELS[g]}
                            </option>
                          ))}
                        </select>
                        <button onClick={() => handleAnswer(c)} disabled={!draft.text.trim()} className="btn btn-primary btn-sm">
                          Yanıtla
                        </button>
                      </div>
                    </div>
                  )}

                  {mayClose && (
                    <button onClick={() => handleClose(c)} className="btn btn-secondary btn-sm" style={{ justifySelf: "start" }}>
                      Kapat
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- UZMAN ROSTERİ ---------- */}
      <section className="pine-band grain section">
        <div className="container-x">
          <span className="eyebrow">Doğrulama şart</span>
          <h2 style={{ fontSize: "var(--fs-h2)", marginTop: 14, marginBottom: 10 }}>Uzman rosteri</h2>
          <p style={{ color: "#c7d2ca", fontSize: "var(--fs-sm)", maxWidth: 640, marginBottom: 24 }}>
            Yalnız doğrulanmış ve uzmanlık alanı eşleşen uzmanlara vaka atanabilir.
          </p>
          <Reveal i={0} style={{ overflowX: "auto" }}>
            <table className="expert-table">
              <thead>
                <tr>
                  <th>Uzman</th>
                  <th>Uzmanlık alanı</th>
                  <th>Doğrulama</th>
                  <th>Ort. yanıt süresi</th>
                  <th>Vaka sayısı</th>
                </tr>
              </thead>
              <tbody>
                {EXPERTS.map((e) => (
                  <tr key={e.id}>
                    <td>
                      <div>{e.name}</div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "#c7d2ca" }}>{e.credentials}</div>
                    </td>
                    <td>{e.specialties.map((s) => SPECIALTY_LABELS[s]).join(", ")}</td>
                    <td>
                      <span className={`chip ${VERIFICATION_CHIP_CLASS[e.verification]}`}>{VERIFICATION_LABELS[e.verification]}</span>
                    </td>
                    <td className="tnum">{e.avgResponseHours} sa</td>
                    <td className="tnum">{e.caseCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <style>{`
        .expert-table { border-collapse: collapse; width: 100%; min-width: 640px; font-size: var(--fs-sm); color: #e8ede9; }
        .expert-table th, .expert-table td { border-bottom: 1px solid rgba(232,237,233,.15); padding: 10px 14px; text-align: left; white-space: nowrap; }
        .expert-table thead th { color: #c7d2ca; font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .expert-table tbody tr:hover { background: rgba(255,255,255,.04); }
      `}</style>
    </>
  );
}
