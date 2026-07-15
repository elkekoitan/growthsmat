"use client";
// SmartGrowth OS — /bahcem: kullanıcının takip ettiği ürünler.
// TASARIM İLKESİ: her kartta TEK belirgin sonraki adım. Açıklama paragrafı, numaralı bölüm
// ve hero pitch YOK — kullanıcı ne yapacağını okumadan görmeli.
import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { CROP_BY_ID } from "@/data/crops";
import { cropPhotoPath } from "@/data/photoCredits";
import { ArrowRight, Check, X } from "@/components/icons";
import type { TrackedCrop, TrackedCropStatus } from "@/server/repositories/trackedCrops";
import { generateTasksForCropAction, removeFromGardenAction, setStatusAction } from "./actions";

const STATUS_META: Record<TrackedCropStatus, { label: string; cls: string }> = {
  planlaniyor: { label: "Planlanıyor", cls: "chip" },
  ekildi: { label: "Ekildi", cls: "chip chip-info" },
  buyuyor: { label: "Büyüyor", cls: "chip chip-ok" },
  hasat: { label: "Hasada hazır", cls: "chip chip-warn" },
  arsiv: { label: "Arşiv", cls: "chip" },
};

// Kullanıcının elle seçebileceği durumlar (arşiv dahil değil — "kaldır" o işi görüyor).
const SELECTABLE: TrackedCropStatus[] = ["planlaniyor", "ekildi", "buyuyor", "hasat"];

function cropName(cropId: string): string {
  return CROP_BY_ID[cropId]?.name ?? cropId;
}

/** Gerçek listeden türetilen tek cümlelik yönlendirme — uydurma yok. */
function nextStepLine(crops: TrackedCrop[], todayOpenTaskCount: number): string {
  const harvest = crops.find((c) => c.status === "hasat");
  if (harvest) return `${cropName(harvest.cropId)} hasada hazır — satışa çıkar.`;

  const planning = crops.find((c) => !c.tasksGenerated);
  if (planning) return `${cropName(planning.cropId)} için görev takvimi oluştur.`;

  if (todayOpenTaskCount > 0) return `Bugün ${todayOpenTaskCount} işin var.`;
  return "Bugün açık işin yok.";
}

export function Garden({
  trackedCrops,
  todayOpenTaskCount,
}: {
  trackedCrops: TrackedCrop[];
  todayOpenTaskCount: number;
}) {
  const active = useMemo(() => trackedCrops.filter((c) => c.status !== "arsiv"), [trackedCrops]);
  const line = useMemo(() => nextStepLine(active, todayOpenTaskCount), [active, todayOpenTaskCount]);

  return (
    <section className="section">
      <div className="container-x" style={{ paddingBlock: "clamp(2rem, 4vw, 3rem) clamp(3rem, 6vw, 5rem)", maxWidth: 860 }}>
        {/* Kompakt başlık */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <span className="eyebrow">Bahçem</span>
            <p style={{ margin: "10px 0 0", fontSize: "var(--fs-lg)", fontWeight: 600 }}>
              {active.length > 0 ? `Bahçende ${active.length} ürün var.` : "Bahçen henüz boş."}
            </p>
          </div>
          {active.length > 0 && (
            <Link href="/urunler" className="btn btn-secondary btn-sm">
              + Ürün ekle
            </Link>
          )}
        </div>

        {active.length === 0 ? (
          <div
            style={{
              marginTop: 24,
              padding: "40px 20px",
              textAlign: "center",
              border: "1px dashed var(--border-soft)",
              borderRadius: "var(--radius-card)",
              background: "var(--bg-surface)",
            }}
          >
            <Link href="/urunler" className="btn btn-primary">
              Ürün Kâşifi&apos;nden ürün seç <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <p style={{ margin: "18px 0 20px", color: "var(--text-mid)" }}>
              <strong style={{ color: "var(--text-hi)" }}>Sıradaki adımın:</strong> {line}
            </p>
            <div style={{ display: "grid", gap: 10 }}>
              {active.map((c) => (
                <GardenCard key={c.id} tracked={c} />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .garden-card {
          display: flex; align-items: center; gap: 14px;
          padding: 12px 14px; border-radius: var(--radius-card);
          background: var(--bg-surface); border: 1px solid var(--border-hair);
        }
        .garden-thumb {
          position: relative; width: 56px; height: 56px; flex-shrink: 0;
          border-radius: 12px; overflow: hidden; background: var(--bg-inset);
          display: grid; place-items: center; font-size: 24px;
        }
        .garden-quiet { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .garden-quiet select {
          height: 30px; padding: 0 6px; border-radius: 8px; font-size: var(--fs-xs);
          border: 1px solid var(--border-hair); background: transparent; color: var(--text-low);
        }
        .garden-x {
          width: 30px; height: 30px; display: grid; place-items: center;
          border: none; background: transparent; color: var(--text-low);
          border-radius: 8px; cursor: pointer;
        }
        .garden-x:hover { color: var(--color-danger); background: var(--bg-inset); }
        @media (max-width: 640px) {
          .garden-card { flex-wrap: wrap; }
          .garden-action { width: 100%; }
        }
      `}</style>
    </section>
  );
}

function GardenCard({ tracked }: { tracked: TrackedCrop }) {
  const [pending, startTransition] = useTransition();
  const [created, setCreated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const crop = CROP_BY_ID[tracked.cropId];
  const photo = cropPhotoPath(tracked.cropId);
  const meta = STATUS_META[tracked.status];
  const metaLine = tracked.plantedAt ? `${tracked.zone} · ${tracked.plantedAt}` : tracked.zone;

  const onGenerate = () =>
    startTransition(async () => {
      setError(null);
      const res = await generateTasksForCropAction(tracked.id);
      if (res.error) setError(res.error);
      else setCreated(res.created);
    });

  const onStatus = (status: string) =>
    startTransition(async () => {
      setError(null);
      const res = await setStatusAction(tracked.id, status);
      if (!res.applied) setError(res.reason ?? "Durum değiştirilemedi.");
    });

  const onRemove = () =>
    startTransition(async () => {
      setError(null);
      const res = await removeFromGardenAction(tracked.id);
      if (!res.applied) setError(res.reason ?? "Kaldırılamadı.");
    });

  return (
    <div className="garden-card">
      <span className="garden-thumb">
        {photo ? (
          <Image src={photo} alt="" fill sizes="56px" style={{ objectFit: "cover" }} />
        ) : (
          <span aria-hidden>{crop?.emoji ?? "🌱"}</span>
        )}
      </span>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
            {cropName(tracked.cropId)}
          </h2>
          <span className={meta.cls}>{meta.label}</span>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: "var(--text-low)", marginTop: 4 }}>
          {metaLine}
        </div>
        {created !== null && (
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span className="chip chip-ok">
              <Check size={12} /> {created} görev eklendi
            </span>
            <Link href="/gorevler" style={{ fontSize: "var(--fs-xs)", color: "var(--primary)" }}>
              Görevlere git →
            </Link>
          </div>
        )}
        {error && (
          <span className="chip chip-danger" style={{ marginTop: 6 }}>
            <X size={12} /> {error}
          </span>
        )}
      </div>

      {/* TEK birincil eylem — duruma göre.
          Takvim koşulu status'e DEĞİL tasksGenerated'a bakar: kullanıcı durumu elle "Ekildi"ye
          çevirirse buton kaybolup kart "Bugünkü işleri gör"e düşüyordu — ama o ürün için hiç
          görev yoktu (yeni çıkmaz). Hasat hariç: hasattaki ürünün sıradaki adımı satmak. */}
      <div className="garden-action">
        {tracked.status === "hasat" ? (
          <Link href={`/pazar?cropId=${tracked.cropId}#vitrinim-grid`} className="btn btn-primary btn-sm">
            Hasadı sat <ArrowRight size={15} />
          </Link>
        ) : !tracked.tasksGenerated ? (
          <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={onGenerate}>
            {pending ? "Oluşturuluyor…" : "Görev takvimi oluştur"}
          </button>
        ) : (
          <Link href="/gorevler" className="btn btn-primary btn-sm">
            Bugünkü işleri gör <ArrowRight size={15} />
          </Link>
        )}
      </div>

      {/* Sessiz ikincil eylemler — birincil butonu gölgelemesin */}
      <div className="garden-quiet">
        <select
          value={tracked.status}
          disabled={pending}
          onChange={(e) => onStatus(e.target.value)}
          aria-label={`${cropName(tracked.cropId)} durumunu değiştir`}
        >
          {SELECTABLE.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="garden-x"
          disabled={pending}
          onClick={onRemove}
          aria-label={`${cropName(tracked.cropId)} ürününü bahçemden kaldır`}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
