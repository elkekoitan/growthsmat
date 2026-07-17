"use client";
// SmartGrowth OS — /alan-kalitesi oturumlu görünüm: kullanıcının GERÇEK alanları.
// Skor sunucuda (listSitesWithQuality) taze hesaplanıp buraya hazır gelir — istemci hesap
// YAPMAZ, yalnız gösterir ve ham girdi (alan, test, gözlem) yazan formları sunar.
// TASARIM İLKESİ (Bahçem ile aynı): boş durum tek cümle + tek form; kart başına formlar
// details/summary ile katlanır — sayfa forma boğulmaz.
import { useActionState, useTransition } from "react";
import { GRADE_LABELS } from "@/lib/siteQuality";
import { RadialGauge } from "@/components/graphics";
import { Check, X } from "@/components/icons";
import type { SiteWithQuality } from "@/server/repositories/sites";
import {
  addSoilTestAction,
  addWaterTestAction,
  createSiteAction,
  deleteSiteAction,
  updateSiteObservationsAction,
  type SiteFormState,
} from "./actions";

const INITIAL_STATE: SiteFormState = {};

/** Form sonucu tek satırda: hata kırmızı, başarı yeşil chip — uydurma "kaydedildi" yok. */
function FormResult({ state }: { state: SiteFormState }) {
  if (state.error) {
    return (
      <span className="chip chip-danger" style={{ marginTop: 8 }}>
        <X size={12} /> {state.error}
      </span>
    );
  }
  if (state.success) {
    return (
      <span className="chip chip-ok" style={{ marginTop: 8 }}>
        <Check size={12} /> {state.success}
      </span>
    );
  }
  return null;
}

export function SiteQualityBoard({ sites }: { sites: SiteWithQuality[] }) {
  return (
    <section className="section">
      <div className="container-x" style={{ paddingBlock: "clamp(2rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem)", maxWidth: 860 }}>
        <div>
          <span className="eyebrow">Alan veri kalitesi</span>
          <p style={{ margin: "10px 0 0", fontSize: "var(--fs-lg)", fontWeight: 600 }}>
            {sites.length > 0 ? `${sites.length} alanın kayıtlı.` : "Henüz kayıtlı alanın yok."}
          </p>
          <p style={{ margin: "8px 0 0", color: "var(--text-mid)", fontSize: "var(--fs-sm)" }}>
            Skor kaydedilmez — her açılışta güncel tarihe göre yeniden hesaplanır; eksik ve
            bayat veri ayrı ayrı işaretlenir.
          </p>
        </div>

        {sites.length === 0 ? (
          <div
            style={{
              marginTop: 24,
              padding: "28px 20px",
              border: "1px dashed var(--border-soft)",
              borderRadius: "var(--radius-card)",
              background: "var(--bg-surface)",
            }}
          >
            <CreateSiteForm title="İlk alanını ekle" />
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 12, marginTop: 24 }}>
              {sites.map((s) => (
                <SiteCard key={s.siteId} site={s} />
              ))}
            </div>
            <details className="card" style={{ padding: 16, marginTop: 16 }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "var(--fs-sm)" }}>+ Yeni alan ekle</summary>
              <div style={{ marginTop: 12 }}>
                <CreateSiteForm />
              </div>
            </details>
          </>
        )}
      </div>

      <style>{`
        .sqb-form { display: grid; gap: 10px; }
        .sqb-form label { display: grid; gap: 4px; font-size: var(--fs-xs); color: var(--text-mid); }
        .sqb-form input[type="text"], .sqb-form input[type="number"], .sqb-form input[type="date"] {
          height: 36px; padding: 0 10px; border-radius: 10px; font-size: var(--fs-sm);
          border: 1px solid var(--border-hair); background: var(--bg-inset); color: var(--text-hi);
        }
        .sqb-check { display: flex !important; grid-auto-flow: column; justify-content: flex-start;
          align-items: center; gap: 8px; cursor: pointer; }
        .sqb-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .sqb-card { display: flex; gap: 18px; align-items: flex-start; padding: 18px; flex-wrap: wrap; }
        .sqb-x {
          width: 30px; height: 30px; display: grid; place-items: center;
          border: none; background: transparent; color: var(--text-low);
          border-radius: 8px; cursor: pointer;
        }
        .sqb-x:hover { color: var(--color-danger); background: var(--bg-inset); }
        .sqb-details summary { cursor: pointer; font-size: var(--fs-xs); color: var(--text-mid); font-weight: 600; }
        .sqb-details { border-top: 1px solid var(--border-hair); padding-top: 10px; }
      `}</style>
    </section>
  );
}

/** Yeni alan formu — boş durumda başlıklı, dolu durumda details içinde başlıksız. */
function CreateSiteForm({ title }: { title?: string }) {
  const [state, action, pending] = useActionState(createSiteAction, INITIAL_STATE);
  return (
    <form action={action} className="sqb-form">
      {title && <p style={{ margin: 0, fontWeight: 600 }}>{title}</p>}
      <div className="sqb-row">
        <label>
          Alan adı
          <input type="text" name="name" required maxLength={80} placeholder="ör. Arka bahçe" />
        </label>
        <label>
          Büyüklük (m²)
          <input type="number" name="areaM2" required min={0.1} step="any" placeholder="ör. 24" />
        </label>
        <label>
          Güneş saati (gözlem, isteğe bağlı)
          <input type="number" name="sunHoursObserved" min={0} max={24} step="any" placeholder="ör. 6" />
        </label>
      </div>
      <label className="sqb-check">
        <input type="checkbox" name="exactLocationKnown" />
        <span>Tam konumu biliyorum</span>
      </label>
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Ekleniyor…" : "Alanı ekle"}
        </button>
      </div>
      <FormResult state={state} />
    </form>
  );
}

function SiteCard({ site }: { site: SiteWithQuality }) {
  const { profile, result } = site;
  const [soilState, soilAction, soilPending] = useActionState(addSoilTestAction, INITIAL_STATE);
  const [waterState, waterAction, waterPending] = useActionState(addWaterTestAction, INITIAL_STATE);
  const [obsState, obsAction, obsPending] = useActionState(updateSiteObservationsAction, INITIAL_STATE);
  const [deletePending, startDelete] = useTransition();

  const gaugeColor =
    result.grade === "yuksek" ? "var(--color-success)" : result.grade === "orta" ? "var(--color-warning)" : "var(--color-danger)";

  const onDelete = () => {
    // confirm yerlidir ama dürüsttür: silme geri alınamaz (testler Cascade ile gider).
    if (!window.confirm(`"${profile.name}" alanı ve kayıtlı testleri silinsin mi? Bu geri alınamaz.`)) return;
    startDelete(async () => {
      await deleteSiteAction(site.siteId);
    });
  };

  return (
    <div className="card sqb-card">
      <RadialGauge value={result.score} size={110} sub={GRADE_LABELS[result.grade]} color={gaugeColor} />

      <div style={{ minWidth: 0, flex: 1, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>{profile.name}</h2>
          <span className="font-mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
            {profile.areaM2.toLocaleString("tr-TR")} m²
          </span>
          <button
            type="button"
            className="sqb-x"
            disabled={deletePending}
            onClick={onDelete}
            aria-label={`${profile.name} alanını sil`}
            style={{ marginLeft: "auto" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Gerçek kayıt sayıları — motor yalnız en yeni teste bakar, ama geçmiş kayıtlıdır. */}
        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-low)" }}>
          {site.soilTestCount} toprak testi · {site.waterTestCount} su testi kayıtlı
        </div>

        {result.issues.length === 0 ? (
          <p style={{ margin: 0, color: "var(--color-success)", fontSize: "var(--fs-sm)" }}>
            <Check size={14} style={{ verticalAlign: -2 }} /> Eksik veya bayat veri yok
          </p>
        ) : (
          <div style={{ display: "grid", gap: 6 }}>
            {result.issues.map((issue, i) => (
              <div key={i} className={`chip ${issue.kind === "eksik" ? "chip-danger" : "chip-warn"}`} style={{ justifyContent: "flex-start" }}>
                <X size={12} /> {issue.detail}
              </div>
            ))}
          </div>
        )}

        {/* Toprak testi ekle — katlanır, sayfayı forma boğma */}
        <details className="sqb-details">
          <summary>Toprak testi ekle</summary>
          <form action={soilAction} className="sqb-form" style={{ marginTop: 10 }}>
            <input type="hidden" name="siteId" value={site.siteId} />
            <div className="sqb-row">
              <label>
                pH
                <input type="number" name="ph" required min={0} max={14} step="any" placeholder="ör. 6.4" />
              </label>
              <label>
                EC (dS/m)
                <input type="number" name="ec" required min={0} max={20} step="any" placeholder="ör. 1.1" />
              </label>
              <label>
                Organik madde (%)
                <input type="number" name="organicMatterPct" required min={0} max={100} step="any" placeholder="ör. 3.2" />
              </label>
              <label>
                Örnekleme tarihi
                <input type="date" name="sampledAt" required />
              </label>
            </div>
            <div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={soilPending}>
                {soilPending ? "Kaydediliyor…" : "Testi kaydet"}
              </button>
            </div>
            <FormResult state={soilState} />
          </form>
        </details>

        {/* Su testi ekle */}
        <details className="sqb-details">
          <summary>Su testi ekle</summary>
          <form action={waterAction} className="sqb-form" style={{ marginTop: 10 }}>
            <input type="hidden" name="siteId" value={site.siteId} />
            <div className="sqb-row">
              <label>
                Test tarihi
                <input type="date" name="testedAt" required />
              </label>
            </div>
            <label className="sqb-check">
              <input type="checkbox" name="qualityOk" />
              <span>Su kalitesi uygun çıktı</span>
            </label>
            <div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={waterPending}>
                {waterPending ? "Kaydediliyor…" : "Testi kaydet"}
              </button>
            </div>
            <FormResult state={waterState} />
          </form>
        </details>

        {/* Güneş saati + tam konum — küçük inline güncelleme */}
        <details className="sqb-details">
          <summary>Güneş saati / konum güncelle</summary>
          <form action={obsAction} className="sqb-form" style={{ marginTop: 10 }}>
            <input type="hidden" name="siteId" value={site.siteId} />
            <div className="sqb-row">
              <label>
                Güneş saati (boş bırak = gözlem yok)
                <input
                  type="number"
                  name="sunHoursObserved"
                  min={0}
                  max={24}
                  step="any"
                  defaultValue={profile.sunHoursObserved ?? ""}
                />
              </label>
            </div>
            <label className="sqb-check">
              <input type="checkbox" name="exactLocationKnown" defaultChecked={profile.exactLocationKnown} />
              <span>Tam konumu biliyorum</span>
            </label>
            <div>
              <button type="submit" className="btn btn-secondary btn-sm" disabled={obsPending}>
                {obsPending ? "Güncelleniyor…" : "Güncelle"}
              </button>
            </div>
            <FormResult state={obsState} />
          </form>
        </details>
      </div>
    </div>
  );
}
