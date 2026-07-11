import Link from "next/link";
import type { ComponentType } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider, Reveal, Counter } from "@/components/ui";
import { SpotlightCard, Marquee } from "@/components/visuals";
import { HeroMockup } from "@/components/HeroMockup";
import { CHANNELS } from "@/data/commerce";
import {
  RadialGauge,
  NumberedHeading,
  ArchFrame,
  StampBadge,
  WaveDivider,
  BotanicalScene,
} from "@/components/graphics";
import {
  Scale,
  Calendar,
  Layers,
  Sprout,
  Wifi,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowRight,
  Droplet,
  Leaf,
  Globe,
  Store,
  Package,
} from "@/components/icons";

export const metadata = {
  title: {
    absolute: "SmartGrowth OS — Doğru ürünü, doğru yerde, kanıtla yetiştir",
  },
  description:
    "Konum, alan ve hedefinize göre kanıt seviyeli üretim planı üreten organik üretim işletim sistemi. Uygunluk skoru ile güven ayrı gösterilir; veri boşlukları açıktır.",
};

type IconType = ComponentType<{ size?: number }>;

/* ---------- Veri kaynakları (canlı şerit) ---------- */
const DATA_SOURCES = [
  "NASA POWER",
  "WorldClim 2.1",
  "FAO GAEZ v4",
  "SoilGrids · ISRIC",
  "Crop Ontology",
  "USDA GRIN-Global",
  "EPPO Global Database",
];

/* ---------- Bento özellikleri ---------- */
const FEATURES: {
  icon: IconType;
  title: string;
  desc: string;
}[] = [
  {
    icon: Calendar,
    title: "Sezon planı & görev",
    desc: "Ekimden hasada takvim; sulama, gübreleme ve hasat görevleri hatırlatmalı olarak akar.",
  },
  {
    icon: Layers,
    title: "Lot izlenebilirlik & organik kapı",
    desc: "Her partiye kayıt; organik rozet ancak doğrulanınca açılır — önce yoktur.",
  },
  {
    icon: Sprout,
    title: "Mikro filiz stüdyosu",
    desc: "Tepsi maliyeti, çimlenme oranı ve gıda güvenliği kuralları; riskli türler bloklanır.",
  },
  {
    icon: Wifi,
    title: "Çevrimdışı saha",
    desc: "Tarlada internet yokken de günlük tutulur; bağlantı gelince sorunsuz eşitlenir.",
  },
];

/* ---------- Ticaret kanalları (bkz. @/data/commerce) ---------- */
const CHANNEL_ICON: Record<string, IconType> = {
  "yerel-vitrin": Store,
  "restoran-b2b": Scale,
  "csa-kutu": Package,
  etsy: Globe,
};

/* ---------- Nasıl çalışır adımları ---------- */
const STEPS: { n: string; title: string; desc: string }[] = [
  {
    n: "01",
    title: "Alanını tanımla",
    desc: "Konum, alan büyüklüğü, üretim yöntemi ve hedefini gir. Balkon saksısından tarlaya kadar.",
  },
  {
    n: "02",
    title: "Kanıtlı plan al",
    desc: "Uygunluk skoru ve ayrı güven düzeyi; alternatif senaryolar ve hazır görev takvimi.",
  },
  {
    n: "03",
    title: "Uygula ve izle",
    desc: "Saha günlüğü, lot izlenebilirliği ve proje paneliyle üretimini baştan sona takip et.",
  },
];

/* ---------- Personalar ---------- */
const PERSONAS: {
  emoji: string;
  name: string;
  role: string;
  need: string;
  gradient: string;
}[] = [
  {
    emoji: "🌿",
    name: "Elif",
    role: "Balkon üreticisi",
    need: "Küçük alanda ne yetişir, ne kadar güneş yeter? Basit ve güvenilir öneri ister.",
    gradient: "linear-gradient(150deg, var(--color-forest-200), var(--color-forest-400))",
  },
  {
    emoji: "🌱",
    name: "Derya",
    role: "Mikro filiz mikro-işletmesi",
    need: "Tepsi başına maliyet ve gıda güvenliği; hangi türü satmak kârlı ve güvenli?",
    gradient: "linear-gradient(150deg, var(--color-gold-200), var(--color-forest-300))",
  },
  {
    emoji: "🚜",
    name: "Mehmet",
    role: "Sertifikalı organik çiftçi",
    need: "Sezon planı, lot izlenebilirliği ve denetime hazır kayıt — sahada çevrimdışı.",
    gradient: "linear-gradient(150deg, var(--color-forest-300), var(--color-forest-600))",
  },
  {
    emoji: "🧑‍🍳",
    name: "Deniz",
    role: "Restoran şefi",
    need: "Menüsüne uygun, mevsiminde ve izlenebilir taze ürünü doğru üreticiden bulmak.",
    gradient: "linear-gradient(150deg, var(--color-gold-300), var(--color-gold-500))",
  },
];

/* ---------- Fiyat paketleri ---------- */
const PLANS: {
  name: string;
  price: string;
  unit?: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
}[] = [
  {
    name: "Keşif",
    price: "Ücretsiz",
    tagline: "Denemek ve öğrenmek için",
    features: ["1 aktif üretim planı", "Temel uygunluk skoru", "Ürün kâşifi erişimi"],
    cta: "Ücretsiz başla",
  },
  {
    name: "Plus",
    price: "6–9$",
    unit: "/ay",
    tagline: "Ev ve hobi üreticisi",
    features: [
      "Sınırsız üretim planı",
      "Görev takvimi & hatırlatma",
      "Mikro filiz maliyet aracı",
      "Çevrimdışı saha günlüğü",
    ],
    cta: "Plus'ı dene",
  },
  {
    name: "Grower Pro",
    price: "24–39$",
    unit: "/ay",
    tagline: "Ciddi ve satan üretici",
    features: [
      "Kanıt seviyeli senaryolar",
      "Lot izlenebilirlik & organik kapı",
      "AI asistan (kaynak gösteren)",
      "Öncelikli destek",
    ],
    cta: "Grower Pro'ya geç",
    featured: true,
  },
  {
    name: "Business",
    price: "99–249$",
    unit: "/ay",
    tagline: "Ekip ve çoklu üretim",
    features: [
      "Çok kullanıcılı ekip",
      "Parti raporları & denetim izi",
      "API & entegrasyonlar",
      "Rol bazlı erişim",
    ],
    cta: "Satışla görüş",
  },
  {
    name: "Network",
    price: "750$+",
    unit: "/ay",
    tagline: "Bölge ve tedarik ağı",
    features: [
      "Çoklu tesis & bölge",
      "Tedarik zinciri görünürlüğü",
      "Özel veri entegrasyonları",
      "Kurumsal SLA",
    ],
    cta: "İletişime geç",
  },
];

export default function Home() {
  return (
    <RevealProvider>
      <Nav />
      <main>
        {/* ============================== 1 · HERO ============================== */}
        <section
          className="mesh-light grain"
          style={{ position: "relative", overflow: "hidden", paddingBlock: "clamp(3rem, 7vw, 6rem)" }}
        >
          <BotanicalScene
            aria-hidden
            style={{
              position: "absolute",
              top: -40,
              right: -60,
              width: 520,
              height: 520,
              color: "var(--primary)",
              opacity: 0.08,
              pointerEvents: "none",
            }}
          />
          <div className="container-x" style={{ position: "relative", zIndex: 1 }}>
            <div className="hero-grid">
              {/* Sol içerik */}
              <div className="hero-stagger" style={{ display: "grid", gap: 22 }}>
                <span className="eyebrow" style={{ justifySelf: "start" }}>
                  Organik üretim işletim sistemi
                </span>

                <h1
                  className="hero-title"
                  style={{
                    fontSize: "var(--fs-display)",
                    fontWeight: 560,
                    lineHeight: 1.04,
                    letterSpacing: "-0.02em",
                    margin: 0,
                  }}
                >
                  <span className="ln">
                    <span>Doğru ürünü,</span>
                  </span>
                  <span className="ln">
                    <span>doğru yerde,</span>
                  </span>
                  <span className="ln">
                    <span>
                      <em style={{ fontStyle: "italic", color: "var(--primary)" }}>kanıtla</em> yetiştir.
                    </span>
                  </span>
                </h1>

                <p
                  className="text-pretty"
                  style={{ fontSize: "var(--fs-lead)", color: "var(--text-mid)", maxWidth: "54ch", margin: 0 }}
                >
                  Konumun, alanın ve hedefine göre kanıt seviyeli bir üretim planı. Uygunluk skorunu ve
                  ona olan <strong style={{ color: "var(--text-hi)" }}>güveni ayrı</strong> gösteririz —
                  sahte kesinlik yok, veri boşlukları açık.
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <Link href="/plan" className="btn btn-accent btn-lg">
                    Ücretsiz planını oluştur <ArrowRight size={18} />
                  </Link>
                  <a href="#nasil-calisir" className="btn btn-ghost btn-lg">
                    Nasıl çalışır
                  </a>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span className="chip">
                    <ShieldCheck size={13} /> Sahte kesinlik yok
                  </span>
                  <span className="chip">
                    <Scale size={13} /> Kanıt seviyeli öneri
                  </span>
                  <span className="chip">
                    <Globe size={13} /> Açık veri kaynakları
                  </span>
                </div>
              </div>

              {/* Sağ mockup */}
              <div className="hero-media" style={{ position: "relative", display: "grid", placeItems: "center" }}>
                <span
                  className="blob"
                  aria-hidden
                  style={{
                    width: 360,
                    height: 360,
                    top: "8%",
                    left: "12%",
                    background: "radial-gradient(circle, var(--color-forest-300), transparent 70%)",
                    opacity: 0.4,
                  }}
                />
                <div style={{ position: "relative", zIndex: 1, width: "100%", display: "grid", placeItems: "center" }}>
                  <HeroMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================== 2 · PROBLEM / KANIT BANDI ====================== */}
        <section className="pine-band grain" style={{ position: "relative", overflow: "hidden" }}>
          <WaveDivider fill="var(--bg-page)" flip height={70} />
          <div
            className="container-x"
            style={{ position: "relative", zIndex: 1, paddingBlock: "clamp(3.5rem, 7vw, 6rem)", textAlign: "center" }}
          >
            <Reveal i={0}>
              <span className="eyebrow">Neden şimdi</span>
            </Reveal>
            <Reveal i={1}>
              <div
                className="font-mono"
                style={{
                  fontSize: "var(--fs-display)",
                  fontWeight: 600,
                  color: "var(--accent)",
                  lineHeight: 1,
                  marginTop: 20,
                  letterSpacing: "-0.02em",
                }}
              >
                <Counter value={145} suffix=" milyar €" />
              </div>
            </Reveal>
            <Reveal i={2}>
              <p
                className="text-balance"
                style={{
                  fontSize: "var(--fs-lead)",
                  color: "#c7d2ca",
                  maxWidth: "60ch",
                  margin: "18px auto 0",
                }}
              >
                2024&apos;te küresel organik gıda perakendesinin büyüklüğü. Talep büyürken üretici, doğru ürünü
                seçmek, planlamak ve gıda güvenliğini kanıtlamak için hâlâ dağınık araçlarla boğuşuyor.
              </p>
            </Reveal>
            <Reveal i={3}>
              <div
                style={{
                  display: "flex",
                  gap: "clamp(1.5rem, 5vw, 3.5rem)",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginTop: 36,
                }}
              >
                {[
                  { v: "600.000+", l: "GRIN-Global accession" },
                  { v: "~9 km", l: "FAO GAEZ ön-eleme çözünürlüğü" },
                  { v: "7", l: "canlı küresel veri kaynağı" },
                ].map((s) => (
                  <div key={s.l} style={{ textAlign: "center" }}>
                    <div className="font-mono" style={{ fontSize: "var(--fs-h3)", fontWeight: 600, color: "#e8ede9" }}>
                      {s.v}
                    </div>
                    <div style={{ fontSize: "var(--fs-sm)", color: "#8ba193", marginTop: 4 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </Reveal>
            <div style={{ marginTop: 40 }}>
              <span className="font-mono" style={{ fontSize: "var(--fs-xs)", color: "#7c9184" }}>
                Kaynak: FiBL / IFOAM — The World of Organic Agriculture 2024
              </span>
            </div>
          </div>
          <WaveDivider fill="var(--bg-page)" height={70} />
        </section>

        {/* ====================== 3 · VERİ KAYNAĞI ŞERİDİ ====================== */}
        <section style={{ paddingBlock: "clamp(2.5rem, 5vw, 4rem)", background: "var(--bg-page)" }}>
          <div className="container-x" style={{ textAlign: "center", marginBottom: 24 }}>
            <Reveal i={0}>
              <span className="eyebrow">Canlı veri şeridi</span>
              <p style={{ color: "var(--text-mid)", marginTop: 12, fontSize: "var(--fs-body)" }}>
                Her öneri, adı geçen küresel ve açık veri kaynaklarına dayanır — tahmini değil,
                izlenebilir bir temele.
              </p>
            </Reveal>
          </div>
          <Marquee>
            {DATA_SOURCES.map((s) => (
              <span
                key={s}
                className="font-mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: "var(--fs-base)",
                  fontWeight: 600,
                  color: "var(--text-mid)",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 7, height: 7, borderRadius: 999, background: "var(--accent)", display: "inline-block" }}
                />
                {s}
              </span>
            ))}
          </Marquee>
        </section>

        {/* ====================== 4 · BENTO ÖZELLİKLER ====================== */}
        <section className="section" style={{ background: "var(--bg-page)" }}>
          <div className="container-x">
            <Reveal i={0}>
              <div style={{ maxWidth: "60ch", marginBottom: 40 }}>
                <span className="eyebrow">Tek platform</span>
                <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 0" }}>
                  Tohumdan satışa, üretimin tamamı için tasarlanmış modüller.
                </h2>
              </div>
            </Reveal>

            <Reveal i={1}>
              <div className="bento">
                {/* Büyük hücre — Uygunluk motoru (yaşayan mini-UI) */}
                <SpotlightCard
                  style={{ gridColumn: "span 2", gridRow: "span 2", padding: 26, display: "flex", flexDirection: "column" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: "grid",
                        placeItems: "center",
                        background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                        color: "var(--primary)",
                      }}
                    >
                      <Scale size={22} />
                    </span>
                    <div>
                      <h3 style={{ fontSize: "var(--fs-h3)", margin: 0 }}>Uygunluk motoru</h3>
                      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>
                        Skor ile güven ayrı hesaplanır
                      </span>
                    </div>
                  </div>

                  <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", margin: "4px 0 20px", maxWidth: "46ch" }}>
                    İklim, toprak, su ve operasyon faktörlerini tartar; sonucu tek bir sahte kesinlikle
                    değil, ayrı bir <strong style={{ color: "var(--text-hi)" }}>güven düzeyiyle</strong> sunar.
                  </p>

                  {/* Yaşayan panel */}
                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      gap: 22,
                      alignItems: "center",
                      flexWrap: "wrap",
                      padding: 18,
                      borderRadius: "var(--radius-card)",
                      background: "var(--bg-surface-2)",
                      border: "1px solid var(--border-hair)",
                    }}
                  >
                    <RadialGauge value={82} size={104} sub="uygunluk" />
                    <div style={{ flex: 1, minWidth: 160, display: "grid", gap: 12 }}>
                      {[
                        { label: "İklim", score: 88 },
                        { label: "Toprak", score: 62 },
                        { label: "Su", score: 90 },
                      ].map((f) => (
                        <div
                          key={f.label}
                          style={{ display: "grid", gridTemplateColumns: "58px 1fr 30px", alignItems: "center", gap: 10 }}
                        >
                          <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}>{f.label}</span>
                          <span className="meter">
                            <span style={{ width: `${f.score}%` }} />
                          </span>
                          <span
                            className="font-mono"
                            style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", textAlign: "right" }}
                          >
                            {f.score}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        flexBasis: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexWrap: "wrap",
                        paddingTop: 14,
                        borderTop: "1px solid var(--border-hair)",
                      }}
                    >
                      <span className="chip chip-warn">
                        <ShieldCheck size={13} /> Güven: Orta
                      </span>
                      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>
                        pH ölçülmedi — yerel test önerilir
                      </span>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Küçük hücreler */}
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <SpotlightCard key={f.title} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          display: "grid",
                          placeItems: "center",
                          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                          color: "var(--primary)",
                        }}
                      >
                        <Icon size={20} />
                      </span>
                      <h3 style={{ fontSize: "var(--fs-lg)", margin: "2px 0 0" }}>{f.title}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", margin: 0, lineHeight: 1.55 }}>
                        {f.desc}
                      </p>
                    </SpotlightCard>
                  );
                })}

                {/* Geniş hücre — AI asistan */}
                <Link href="/asistan" style={{ display: "contents" }}>
                  <SpotlightCard
                    glow="var(--accent)"
                    style={{
                      gridColumn: "span 4",
                      padding: 26,
                      display: "flex",
                      gap: 20,
                      alignItems: "center",
                      flexWrap: "wrap",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        background: "color-mix(in srgb, var(--accent) 16%, transparent)",
                        color: "var(--color-gold-600)",
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={26} />
                    </span>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <h3 style={{ fontSize: "var(--fs-h3)", margin: 0 }}>Kaynak gösteren AI asistan</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", margin: "8px 0 0", maxWidth: "70ch" }}>
                        &quot;Neden bu ürün?&quot; diye sor; asistan cevabını hangi veri kaynağına ve hangi kanıt
                        seviyesine dayandırdığını göstererek yanıtlar. Referanssız iddia üretmez.
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <span className="chip chip-info">
                          <Globe size={13} /> Kaynaklı yanıt
                        </span>
                        <span className="chip chip-ok">
                          <Check size={13} /> Kanıt B+
                        </span>
                      </div>
                      <span
                        className="font-mono"
                        style={{ fontSize: "var(--fs-sm)", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        Asistanı dene <ArrowRight size={14} />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>

                {/* Geniş hücre — Ticaret & Etsy */}
                <Link href="/pazar" style={{ display: "contents" }}>
                  <SpotlightCard
                    glow="var(--color-forest-400)"
                    style={{
                      gridColumn: "span 4",
                      padding: 26,
                      display: "flex",
                      gap: 20,
                      alignItems: "center",
                      flexWrap: "wrap",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 14,
                        display: "grid",
                        placeItems: "center",
                        background: "color-mix(in srgb, var(--primary) 14%, transparent)",
                        color: "var(--primary)",
                        flexShrink: 0,
                      }}
                    >
                      <Store size={26} />
                    </span>
                    <div style={{ flex: 1, minWidth: 240 }}>
                      <h3 style={{ fontSize: "var(--fs-h3)", margin: 0 }}>
                        Yerel vitrinden Etsy&apos;ye, tek pazar merkezi
                      </h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", margin: "8px 0 0", maxWidth: "70ch" }}>
                        Yerel vitrin, restoran aboneliği, CSA kutusu ve Etsy — tek master katalogdan
                        yönetilir. Her işlemde toplam ücret ve net üretici geliri ödeme öncesi
                        görünür; Etsy&apos;de başlayan işlem asla platform dışına yönlendirilmez.
                      </p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
                        {CHANNELS.map((c) => (
                          <span key={c.id} className="chip">
                            {c.name.replace("SmartGrowth ", "")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                      <span className="chip chip-info">
                        <Globe size={13} /> 0,20$ + %6,5 Etsy ücreti
                      </span>
                      <span
                        className="font-mono"
                        style={{ fontSize: "var(--fs-sm)", color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                      >
                        Pazar merkezini gör <ArrowRight size={14} />
                      </span>
                    </div>
                  </SpotlightCard>
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================== 5 · NASIL ÇALIŞIR ====================== */}
        <section id="nasil-calisir" className="paper-section section">
          <div className="container-x">
            <Reveal i={0}>
              <div style={{ maxWidth: "56ch", marginBottom: 44 }}>
                <span className="eyebrow">Nasıl çalışır</span>
                <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 0" }}>Üç adımda kanıtlı üretim.</h2>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="step-grid">
                {STEPS.map((s) => (
                  <div key={s.n} className="card" style={{ padding: 26 }}>
                    <NumberedHeading n={s.n} title={s.title} />
                    <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", margin: "-14px 0 0", lineHeight: 1.6 }}>
                      {s.desc}
                    </p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================== 6 · MOTOR VİTRİNİ ====================== */}
        <section className="section" style={{ background: "var(--bg-page)" }}>
          <div className="container-x">
            <div className="motor-grid">
              <Reveal i={0} className="edition">
                <span className="eyebrow">Sahte kesinlik yok</span>
                <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 10px" }}>
                  Skor bir şey söyler; <em style={{ fontStyle: "italic", color: "var(--primary)" }}>güven</em> onu
                  sınırlar.
                </h2>
                <div className="role" style={{ marginBottom: 16 }}>
                  Uygunluk motoru · v1.0
                </div>
                <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", lineHeight: 1.65 }}>
                  Bir ürün 82 uygunluk alabilir; ama toprağın pH&apos;ı ölçülmediyse buna olan güven yalnızca
                  &quot;orta&quot;dır. İkisini birbirine karıştırmak yerine ayrı gösteririz — böylece nereye
                  bakacağını ve neyi ölçmen gerektiğini bilirsin. Yerel test, her zaman küresel tahmine
                  üstündür.
                </p>
                <Link href="/plan" className="text-link" style={{ marginTop: 20 }}>
                  Motoru kendi alanında dene <ArrowRight size={16} />
                </Link>
              </Reveal>

              <Reveal i={1}>
                <div
                  className="card"
                  style={{ padding: 28, display: "grid", gap: 22, justifyItems: "center", textAlign: "center" }}
                >
                  <RadialGauge value={82} size={168} sub="uygunluk skoru" />
                  <div style={{ width: "100%", display: "grid", gap: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", display: "inline-flex", gap: 6, alignItems: "center" }}>
                        <ShieldCheck size={15} /> Güven düzeyi
                      </span>
                      <span className="chip chip-warn">Orta</span>
                    </div>
                    <span className="meter" style={{ height: 10 }}>
                      <span
                        style={{
                          width: "58%",
                          background: "linear-gradient(90deg, var(--color-gold-500), var(--color-gold-300))",
                        }}
                      />
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        fontSize: "var(--fs-sm)",
                        color: "var(--text-low)",
                        textAlign: "left",
                      }}
                    >
                      <Droplet size={15} />
                      pH ve tuzluluk ölçülmedi. Yerel toprak testi güveni &quot;yüksek&quot;e çıkarır.
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ====================== 7 · PERSONALAR ====================== */}
        <section className="paper-section section">
          <div className="container-x">
            <Reveal i={0}>
              <div style={{ maxWidth: "56ch", marginBottom: 44 }}>
                <span className="eyebrow">Kimler için</span>
                <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 0" }}>
                  Balkondan çiftliğe, mutfaktan pazara.
                </h2>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="persona-grid">
                {PERSONAS.map((p) => (
                  <div
                    key={p.name}
                    className="card card-hover"
                    style={{ padding: 16, position: "relative", overflow: "visible" }}
                  >
                    <div style={{ position: "absolute", top: -14, right: -10, zIndex: 2 }}>
                      <StampBadge
                        size={74}
                        ring="SMARTGROWTH · TR · "
                        center={<Leaf size={18} />}
                      />
                    </div>
                    <ArchFrame ratio="4 / 5" style={{ background: p.gradient }}>
                      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                        <span style={{ fontSize: 54, filter: "drop-shadow(0 3px 8px rgba(0,0,0,0.18))" }} aria-hidden>
                          {p.emoji}
                        </span>
                      </div>
                      <BotanicalScene
                        aria-hidden
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", color: "#ffffff", opacity: 0.14 }}
                      />
                    </ArchFrame>
                    <div style={{ marginTop: 16 }}>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 560 }}>
                        {p.name}
                      </div>
                      <div
                        className="font-mono"
                        style={{
                          fontSize: "var(--fs-xs)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: "var(--accent)",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {p.role}
                      </div>
                      <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", margin: "10px 0 0", lineHeight: 1.55 }}>
                        {p.need}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================== 8 · TİCARET VE ETSY ====================== */}
        <section className="section" style={{ background: "var(--bg-page)" }}>
          <div className="container-x">
            <Reveal i={0}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  gap: 24,
                  flexWrap: "wrap",
                  marginBottom: 36,
                }}
              >
                <div style={{ maxWidth: "56ch" }}>
                  <span className="eyebrow">Sat, kaçırma</span>
                  <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 0" }}>
                    Ürettiğini <em style={{ fontStyle: "italic", color: "var(--primary)" }}>kaçırmadan</em> sat.
                  </h2>
                  <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-body)", margin: "12px 0 0" }}>
                    Dört kanal, tek master katalog. Her işlemde toplam ücret ve net üretici geliri
                    ödeme öncesi görünür — Etsy ücreti SmartGrowth ücretinden her zaman ayrı gösterilir.
                  </p>
                </div>
                <Link href="/pazar" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Pazar merkezini keşfet <ArrowRight size={16} />
                </Link>
              </div>
            </Reveal>

            <Reveal i={1}>
              <div className="channel-grid">
                {CHANNELS.map((c) => {
                  const Icon = CHANNEL_ICON[c.id];
                  return (
                    <SpotlightCard key={c.id} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                      <span
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 11,
                          display: "grid",
                          placeItems: "center",
                          background: "color-mix(in srgb, var(--primary) 10%, transparent)",
                          color: "var(--primary)",
                        }}
                      >
                        <Icon size={20} />
                      </span>
                      <h3 style={{ fontSize: "var(--fs-lg)", margin: "2px 0 0" }}>{c.name}</h3>
                      <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", margin: 0, lineHeight: 1.55, flex: 1 }}>
                        {c.tagline}
                      </p>
                      <span className="chip" style={{ width: "fit-content" }}>
                        <Scale size={13} />{" "}
                        {c.feePct[0] === c.feePct[1] ? `%${c.feePct[0]}` : `%${c.feePct[0]}–${c.feePct[1]}`}
                      </span>
                    </SpotlightCard>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================== 9 · FİYATLANDIRMA ====================== */}
        <section className="section" style={{ background: "var(--bg-page)" }}>
          <div className="container-x">
            <Reveal i={0}>
              <div style={{ textAlign: "center", maxWidth: "60ch", margin: "0 auto 20px" }}>
                <span className="eyebrow">Fiyatlandırma</span>
                <h2 style={{ fontSize: "var(--fs-h1)", margin: "16px 0 0" }}>
                  Balkondan tedarik ağına, seninle büyüyen paketler.
                </h2>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  justifyContent: "center",
                  flexWrap: "wrap",
                  marginBottom: 40,
                }}
              >
                <span className="chip">
                  <Check size={13} /> Kart gerektirmeyen ücretsiz katman
                </span>
                <span className="chip">
                  <Check size={13} /> Sözleşme yok
                </span>
                <span className="chip">
                  <Check size={13} /> İstediğin an iptal
                </span>
              </div>
            </Reveal>
            <Reveal i={2}>
              <div className="price-grid">
                {PLANS.map((plan) => (
                  <div
                    key={plan.name}
                    className={`card ${plan.featured ? "sg-featured" : ""}`}
                    style={{
                      padding: 24,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      position: "relative",
                      ...(plan.featured
                        ? { boxShadow: "var(--shadow-lg)", borderColor: "transparent" }
                        : {}),
                    }}
                  >
                    {plan.featured && (
                      <span
                        className="chip chip-warn"
                        style={{
                          position: "absolute",
                          top: -13,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 3,
                          background: "var(--accent)",
                          color: "var(--accent-fg)",
                          borderColor: "transparent",
                          fontWeight: 700,
                        }}
                      >
                        <Sparkles size={13} /> En popüler
                      </span>
                    )}
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--fs-lg)", fontWeight: 560 }}>
                        {plan.name}
                      </div>
                      <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)", marginTop: 2 }}>
                        {plan.tagline}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span className="font-mono" style={{ fontSize: "var(--fs-h3)", fontWeight: 600, color: "var(--text-hi)" }}>
                        {plan.price}
                      </span>
                      {plan.unit && <span style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>{plan.unit}</span>}
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10, flex: 1 }}>
                      {plan.features.map((feat) => (
                        <li
                          key={feat}
                          style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: "var(--fs-sm)", color: "var(--text-mid)" }}
                        >
                          <span style={{ color: "var(--primary)", flexShrink: 0, marginTop: 1 }}>
                            <Check size={15} />
                          </span>
                          {feat}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/plan"
                      className={`btn ${plan.featured ? "btn-accent" : "btn-secondary"}`}
                      style={{ width: "100%" }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ====================== 10 · KAPANIŞ CTA ====================== */}
        <section className="pine-band grain" style={{ position: "relative", overflow: "hidden" }}>
          <WaveDivider fill="var(--bg-page)" flip height={70} />
          <div
            className="container-x"
            style={{ position: "relative", zIndex: 1, paddingBlock: "clamp(4rem, 8vw, 7rem)", textAlign: "center" }}
          >
            <Reveal i={0}>
              <BotanicalScene
                aria-hidden
                style={{ width: 96, height: 96, color: "var(--accent)", opacity: 0.9, margin: "0 auto 20px" }}
              />
              <h2 style={{ fontSize: "var(--fs-h1)", margin: 0, maxWidth: "18ch", marginInline: "auto" }}>
                Bugün doğru ürünle, doğru yerde başla.
              </h2>
              <p style={{ color: "#c7d2ca", fontSize: "var(--fs-lead)", maxWidth: "52ch", margin: "18px auto 32px" }}>
                Birkaç dakikada alanını tanımla, kanıt seviyeli planını al. Ücretsiz katman kart
                gerektirmez.
              </p>
              <Link href="/plan" className="btn btn-accent btn-lg">
                Ücretsiz planını oluştur <ArrowRight size={18} />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />

      {/* Sayfa-özel stil (yalnızca bu bileşende) */}
      <style>{`
        .hero-grid { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: clamp(2rem, 5vw, 3.5rem); align-items: center; }
        @media (max-width: 960px) { .hero-grid { grid-template-columns: 1fr; } }

        .hero-title .ln { display: block; overflow: hidden; padding-bottom: 0.06em; }
        .hero-title .ln > span { display: block; transform: translateY(110%); animation: sgLineUp 0.85s var(--ease-reveal) forwards; }
        .hero-title .ln:nth-child(1) > span { animation-delay: 0.05s; }
        .hero-title .ln:nth-child(2) > span { animation-delay: 0.16s; }
        .hero-title .ln:nth-child(3) > span { animation-delay: 0.27s; }
        @keyframes sgLineUp { to { transform: translateY(0); } }

        .step-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
        .persona-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.25rem; }
        .channel-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
        @media (max-width: 860px) { .channel-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
        @media (max-width: 480px) { .channel-grid { grid-template-columns: 1fr; } }
        .price-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; align-items: stretch; }
        .motor-grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: clamp(2rem, 5vw, 4rem); align-items: center; }
        @media (max-width: 820px) { .motor-grid { grid-template-columns: 1fr; } }

        .edition .role { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.12em; font-size: var(--fs-xs); color: var(--accent); font-weight: 600; }
        .edition p { max-width: 60ch; }

        .text-link { display: inline-flex; align-items: center; gap: 0.45rem; color: var(--primary); font-weight: 600; transition: gap var(--dur-base) var(--ease-out); }
        .text-link:hover { gap: 0.75rem; }

        @property --sgAngle { syntax: '<angle>'; initial-value: 0deg; inherits: false; }
        @keyframes sgSpin { to { --sgAngle: 360deg; } }
        .sg-featured::before {
          content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1.6px;
          background: conic-gradient(from var(--sgAngle), transparent 0deg, var(--accent) 55deg, var(--primary) 130deg, transparent 215deg, transparent 360deg);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          animation: sgSpin 6s linear infinite; pointer-events: none; z-index: 1;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-title .ln > span { animation: none; transform: none; }
          .sg-featured::before { animation: none; }
        }
      `}</style>
    </RevealProvider>
  );
}
