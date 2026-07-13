"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { askAssistant, EXAMPLE_QUESTIONS, type AssistantAnswer } from "@/lib/assistant";
import { suggestSpecialtyForQuery, SPECIALTY_LABELS } from "@/lib/expertConsult";
import { Reveal } from "@/components/ui";
import { Sparkles, ShieldCheck, Check, ArrowRight, Globe } from "@/components/icons";

interface Message {
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
}

const CONFIDENCE_LABEL: Record<AssistantAnswer["confidence"], string> = {
  yuksek: "Yüksek güven",
  orta: "Orta güven",
  dusuk: "Düşük güven",
};

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const listEndRef = useRef<HTMLDivElement>(null);

  function send(q: string) {
    const query = q.trim();
    if (!query) return;
    const answer = askAssistant(query);
    setMessages((prev) => [...prev, { role: "user", text: query }, { role: "assistant", text: answer.answer, answer }]);
    setInput("");
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }));
  }

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <Sparkles size={13} /> Kaynak gösteren asistan
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Sorunu sor, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>kaynağıyla</em> cevap alsın.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 620, margin: "0 auto" }} className="text-pretty">
            Bu asistan bir dil modeli çağırmaz — bilgi grafiğimizdeki gerçek kayıtlarla kural
            tabanlı eşleştirme yapar. Pestisit dozu ve sağlık iddiası içeren sorularda cevap
            üretmez; uzmana yönlendirir.
          </p>
        </div>
      </section>

      {/* ---------- SOHBET ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-narrow">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ minHeight: 280, maxHeight: 520, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
              {messages.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-low)" }}>
                  <Sparkles size={28} style={{ marginBottom: 10, opacity: 0.6 }} />
                  <p style={{ fontSize: "var(--fs-sm)" }}>Aşağıdaki örneklerden birini dene veya kendi sorunu yaz.</p>
                </div>
              )}
              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} style={{ alignSelf: "flex-end", maxWidth: "80%" }}>
                    <div
                      style={{
                        background: "var(--primary)",
                        color: "var(--primary-fg)",
                        borderRadius: "14px 14px 4px 14px",
                        padding: "10px 16px",
                        fontSize: "var(--fs-base)",
                      }}
                    >
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} style={{ alignSelf: "flex-start", maxWidth: "88%" }}>
                    <div
                      style={{
                        background: m.answer?.safetyBlocked ? "color-mix(in srgb, var(--color-danger) 8%, var(--bg-surface-2))" : "var(--bg-surface-2)",
                        border: m.answer?.safetyBlocked ? "1px solid color-mix(in srgb, var(--color-danger) 35%, transparent)" : "1px solid var(--border-hair)",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "12px 16px",
                        fontSize: "var(--fs-base)",
                        lineHeight: 1.55,
                      }}
                    >
                      {m.answer?.safetyBlocked && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--color-danger)", fontWeight: 600, fontSize: "var(--fs-sm)" }}>
                          <ShieldCheck size={15} /> Güvenlik filtresi devrede
                        </div>
                      )}
                      {m.text}
                    </div>
                    {m.answer && !m.answer.safetyBlocked && (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        <span className={`chip ${m.answer.confidence === "yuksek" ? "chip-ok" : m.answer.confidence === "orta" ? "chip-warn" : "chip-info"}`}>
                          <Check size={12} /> {CONFIDENCE_LABEL[m.answer.confidence]}
                        </span>
                        {m.answer.citations.map((c, ci) => (
                          <span key={ci} className="chip" title={`${c.org}, ${c.year}`}>
                            <Globe size={12} /> {c.title}
                          </span>
                        ))}
                      </div>
                    )}
                    {m.answer && (
                      <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 8 }}>
                        {m.answer.suggestedAction}
                      </p>
                    )}
                    {m.answer?.safetyBlocked && (
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
                        <Link href="/uzman-danisma" className="btn btn-secondary btn-sm">
                          Uzmana danışmanlık talep et <ArrowRight size={14} />
                        </Link>
                        {suggestSpecialtyForQuery(m.answer.query) && (
                          <span className="chip chip-info">
                            Önerilen alan: {SPECIALTY_LABELS[suggestSpecialtyForQuery(m.answer.query)!]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
              <div ref={listEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid var(--border-hair)", background: "var(--bg-surface-2)" }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Örn. Balkonda cherry domates yetişir mi?"
                aria-label="Asistana soru sor"
                className="chat-input"
              />
              <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
                Sor <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <Reveal i={0} style={{ marginTop: 20 }}>
            <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 10 }}>Örnek sorular:</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EXAMPLE_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} className="chip" style={{ cursor: "pointer", border: "none", background: "var(--bg-surface-2)" }}>
                  {q}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- NASIL ÇALIŞIR ---------- */}
      <section className="paper-section section">
        <div className="container-x">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            <Reveal i={0} className="card" style={{ padding: 20 }}>
              <Globe size={20} style={{ color: "var(--primary)", marginBottom: 10 }} />
              <h3 style={{ fontSize: "var(--fs-base)", marginBottom: 6 }}>Kaynaksız cevap yok</h3>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", margin: 0 }}>
                Her yanıt bilgi grafiğindeki gerçek bir kayda (extension yayını, uyum kuralı) dayanır.
              </p>
            </Reveal>
            <Reveal i={1} className="card" style={{ padding: 20 }}>
              <ShieldCheck size={20} style={{ color: "var(--primary)", marginBottom: 10 }} />
              <h3 style={{ fontSize: "var(--fs-base)", marginBottom: 6 }}>Güvenlik filtresi</h3>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", margin: 0 }}>
                Pestisit dozu ve tıbbi iddia soruları otomatik bloklanır; uzmana yönlendirilir.
              </p>
            </Reveal>
            <Reveal i={2} className="card" style={{ padding: 20 }}>
              <Check size={20} style={{ color: "var(--primary)", marginBottom: 10 }} />
              <h3 style={{ fontSize: "var(--fs-base)", marginBottom: 6 }}>Veri boşluğunu gizlemez</h3>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", margin: 0 }}>
                Eşleşme yoksa düşük güvenle açıkça söyler; sahte kesinlik üretmez.
              </p>
            </Reveal>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <Link href="/plan" className="btn btn-secondary">
              Tam uygunluk analizi için /plan&apos;a git <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <style>{`
        .chat-input {
          flex: 1;
          padding: 12px 14px;
          border-radius: var(--radius-control);
          border: 1px solid var(--border-soft);
          background: var(--bg-surface);
          color: var(--text-hi);
          font-size: var(--fs-base);
        }
        .chat-input:focus-visible { outline: 2px solid var(--ring); outline-offset: 1px; }
      `}</style>
    </>
  );
}
