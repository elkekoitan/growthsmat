"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, FormEvent } from "react";
import { CROPS, CROP_BY_ID } from "@/data/crops";
import { RadialGauge, BotanicalScene } from "@/components/graphics";
import {
  Sprout,
  Droplet,
  Leaf,
  Beaker,
  Package,
  Sparkles,
  Check,
  X,
  Calendar,
  Clipboard,
  Wifi,
  MapPin,
  ArrowRight,
} from "@/components/icons";

/* ============================================================================
   /gorevler — Görev ve saha günlüğü ("bakım ritüeli" estetiği)
   Görev tip modeli burada tanımlıdır (schema src/data'ya YAZILMAZ).
   Durum: localStorage 'sg-tasks'. İlk açılışta seed görevleri.
   ============================================================================ */

const STORAGE_KEY = "sg-tasks";

type TaskType = "ekim" | "sulama" | "gubreleme" | "budama" | "gozlem" | "hasat";

interface Task {
  id: string;
  type: TaskType;
  title: string;
  cropId: string; // @/data/crops id — göreve bitki bağlar
  zone: string; // saha bölgesi (balkon/yatak/sıra)
  date: string; // yyyy-mm-dd (yerel) — planlanan gün
  done: boolean;
  critical?: boolean; // kritik / hava-hassas görev
  note?: string; // saha günlüğü notu (tamamlananlarda)
  measurement?: string; // ölçüm kaydı (mock)
  offline?: boolean; // çevrimdışı kaydedildi, senkron bekliyor
}

type IconType = ComponentType<{ size?: number }>;

const TYPE_META: Record<
  TaskType,
  { label: string; verb: string; icon: IconType; color: string }
> = {
  ekim: { label: "Ekim", verb: "Fideyi dik", icon: Sprout, color: "var(--primary)" },
  sulama: { label: "Sulama", verb: "Derin sula", icon: Droplet, color: "var(--color-info)" },
  gubreleme: { label: "Gübreleme", verb: "Organik besle", icon: Sparkles, color: "var(--accent)" },
  budama: { label: "Budama", verb: "Uç al, koltuk temizle", icon: Leaf, color: "var(--color-success)" },
  gozlem: { label: "Gözlem", verb: "Zararlı ve nem kontrolü", icon: Beaker, color: "var(--color-info)" },
  hasat: { label: "Hasat", verb: "Hasat penceresi", icon: Package, color: "var(--accent)" },
};

const TYPE_ORDER: TaskType[] = ["ekim", "sulama", "gubreleme", "budama", "gozlem", "hasat"];

/* ---------- tarih yardımcıları (yerel gün) ---------- */
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, n: number) {
  const x = startOfDay(d);
  x.setDate(x.getDate() + n);
  return x;
}
function isoDay(d: Date) {
  const x = startOfDay(d);
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${x.getFullYear()}-${m}-${day}`;
}
function fromIso(iso: string) {
  return new Date(`${iso}T00:00:00`);
}
function dayDiff(iso: string, todayIso: string) {
  return Math.round((fromIso(iso).getTime() - fromIso(todayIso).getTime()) / 86400000);
}
function weekdayShort(iso: string) {
  return fromIso(iso).toLocaleDateString("tr-TR", { weekday: "short" }).replace(".", "");
}
function longDate(iso: string) {
  return fromIso(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" });
}

/* ---------- seed görevleri (bugüne göreli) ---------- */
function seedTasks(): Task[] {
  const t = startOfDay(new Date());
  const d = (n: number) => isoDay(addDays(t, n));
  return [
    { id: "seed-01", type: "sulama", title: "Sabah suyu kaçtı", cropId: "feslegen", zone: "Mutfak pervazı", date: d(-1), done: false },
    { id: "seed-02", type: "sulama", title: "Sıcak dalgasında kök nemi", cropId: "salatalik", zone: "Sera tüneli", date: d(0), done: false, critical: true },
    { id: "seed-03", type: "budama", title: "Koltuk al ve bağla", cropId: "sirik-domates-beefsteak", zone: "Yatak A2", date: d(0), done: false },
    { id: "seed-04", type: "gozlem", title: "Lahana kelebeği taraması", cropId: "lahana-brokoli", zone: "Yatak B1", date: d(0), done: false },
    {
      id: "seed-05",
      type: "hasat",
      title: "İlk kes-gelsin turu",
      cropId: "roka",
      zone: "Yükseltilmiş yatak",
      date: d(0),
      done: true,
      measurement: "318 g",
      offline: true,
      note: "İlk kesim 318 g. Göbek bırakıldı; 10-12 gün sonra ikinci tur beklenir.",
    },
    {
      id: "seed-06",
      type: "gozlem",
      title: "Seyreltme ve aralık ölçümü",
      cropId: "havuc",
      zone: "Saksı sırası 3",
      date: d(0),
      done: true,
      measurement: "6 cm aralık",
      note: "Fideler seyreltildi, sıra üzeri 6 cm bırakıldı. Toprak taşsız.",
    },
    { id: "seed-07", type: "ekim", title: "İkinci parti tohum", cropId: "turp-bahce", zone: "Saksı sırası 3", date: d(1), done: false },
    { id: "seed-08", type: "gubreleme", title: "Çiçek sonrası besleme", cropId: "cilek", zone: "Dikey saksı kulesi", date: d(1), done: false, critical: true },
    { id: "seed-09", type: "hasat", title: "Dış yapraklardan hasat", cropId: "marul", zone: "Balkon — Kuzey", date: d(2), done: false },
    { id: "seed-10", type: "sulama", title: "Rizom saksısını kontrol et", cropId: "nane", zone: "Saksı (sınırlı)", date: d(3), done: false },
    { id: "seed-11", type: "budama", title: "Uç alma ile çalılaştır", cropId: "feslegen", zone: "Mutfak pervazı", date: d(4), done: false },
    { id: "seed-12", type: "gubreleme", title: "Sıvı besleme turu", cropId: "biber-carliston", zone: "Balkon — Güney", date: d(6), done: false },
    { id: "seed-13", type: "ekim", title: "Sırık fasulye çıkımı", cropId: "fasulye-sirik", zone: "Sırık hattı", date: d(8), done: false },
    { id: "seed-14", type: "hasat", title: "Şeker bezelye ilk toplama", cropId: "bezelye", zone: "Yatak C", date: d(9), done: false },
  ];
}

/* ---------- durum tayini ---------- */
type Status = "done" | "overdue" | "critical" | "pending";
function statusOf(t: Task, diff: number): Status {
  if (t.done) return "done";
  if (diff < 0) return "overdue";
  if (t.critical) return "critical";
  return "pending";
}

interface EnrichedTask extends Task {
  diff: number;
  status: Status;
}

const DAY_OPTIONS: { off: number; label: string }[] = [
  { off: 0, label: "Bugün" },
  { off: 1, label: "Yarın" },
  { off: 2, label: "2 gün sonra" },
  { off: 3, label: "3 gün sonra" },
  { off: 6, label: "Bu hafta içinde" },
  { off: 9, label: "Gelecek hafta" },
];

export function Tasks() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<string | null>(null);
  const [openLog, setOpenLog] = useState<Record<string, boolean>>({});
  const [announce, setAnnounce] = useState("");

  // form
  const [formOpen, setFormOpen] = useState(false);
  const [fType, setFType] = useState<TaskType>("sulama");
  const [fCrop, setFCrop] = useState<string>(CROPS[0].id);
  const [fDay, setFDay] = useState<number>(0);
  const [fZone, setFZone] = useState("");
  const [fTitle, setFTitle] = useState("");
  const formRef = useRef<HTMLDivElement>(null);

  /* hydrate + seed */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        setTasks(Array.isArray(parsed) && parsed.length ? parsed : seedTasks());
      } else {
        const s = seedTasks();
        setTasks(s);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      }
    } catch {
      setTasks(seedTasks());
    }
    setHydrated(true);
  }, []);

  /* persist */
  useEffect(() => {
    if (!hydrated || !tasks) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* sessiz */
    }
  }, [tasks, hydrated]);

  const todayIso = isoDay(startOfDay(new Date()));

  const enriched: EnrichedTask[] = useMemo(() => {
    if (!tasks) return [];
    return tasks
      .map((t) => {
        const diff = dayDiff(t.date, todayIso);
        return { ...t, diff, status: statusOf(t, diff) };
      })
      .sort((a, b) => {
        // tamamlanan en sona, sonra güne, sonra kritik/gecikmiş öne
        if (a.done !== b.done) return a.done ? 1 : -1;
        if (a.diff !== b.diff) return a.diff - b.diff;
        return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type);
      });
  }, [tasks, todayIso]);

  /* KPI */
  const kpi = useMemo(() => {
    const todayAll = enriched.filter((t) => t.diff === 0);
    const todayDone = todayAll.filter((t) => t.done).length;
    const overdue = enriched.filter((t) => t.status === "overdue").length;
    const weekDone = enriched.filter((t) => t.done && t.diff <= 0 && t.diff >= -6).length;
    const todayPending = todayAll.length - todayDone;
    const ritualPct = todayAll.length ? Math.round((todayDone / todayAll.length) * 100) : 0;
    return { todayAll: todayAll.length, todayDone, todayPending, overdue, weekDone, ritualPct };
  }, [enriched]);

  /* haftalık şerit (bugün..+6) */
  const week = useMemo(() => {
    const base = startOfDay(new Date());
    const days = Array.from({ length: 7 }, (_, i) => isoDay(addDays(base, i)));
    const cells = days.map((iso) => {
      const dayTasks = enriched.filter((t) => t.date === iso);
      const pending = dayTasks.filter((t) => !t.done).length;
      const crit = dayTasks.some((t) => t.critical && !t.done);
      return { iso, total: dayTasks.length, pending, crit };
    });
    const max = Math.max(1, ...cells.map((c) => c.total));
    return { cells, max };
  }, [enriched]);

  /* gruplama */
  const groups = useMemo(() => {
    const bugun: EnrichedTask[] = [];
    const yarin: EnrichedTask[] = [];
    const buHafta: EnrichedTask[] = [];
    const sonra: EnrichedTask[] = [];
    for (const t of enriched) {
      if (t.diff < 0 && t.done) continue; // geçmiş tamamlananlar geçmişte kalsın
      if (t.diff <= 0) bugun.push(t);
      else if (t.diff === 1) yarin.push(t);
      else if (t.diff <= 6) buHafta.push(t);
      else sonra.push(t);
    }
    return [
      { key: "bugun", label: "Bugün", hint: "günün ritüeli", items: bugun },
      { key: "yarin", label: "Yarın", hint: "hazırlığı bugünden", items: yarin },
      { key: "buhafta", label: "Bu hafta", hint: "önümüzdeki 7 gün", items: buHafta },
      { key: "sonra", label: "Sonra", hint: "ufuktaki işler", items: sonra },
    ].filter((g) => g.items.length > 0);
  }, [enriched]);

  const dayView = useMemo(() => {
    if (!selectedDay) return null;
    return enriched.filter((t) => t.date === selectedDay);
  }, [selectedDay, enriched]);

  /* handlers */
  function toggleDone(id: string) {
    const current = tasks?.find((x) => x.id === id);
    setTasks((prev) => (prev ? prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) : prev));
    if (current && !current.done) {
      setJustDone(id);
      setAnnounce(`${current.title} tamamlandı ve saha günlüğüne işlendi.`);
      window.setTimeout(() => setJustDone((cur) => (cur === id ? null : cur)), 560);
    }
  }

  function removeTask(id: string) {
    setTasks((prev) => (prev ? prev.filter((t) => t.id !== id) : prev));
  }

  function addTask(e: FormEvent) {
    e.preventDefault();
    const base = startOfDay(new Date());
    const title = fTitle.trim() || TYPE_META[fType].verb;
    const next: Task = {
      id: `t-${Date.now().toString(36)}`,
      type: fType,
      title,
      cropId: fCrop,
      zone: fZone.trim() || "Belirtilmedi",
      date: isoDay(addDays(base, fDay)),
      done: false,
    };
    setTasks((prev) => (prev ? [...prev, next] : [next]));
    setAnnounce(`${title} görevi eklendi.`);
    setFTitle("");
    setFZone("");
  }

  function openFormFocus() {
    setFormOpen(true);
    window.setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  }

  const totalActive = enriched.filter((t) => !(t.diff < 0 && t.done)).length;

  return (
    <div className="mesh-light grain" style={{ position: "relative", overflow: "hidden" }}>
      {/* dekor blob */}
      <div className="blob" style={{ width: 380, height: 380, background: "var(--color-forest-300)", top: -120, right: -80, opacity: 0.28 }} aria-hidden="true" />

      <section className="container-x" style={{ position: "relative", zIndex: 1, paddingBlock: "clamp(2.5rem, 6vw, 4.5rem) 1.5rem" }}>
        {/* --- Başlık --- */}
        <header style={{ maxWidth: 720 }}>
          <span className="eyebrow reveal">Saha ritüeli</span>
          <h1 className="reveal text-balance" style={{ marginTop: 16, fontSize: "var(--fs-h1)" }}>
            Görev ve saha günlüğü
          </h1>
          <p className="reveal text-pretty" style={{ marginTop: 14, fontSize: "var(--fs-lead)", color: "var(--text-mid)", maxWidth: 620 }}>
            Bahçe bir defter gibi tutulur. Bugünün küçük ritüellerini işaretle; her tamamlanan
            satır, bir sonraki hasadın kanıtı olsun. Kayıtlar çevrimdışı da tutulur, ağ gelince
            senkronlanır.
          </p>
        </header>

        {!hydrated || !tasks ? (
          <Skeleton />
        ) : (
          <>
            {/* --- Ritüel + KPI --- */}
            <div className="ritual-head" style={{ marginTop: 34 }}>
              <div className="card" style={{ padding: "20px 22px", display: "flex", alignItems: "center", gap: 20 }}>
                <RadialGauge
                  value={kpi.ritualPct}
                  size={116}
                  label={`${kpi.todayDone}/${kpi.todayAll}`}
                  sub="bugün"
                  color={kpi.overdue > 0 ? "var(--accent)" : "var(--primary)"}
                />
                <div>
                  <div style={{ fontSize: "var(--fs-xs)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-low)", fontWeight: 700 }}>
                    Bugünün ritüeli
                  </div>
                  <div style={{ fontSize: "var(--fs-lg)", fontWeight: 600, marginTop: 6, lineHeight: 1.35, color: "var(--text-hi)" }}>
                    {kpi.todayAll === 0
                      ? "Bugüne planlanmış iş yok — nefes al."
                      : kpi.todayPending === 0
                        ? "Bugünün defteri kapandı. Tertemiz."
                        : `${kpi.todayPending} satır seni bekliyor.`}
                  </div>
                </div>
              </div>

              <div className="stat-grid">
                <StatChip icon={Clipboard} tone="neutral" value={kpi.todayPending} label="bugün bekleyen" />
                <StatChip icon={Calendar} tone={kpi.overdue > 0 ? "danger" : "neutral"} value={kpi.overdue} label="gecikmiş görev" />
                <StatChip icon={Check} tone="ok" value={kpi.weekDone} label="bu hafta tamamlanan" />
              </div>
            </div>

            {/* --- Haftalık takvim şeridi --- */}
            <div className="card week-strip" style={{ marginTop: 18, padding: "16px 14px 12px" }} role="group" aria-label="Haftalık görev şeridi">
              {week.cells.map((c) => {
                const isToday = c.iso === todayIso;
                const isSel = selectedDay === c.iso;
                const barH = c.total === 0 ? 4 : 8 + Math.round((c.total / week.max) * 34);
                return (
                  <button
                    key={c.iso}
                    type="button"
                    onClick={() => setSelectedDay((cur) => (cur === c.iso ? null : c.iso))}
                    className={`week-cell${isSel ? " is-sel" : ""}${isToday ? " is-today" : ""}`}
                    aria-pressed={isSel}
                    aria-label={`${longDate(c.iso)} — ${c.total} görev${c.crit ? ", kritik var" : ""}`}
                  >
                    <span className="week-dow">{isToday ? "Bugün" : weekdayShort(c.iso)}</span>
                    <span className="week-dom font-mono">{fromIso(c.iso).getDate()}</span>
                    <span className="week-track" aria-hidden="true">
                      <span
                        className="week-bar"
                        style={{
                          height: barH,
                          background: c.total === 0 ? "var(--border-soft)" : c.crit ? "var(--accent)" : "color-mix(in srgb, var(--primary) 55%, transparent)",
                        }}
                      />
                    </span>
                    <span className="week-count font-mono" aria-hidden="true">
                      {c.total > 0 ? c.total : "·"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* --- Araç çubuğu --- */}
            <div className="toolbar">
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span className="chip" aria-hidden="true">
                  <Sprout size={13} /> {totalActive} aktif satır
                </span>
                {selectedDay && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedDay(null)}>
                    <X size={15} /> Tüm haftaya dön
                  </button>
                )}
              </div>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => (formOpen ? setFormOpen(false) : openFormFocus())}
                aria-expanded={formOpen}
              >
                {formOpen ? <X size={16} /> : <Sparkles size={16} />}
                {formOpen ? "Formu kapat" : "Yeni görev"}
              </button>
            </div>

            {/* --- Yeni görev formu --- */}
            {formOpen && (
              <div ref={formRef} className="card newform" style={{ padding: "20px 22px", marginTop: 4 }}>
                <form onSubmit={addTask}>
                  <div className="form-grid">
                    <label className="field">
                      <span className="field-label">Görev tipi</span>
                      <select value={fType} onChange={(e) => setFType(e.target.value as TaskType)} className="control">
                        {TYPE_ORDER.map((tp) => (
                          <option key={tp} value={tp}>
                            {TYPE_META[tp].label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">Bitki</span>
                      <select value={fCrop} onChange={(e) => setFCrop(e.target.value)} className="control">
                        {CROPS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.emoji} {c.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">Ne zaman</span>
                      <select value={fDay} onChange={(e) => setFDay(Number(e.target.value))} className="control">
                        {DAY_OPTIONS.map((d) => (
                          <option key={d.off} value={d.off}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="field">
                      <span className="field-label">Bölge</span>
                      <input
                        value={fZone}
                        onChange={(e) => setFZone(e.target.value)}
                        placeholder="Balkon — Güney"
                        className="control"
                      />
                    </label>

                    <label className="field field-wide">
                      <span className="field-label">
                        Başlık <span style={{ color: "var(--text-low)", fontWeight: 400 }}>· boş bırakırsan “{TYPE_META[fType].verb}” yazılır</span>
                      </span>
                      <input
                        value={fTitle}
                        onChange={(e) => setFTitle(e.target.value)}
                        placeholder={TYPE_META[fType].verb}
                        className="control"
                      />
                    </label>
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFormOpen(false)}>
                      Vazgeç
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Check size={16} /> Deftere ekle
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* --- Duyuru (a11y) --- */}
            <p aria-live="polite" className={`live-note${announce ? " show" : ""}`}>
              {announce}
            </p>

            {/* --- Liste --- */}
            {totalActive === 0 ? (
              <EmptyState onAdd={openFormFocus} />
            ) : selectedDay ? (
              <section style={{ marginTop: 10 }}>
                <GroupHeader label={longDate(selectedDay)} hint={`${dayView?.length ?? 0} görev`} />
                <ul className="task-list">
                  {(dayView ?? []).map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      justDone={justDone === t.id}
                      logOpen={!!openLog[t.id]}
                      onToggle={toggleDone}
                      onRemove={removeTask}
                      onToggleLog={() => setOpenLog((o) => ({ ...o, [t.id]: !o[t.id] }))}
                    />
                  ))}
                </ul>
              </section>
            ) : (
              groups.map((g) => (
                <section key={g.key} style={{ marginTop: 10 }}>
                  <GroupHeader label={g.label} hint={g.hint} count={g.items.length} />
                  <ul className="task-list">
                    {g.items.map((t) => (
                      <TaskRow
                        key={t.id}
                        task={t}
                        justDone={justDone === t.id}
                        logOpen={!!openLog[t.id]}
                        onToggle={toggleDone}
                        onRemove={removeTask}
                        onToggleLog={() => setOpenLog((o) => ({ ...o, [t.id]: !o[t.id] }))}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}
          </>
        )}
      </section>

      <StyleBlock />
    </div>
  );
}

/* ============================================================================
   Alt bileşenler
   ============================================================================ */

function StatChip({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: IconType;
  value: number;
  label: string;
  tone: "neutral" | "ok" | "danger";
}) {
  const color =
    tone === "danger" ? "var(--color-danger)" : tone === "ok" ? "var(--color-success)" : "var(--primary)";
  return (
    <div className="card stat-chip" style={{ padding: "14px 16px" }}>
      <span className="stat-ic" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
        <Icon size={16} />
      </span>
      <div>
        <div className="font-mono tnum" style={{ fontSize: "1.65rem", fontWeight: 600, lineHeight: 1, color: "var(--text-hi)" }}>
          {value}
        </div>
        <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 4, letterSpacing: "0.02em" }}>{label}</div>
      </div>
    </div>
  );
}

function GroupHeader({ label, hint, count }: { label: string; hint?: string; count?: number }) {
  return (
    <div className="group-head">
      <h2 style={{ fontSize: "var(--fs-h3)", margin: 0, display: "flex", alignItems: "baseline", gap: 10 }}>
        {label}
        {typeof count === "number" && (
          <span className="font-mono" style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)", fontWeight: 500 }}>
            {count}
          </span>
        )}
      </h2>
      {hint && <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>{hint}</span>}
      <span className="group-rule" aria-hidden="true" />
    </div>
  );
}

function StatusPill({ status, type }: { status: Status; type: TaskType }) {
  const Ico = TYPE_META[type].icon;
  if (status === "done") {
    return (
      <span className="st st-done">
        <Check size={13} /> Tamamlandı
      </span>
    );
  }
  if (status === "overdue") {
    return (
      <span className="chip chip-danger st-strong">
        <span className="st-dot" aria-hidden="true" /> Gecikmiş
      </span>
    );
  }
  if (status === "critical") {
    return (
      <span className="chip chip-warn st-strong">
        <span className="st-diamond" aria-hidden="true" /> Kritik
      </span>
    );
  }
  // pending — tint + tip ikonu
  return (
    <span className="st st-pending" style={{ color: TYPE_META[type].color, background: `color-mix(in srgb, ${TYPE_META[type].color} 12%, transparent)` }}>
      <Ico size={13} /> Bekliyor
    </span>
  );
}

function TaskRow({
  task,
  justDone,
  logOpen,
  onToggle,
  onRemove,
  onToggleLog,
}: {
  task: EnrichedTask;
  justDone: boolean;
  logOpen: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleLog: () => void;
}) {
  const crop = CROP_BY_ID[task.cropId];
  const meta = TYPE_META[task.type];
  const Ico = meta.icon;
  const hasLog = !!(task.done && (task.note || task.measurement || task.offline));

  return (
    <li className={`task-row${task.done ? " is-done" : ""}${justDone ? " pop" : ""}${task.status === "overdue" ? " is-overdue" : ""}`}>
      <div className="task-main">
        {/* checkbox */}
        <label className="tcheck" title={task.done ? "Geri al" : "Tamamlandı işaretle"}>
          <input
            type="checkbox"
            checked={task.done}
            onChange={() => onToggle(task.id)}
            aria-label={`${task.title} · ${crop?.name ?? ""} görevini ${task.done ? "geri al" : "tamamla"}`}
          />
          <span className="tcheck-box" aria-hidden="true">
            <Check size={13} />
          </span>
        </label>

        {/* bitki simgesi */}
        <span className="crop-emoji" aria-hidden="true">
          {crop?.emoji ?? "🌱"}
        </span>

        {/* tip ikonu */}
        <span className="type-ic" style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 13%, transparent)` }} aria-hidden="true">
          <Ico size={16} />
        </span>

        {/* başlık + meta */}
        <div className="task-text">
          <div className="task-title">{task.title}</div>
          <div className="task-sub">
            <span style={{ fontWeight: 600, color: "var(--text-mid)" }}>{crop?.name ?? "Bitki"}</span>
            <span className="dotsep">·</span>
            <span className="task-zone">
              <MapPin size={12} /> {task.zone}
            </span>
            <span className="dotsep">·</span>
            <span style={{ color: "var(--text-low)" }}>{meta.label}</span>
          </div>
        </div>

        {/* durum + aksiyonlar */}
        <div className="task-right">
          <StatusPill status={task.status} type={task.type} />
          {hasLog && (
            <button type="button" className="log-toggle" onClick={onToggleLog} aria-expanded={logOpen} aria-label="Saha günlüğünü aç/kapat">
              <Clipboard size={15} />
            </button>
          )}
          <button type="button" className="row-del" onClick={() => onRemove(task.id)} aria-label={`${task.title} görevini sil`}>
            <X size={15} />
          </button>
        </div>
      </div>

      {/* saha günlüğü */}
      {hasLog && logOpen && (
        <div className="fieldlog">
          <div className="fieldlog-head">
            <Clipboard size={14} />
            <span>Saha günlüğü</span>
            {task.offline && (
              <span className="chip offline-chip" title="Bağlantı gelince otomatik senkronlanır">
                <Wifi size={13} /> Çevrimdışı kaydedildi · senkron bekliyor
              </span>
            )}
          </div>
          {task.note && <p className="fieldlog-note">{task.note}</p>}
          <div className="fieldlog-actions">
            {task.measurement && (
              <span className="chip">
                <Beaker size={13} /> {task.measurement}
              </span>
            )}
            <button type="button" className="btn btn-secondary btn-sm" disabled title="Yakında">
              Fotoğraf ekle
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled title="Yakında">
              <Beaker size={14} /> Ölçüm gir
            </button>
            <button type="button" className="btn btn-secondary btn-sm" disabled title="Yakında">
              Ses notu
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="card empty" style={{ marginTop: 18, padding: "48px 24px" }}>
      <div style={{ color: "var(--color-forest-400)", width: 120, height: 120 }}>
        <BotanicalScene style={{ width: "100%", height: "100%" }} />
      </div>
      <h2 style={{ fontSize: "var(--fs-h3)", margin: "14px 0 6px" }}>Defter tertemiz</h2>
      <p style={{ color: "var(--text-mid)", maxWidth: 380, margin: "0 auto 20px" }}>
        Ne ekeceğini, neyi sulayacağını buraya yaz. İlk satır her zaman en tatlısıdır —
        gerisi ritüele bağlanır.
      </p>
      <button type="button" className="btn btn-primary" onClick={onAdd}>
        <Sprout size={18} /> İlk görevini ekle <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ marginTop: 34, display: "grid", gap: 12 }} aria-hidden="true">
      <div className="sk" style={{ height: 116, borderRadius: "var(--radius-card)" }} />
      <div className="sk" style={{ height: 78, borderRadius: "var(--radius-card)" }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="sk" style={{ height: 66, borderRadius: "var(--radius-card)" }} />
      ))}
    </div>
  );
}

/* ============================================================================
   Sayfa-özel stiller (global CSS eklenmez)
   ============================================================================ */
function StyleBlock() {
  return (
    <style>{`
      .ritual-head { display: grid; grid-template-columns: 1.15fr 1.85fr; gap: 14px; align-items: stretch; }
      .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
      .stat-chip { display: flex; align-items: center; gap: 14px; }
      .stat-ic { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; flex: none; }

      .week-strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
      .week-cell {
        display: flex; flex-direction: column; align-items: center; gap: 4px;
        padding: 10px 4px 8px; border-radius: 12px; background: transparent;
        border: 1px solid transparent; cursor: pointer;
        transition: background var(--dur-fast) ease, border-color var(--dur-fast) ease, transform var(--dur-instant) var(--ease-out);
      }
      .week-cell:hover { background: var(--bg-surface-2); transform: translateY(-1px); }
      .week-cell.is-sel { background: color-mix(in srgb, var(--primary) 10%, transparent); border-color: color-mix(in srgb, var(--primary) 35%, transparent); }
      .week-cell.is-today { position: relative; }
      .week-cell.is-today::after { content: ""; position: absolute; left: 20%; right: 20%; bottom: 2px; height: 2px; border-radius: 2px; background: var(--accent); }
      .week-dow { font-size: var(--fs-xs); color: var(--text-low); font-weight: 600; text-transform: capitalize; }
      .week-cell.is-today .week-dow { color: var(--primary); }
      .week-dom { font-size: var(--fs-md); font-weight: 600; color: var(--text-hi); line-height: 1; }
      .week-track { display: flex; align-items: flex-end; height: 42px; margin-top: 2px; }
      .week-bar { width: 12px; border-radius: 6px; transition: height var(--dur-slow) var(--ease-out); }
      .week-count { font-size: 11px; color: var(--text-low); }

      .toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 24px; margin-bottom: 12px; }

      .form-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .field { display: flex; flex-direction: column; gap: 6px; }
      .field-wide { grid-column: span 4; }
      .field-label { font-size: var(--fs-xs); font-weight: 600; color: var(--text-mid); letter-spacing: 0.01em; }
      .control {
        height: 42px; padding: 0 12px; border-radius: var(--radius-control);
        background: var(--bg-surface); border: 1px solid var(--border-soft); color: var(--text-hi);
        font-size: var(--fs-base); font-family: var(--font-sans); width: 100%;
        transition: border-color var(--dur-fast) ease, box-shadow var(--dur-fast) ease;
      }
      .control:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring) 18%, transparent); }
      select.control { appearance: none; -webkit-appearance: none; cursor: pointer;
        background-image: linear-gradient(45deg, transparent 50%, var(--text-low) 50%), linear-gradient(135deg, var(--text-low) 50%, transparent 50%);
        background-position: calc(100% - 16px) 18px, calc(100% - 11px) 18px; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; padding-right: 30px; }

      .live-note { min-height: 0; margin: 6px 2px 0; font-size: var(--fs-sm); color: var(--color-success); opacity: 0; transition: opacity var(--dur-base) ease; }
      .live-note.show { opacity: 1; }

      .group-head { display: flex; align-items: baseline; gap: 12px; margin: 22px 0 12px; }
      .group-rule { flex: 1; height: 1px; background: var(--border-hair); align-self: center; }

      .task-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
      .task-row {
        border: 1px solid var(--border-hair); border-radius: var(--radius-card); background: var(--bg-surface);
        box-shadow: var(--shadow-sm); overflow: hidden;
        transition: border-color var(--dur-base) ease, box-shadow var(--dur-base) ease, opacity var(--dur-base) ease, transform var(--dur-instant) var(--ease-out);
      }
      .task-row:hover { border-color: var(--color-forest-300); box-shadow: var(--shadow-md); }
      .task-row.is-overdue { border-left: 3px solid var(--color-danger); }
      .task-row.is-done { opacity: 0.62; }
      .task-row.is-done:hover { opacity: 0.82; }
      .task-main { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }

      .crop-emoji { flex: none; width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-size: 17px; background: var(--bg-surface-2); border: 1px solid var(--border-hair); }
      .type-ic { flex: none; width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; }

      .task-text { flex: 1; min-width: 0; }
      .task-title { font-weight: 600; font-size: var(--fs-md); color: var(--text-hi); line-height: 1.3; }
      .is-done .task-title { text-decoration: line-through; text-decoration-color: var(--text-low); color: var(--text-mid); }
      .task-sub { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin-top: 3px; font-size: var(--fs-sm); color: var(--text-low); }
      .task-zone { display: inline-flex; align-items: center; gap: 3px; color: var(--text-low); }
      .dotsep { color: var(--border-soft); }

      .task-right { display: flex; align-items: center; gap: 6px; flex: none; }

      .st { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600; white-space: nowrap; }
      .st-strong { padding: 4px 10px; }
      .st-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
      .st-diamond { width: 7px; height: 7px; background: currentColor; transform: rotate(45deg); border-radius: 1px; }
      .st-pending { border: 1px solid transparent; }
      .st-done { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 12%, transparent); }

      .log-toggle, .row-del {
        width: 32px; height: 32px; border-radius: 9px; display: grid; place-items: center;
        background: transparent; border: 1px solid transparent; color: var(--text-low); cursor: pointer;
        transition: background var(--dur-fast) ease, color var(--dur-fast) ease;
      }
      .log-toggle:hover { background: var(--bg-surface-2); color: var(--primary); }
      .row-del { opacity: 0; }
      .task-row:hover .row-del, .row-del:focus-visible { opacity: 1; }
      .row-del:hover { background: color-mix(in srgb, var(--color-danger) 12%, transparent); color: var(--color-danger); }

      .fieldlog { border-top: 1px dashed var(--border-soft); background: var(--bg-surface-2); padding: 14px 16px 16px; }
      .fieldlog-head { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); font-weight: 600; color: var(--text-mid); flex-wrap: wrap; }
      .offline-chip { margin-left: auto; background: color-mix(in srgb, var(--color-warning) 12%, transparent); color: var(--color-warning); border-color: color-mix(in srgb, var(--color-warning) 28%, transparent); }
      .fieldlog-note { margin: 10px 0 12px; font-size: var(--fs-base); color: var(--text-mid); line-height: 1.55; padding-left: 22px; border-left: 2px solid var(--color-forest-300); }
      .fieldlog-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

      /* tamamlama mikro geri bildirimi */
      @keyframes task-pop { 0% { transform: scale(1); } 40% { transform: scale(0.985); } 100% { transform: scale(1); } }
      @keyframes check-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }
      .task-row.pop { animation: task-pop 520ms var(--ease-out); }

      /* özel checkbox */
      .tcheck { position: relative; flex: none; width: 26px; height: 26px; display: grid; place-items: center; cursor: pointer; }
      .tcheck input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
      .tcheck-box {
        width: 24px; height: 24px; border-radius: 8px; border: 1.8px solid var(--border-soft);
        display: grid; place-items: center; color: transparent; background: var(--bg-surface);
        transition: background var(--dur-fast) ease, border-color var(--dur-fast) ease, color var(--dur-fast) ease;
      }
      .tcheck:hover .tcheck-box { border-color: var(--primary); }
      .tcheck input:checked + .tcheck-box { background: var(--primary); border-color: var(--primary); color: var(--primary-fg); }
      .tcheck input:checked + .tcheck-box svg { animation: check-pop 320ms var(--ease-out); }
      .tcheck input:focus-visible + .tcheck-box { outline: 2px solid var(--ring); outline-offset: 2px; }

      .empty { text-align: center; display: flex; flex-direction: column; align-items: center; }

      .sk { background: linear-gradient(100deg, var(--bg-inset) 30%, var(--bg-surface-2) 50%, var(--bg-inset) 70%); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }

      @media (max-width: 860px) {
        .ritual-head { grid-template-columns: 1fr; }
        .stat-grid { grid-template-columns: repeat(3, 1fr); }
        .form-grid { grid-template-columns: repeat(2, 1fr); }
        .field-wide { grid-column: span 2; }
      }
      @media (max-width: 620px) {
        .stat-grid { grid-template-columns: 1fr; }
        .stat-chip { padding: 12px 14px; }
        .task-right { flex-direction: row; }
        .task-sub { font-size: var(--fs-xs); }
        .row-del { opacity: 1; }
        .week-bar { width: 9px; }
      }
      @media (max-width: 480px) {
        .form-grid { grid-template-columns: 1fr; }
        .field-wide { grid-column: span 1; }
        .task-main { flex-wrap: wrap; }
        .task-right { width: 100%; justify-content: flex-start; margin-left: 44px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .task-row.pop, .tcheck input:checked + .tcheck-box svg, .week-bar, .sk { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
