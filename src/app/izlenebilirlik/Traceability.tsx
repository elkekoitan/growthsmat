"use client";

import { useActionState, useMemo, useState } from "react";
import {
  LOT_TYPE_LABELS,
  traceForward,
  traceBackward,
  validateMassBalance,
  checkOrganicClaimChain,
  simulateRecall,
  type Lot,
  type LotType,
} from "@/lib/traceability";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import {
  Package,
  Layers,
  Clipboard,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  Calendar,
  Scale,
  Sparkles,
} from "@/components/icons";
import { createLotAction, type LotFormState } from "./actions";

const TYPE_ORDER: LotType[] = ["tohum", "girdi", "uretim", "hasat", "paket", "sevkiyat"];
const INITIAL_FORM_STATE: LotFormState = {};

const TYPE_ICON: Record<LotType, typeof Package> = {
  tohum: Layers,
  girdi: Layers,
  uretim: Clipboard,
  hasat: Package,
  paket: Package,
  sevkiyat: ArrowRight,
};

const STATUS_TONE: Record<Lot["status"], "ok" | "warn" | "danger" | "info"> = {
  aktif: "ok",
  incelemede: "warn",
  karantina: "danger",
  "geri-cagrildi": "danger",
  tuketildi: "info",
};

function LotChip({ lot, onClick }: { lot: Lot; onClick?: () => void }) {
  const Icon = TYPE_ICON[lot.type];
  return (
    <button
      onClick={onClick}
      className="chip"
      style={{ cursor: onClick ? "pointer" : "default", border: "none", background: "var(--bg-surface-2)" }}
    >
      <Icon size={12} /> {lot.id}
    </button>
  );
}

export function Traceability({ initialLots, canCreateLot }: { initialLots: Lot[]; canCreateLot: boolean }) {
  const lots = initialLots;
  const [selectedId, setSelectedId] = useState<string>(lots[3]?.id ?? lots[0]?.id ?? "");
  const [recallOpen, setRecallOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [createState, createAction, createPending] = useActionState(createLotAction, INITIAL_FORM_STATE);

  const lot = lots.find((l) => l.id === selectedId) ?? lots[0];
  const backward = useMemo(() => traceBackward(selectedId, lots), [selectedId, lots]);
  const forward = useMemo(() => traceForward(selectedId, lots), [selectedId, lots]);
  const massBalance = useMemo(() => validateMassBalance(selectedId, lots), [selectedId, lots]);
  const claimChain = useMemo(() => checkOrganicClaimChain(selectedId, lots), [selectedId, lots]);
  const recall = useMemo(() => simulateRecall(selectedId, lots), [selectedId, lots]);

  if (!lot) {
    return (
      <section className="section container-narrow" style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text-mid)" }}>Henüz kayıtlı lot yok.</p>
      </section>
    );
  }

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Lot izlenebilirlik
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Her lot, <em style={{ fontStyle: "italic", color: "var(--primary)" }}>bir adım geri</em> ve bir adım ileri izlenir.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 620, margin: "0 auto" }} className="text-pretty">
            Tohumdan sevkiyata kadar zincir; mass balance sapması otomatik yakalanır, organik
            iddiası zincirdeki tüm atalar sertifikalı olmadıkça yayınlanmaz.
          </p>
        </div>
      </section>

      {/* ---------- LOT SEÇİMİ ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Bir lot seç" title="Zinciri incele" />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {lots.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setSelectedId(l.id);
                  setRecallOpen(false);
                }}
                className="chip"
                aria-pressed={selectedId === l.id}
                style={{
                  cursor: "pointer",
                  border: "none",
                  background: selectedId === l.id ? "var(--primary)" : "var(--bg-surface-2)",
                  color: selectedId === l.id ? "var(--primary-fg)" : "var(--text-mid)",
                }}
              >
                {LOT_TYPE_LABELS[l.type]} · {l.id}
              </button>
            ))}
          </div>

          {canCreateLot && (
            <div style={{ marginBottom: 28 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFormOpen((o) => !o)}
                aria-expanded={formOpen}
              >
                <Sparkles size={15} /> {formOpen ? "Formu kapat" : "Yeni lot kaydet"}
              </button>

              {formOpen && (
                <form action={createAction} className="card" style={{ padding: 20, marginTop: 12, display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="lot-form-grid">
                    <label className="field">
                      <span className="field-label">Lot kodu</span>
                      <input name="code" required placeholder="PKG-2026-104" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Tip</span>
                      <select name="type" className="control" defaultValue="uretim">
                        {TYPE_ORDER.map((t) => (
                          <option key={t} value={t}>
                            {LOT_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="field-label">Etiket</span>
                      <input name="label" required placeholder="500g file — parti C" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Miktar</span>
                      <input name="quantity" type="number" min="0" step="any" required placeholder="120" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Birim</span>
                      <input name="unit" required placeholder="kg" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Üretim tarihi</span>
                      <input name="producedAt" type="date" required className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Bitki (opsiyonel)</span>
                      <input name="cropId" placeholder="cherry-domates-kompakt" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Sahip / alıcı etiketi</span>
                      <input name="ownerLabel" required placeholder="Ayşe — Sera İşletmesi" className="control" />
                    </label>
                    <label className="field">
                      <span className="field-label">Girdi lotları (virgülle)</span>
                      <input name="parentCodes" placeholder="HARVEST-2026-058" className="control" />
                    </label>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "var(--fs-sm)" }}>
                    <input name="certifiedOrigin" type="checkbox" />
                    Bu üretim adımı sertifikalı
                  </label>
                  {createState.error && <p style={{ color: "var(--color-danger)", fontSize: "var(--fs-sm)", margin: 0 }}>{createState.error}</p>}
                  {createState.success && <p style={{ color: "var(--color-success)", fontSize: "var(--fs-sm)", margin: 0 }}>{createState.success}</p>}
                  <div>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={createPending}>
                      <Check size={15} /> Lotu kaydet
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }} className="trace-grid">
            {/* Lot detayı + mass balance + organik zincir */}
            <div className="card" style={{ padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    display: "grid",
                    placeItems: "center",
                    background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <Package size={20} />
                </span>
                <div>
                  <h3 style={{ fontSize: "var(--fs-lg)", margin: 0 }}>{lot.label}</h3>
                  <span className="font-mono" style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
                    {lot.id}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8, fontSize: "var(--fs-sm)", color: "var(--text-mid)", marginBottom: 16 }}>
                <div>Sahip: {lot.ownerLabel}</div>
                <div>
                  <Calendar size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                  {lot.producedAt} · <span className="font-mono">{lot.quantity} {lot.unit}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                <span className={`chip chip-${STATUS_TONE[lot.status]}`}>{lot.status}</span>
                <span className={`chip ${lot.certifiedOrigin ? "chip-ok" : "chip-warn"}`}>
                  <ShieldCheck size={12} /> {lot.certifiedOrigin ? "Sertifikalı adım" : "Sertifikasız adım"}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
                  <Scale size={14} /> Mass balance
                </div>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-mid)", margin: 0 }}>
                  Girdi: <span className="font-mono">{massBalance.inputQty}</span> → Çıktı:{" "}
                  <span className="font-mono">{massBalance.outputQty}</span> ({massBalance.lossPct}% fire)
                </p>
                <span className={`chip ${massBalance.valid ? "chip-ok" : "chip-danger"}`} style={{ marginTop: 8 }}>
                  {massBalance.valid ? <Check size={12} /> : <X size={12} />}
                  {massBalance.valid ? "Denge doğrulandı" : "Sapma — düzeltici kayıt gerekir"}
                </span>
              </div>

              <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--fs-sm)", fontWeight: 600, marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Organik iddia kapısı
                </div>
                <span className={`chip ${claimChain.publishable ? "chip-ok" : "chip-danger"}`}>
                  {claimChain.publishable ? <Check size={12} /> : <X size={12} />}
                  {claimChain.publishable ? "Yayınlanabilir" : `Bloklu — kırılma: ${claimChain.brokenAt}`}
                </span>
              </div>
            </div>

            {/* İleri/geri iz */}
            <div className="card" style={{ padding: 22 }}>
              <h3 style={{ fontSize: "var(--fs-lg)", marginBottom: 14 }}>Zincir</h3>
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  ← Geriye (kaynak)
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {backward.length === 0 ? (
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>Kök lot — üst kaynağı yok.</span>
                  ) : (
                    backward.map((l) => <LotChip key={l.id} lot={l} onClick={() => setSelectedId(l.id)} />)
                  )}
                </div>
              </div>
              <div>
                <p style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                  İleriye (nereye gitti) →
                </p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {forward.length === 0 ? (
                    <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>Uç lot — henüz devamı yok.</span>
                  ) : (
                    forward.map((l) => <LotChip key={l.id} lot={l} onClick={() => setSelectedId(l.id)} />)
                  )}
                </div>
              </div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border-hair)" }}>
                <button onClick={() => setRecallOpen((o) => !o)} className="btn btn-secondary btn-sm">
                  {recallOpen ? "Geri çağırma simülasyonunu kapat" : "Bu lotu şüpheli işaretle — geri çağırmayı simüle et"}
                </button>
              </div>
            </div>
          </div>

          {/* Geri çağırma simülasyonu */}
          {recallOpen && (
            <Reveal i={0} className="pine-band grain" style={{ marginTop: 24, padding: 28, borderRadius: "var(--radius-bento)" }}>
              <h3 style={{ fontSize: "var(--fs-h3)", marginBottom: 6 }}>Geri çağırma simülasyonu — {lot.id}</h3>
              <p style={{ color: "rgba(232,237,233,.78)", fontSize: "var(--fs-sm)", marginBottom: 20, maxWidth: 640 }}>
                Şüpheli/uygunsuz sonuç bu lota bağlandığında sistem şu zinciri saniyeler içinde çıkarır —
                kullanıcı/uzman onayı olmadan resmi bildirim gönderilmez.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
                <div>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--color-gold-300)", fontWeight: 600, marginBottom: 8 }}>
                    KARANTİNAYA ALINACAK ({recall.quarantineLots.length})
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recall.quarantineLots.length === 0 ? (
                      <span style={{ fontSize: "var(--fs-sm)", color: "rgba(232,237,233,.6)" }}>Elde kalan stok yok.</span>
                    ) : (
                      recall.quarantineLots.map((l) => (
                        <span key={l.id} className="chip chip-danger">{l.id}</span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--color-gold-300)", fontWeight: 600, marginBottom: 8 }}>
                    ALICI BİLDİRİMİ GEREKEN ({recall.affectedShipments.length})
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recall.affectedShipments.length === 0 ? (
                      <span style={{ fontSize: "var(--fs-sm)", color: "rgba(232,237,233,.6)" }}>Sevkiyat yok.</span>
                    ) : (
                      recall.affectedShipments.map((l) => (
                        <span key={l.id} className="chip chip-warn">{l.ownerLabel}</span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: "var(--fs-xs)", color: "var(--color-gold-300)", fontWeight: 600, marginBottom: 8 }}>
                    KÖK NEDEN ANALİZİ ({recall.upstreamSources.length} adım geri)
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {recall.upstreamSources.map((l) => (
                      <span key={l.id} className="chip">{l.id}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 860px) { .trace-grid { grid-template-columns: 1fr !important; } }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: var(--fs-xs); font-weight: 600; color: var(--text-mid); }
        .control {
          height: 40px; padding: 0 12px; border-radius: var(--radius-control);
          background: var(--bg-surface); border: 1px solid var(--border-soft); color: var(--text-hi);
          font-size: var(--fs-base); font-family: var(--font-sans); width: 100%;
        }
        .control:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 18%, transparent); }
        @media (max-width: 720px) { .lot-form-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
}
