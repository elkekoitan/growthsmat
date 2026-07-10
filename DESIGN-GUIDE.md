# SmartGrowth OS — Tasarım Rehberi (build ajanları için tek kaynak)

## Dil: "Evergreen Ledger"
Orman yeşili kimlik (%8) + hasat altını aksan (%2) + sıcak kağıt nötrleri (%90).
Light: kağıt/krem zemin. Dark: pine yeşil-siyah (`.dark` class, otomatik).
Fraunces (display serif, h1-h4 otomatik) · Inter (UI) · Geist Mono (veri/KPI).

## Hazır CSS sınıfları (globals.css — YENİDEN TANIMLAMA, kullan)
- Butonlar: `btn` + `btn-primary | btn-accent | btn-secondary | btn-ghost` + boyut `btn-lg | btn-sm`. Hover/active/focus/disabled durumları hazır. `btn-lg` pill'dir (marketing CTA).
- Kart: `card` (+ `card-hover` hover lift için).
- Rozet: `eyebrow` (pill, altın nokta öneki, uppercase) — bölüm başlıkları üstünde.
- Çip: `chip` + `chip-ok | chip-warn | chip-danger | chip-info` (durum = renk + ikon + etiket).
- Cam: `glass` (yalnız nav/chrome).
- Doku: `grain` (parent'a `position:relative` ver; ::after ile noise kaplar).
- Arka planlar: `mesh-light` (hero mesh gradyan, dark'ta spotlight'a dönüşür), `pine-band` (koyu yeşil bölüm — stats/CTA; içinde başlıklar açık renk olur), `paper-section` (krem bölüm).
- Blob: `blob` (position:absolute ver + width/height/background/top/left; blur+drift hazır).
- Bento: `bento` (4 kolon grid, responsive 2/1; hücreye `grid-column: span 2` / `grid-row: span 2` inline ver).
- Animasyon: `hero-stagger` (çocuklar sırayla fade-up), `reveal` (+ `style={{'--i': n}}` stagger; RevealProvider gerekli), `shimmer-text`, `marquee`>`marquee-track` (içerik 2x render edilir), `meter`>`span` (skor çubuğu, width % inline), `spinner`.
- Layout: `container-x` (1200px), `container-narrow` (880px), `section` (dikey padding), `text-balance`, `tnum`.

## CSS değişkenleri
Yüzey: `--bg-page --bg-surface --bg-surface-2 --bg-inset`
Metin: `--text-hi --text-mid --text-low`
Çizgi: `--border-hair --border-soft`
Marka: `--primary --primary-hover --primary-fg --accent --accent-fg --ring`
Semantik: `--color-success --color-warning --color-danger --color-info`
Gölge: `--shadow-sm --shadow-md --shadow-lg --shadow-primary`
Tip ölçek: `--fs-xs --fs-sm --fs-base --fs-md --fs-lg --fs-body --fs-lead --fs-h3 --fs-h2 --fs-h1 --fs-display`
Motion: `--dur-instant --dur-fast --dur-base --dur-slow --dur-reveal` · `--ease-out --ease-out-soft --ease-in-out --ease-reveal`
Radius: `--radius-control(10) --radius-card(16) --radius-bento(24)`
Ham ramp: `--color-forest-50..950 --color-gold-100..900 --color-paper-50..300 --color-ink-900/700/500 --color-pine-base/raised/overlay/high`

## Paylaşılan bileşenler (import edip kullan)
- `@/components/Nav` → `<Nav />` (client; sticky glass nav + tema toggle + mobil menü)
- `@/components/Footer` → `<Footer />`
- `@/components/Logo` → `<Logo size={30} />`, `<Mark size={32} />` (SVG marka)
- `@/components/ui` → `<RevealProvider>` (sayfada bir kez, client), `<Reveal i={n}>`, `<Counter value={} suffix="" decimals={} />` (görünürlükte sayar)
- `@/components/hooks` → `useReveal, useCountUp, useTheme` (client)
- `@/components/HeroMockup` → `<HeroMockup />` (landing hero ürün önizleme kartı)
- `@/components/icons` → `Sprout Leaf Sun Droplet Thermometer ShieldCheck Chart Clipboard Layers MapPin Sparkles Package Store Wifi Beaker Grid ArrowRight Check X Calendar Scale Moon Menu Globe` (hepsi `size` prop alır, currentColor)

## Veri katmanı (import edip kullan — YENİDEN YAZMA)
- `@/data/crops` → `CROPS: Crop[]`, `CROP_BY_ID`, `METHOD_LABELS`, `SEASON_LABELS`, `EVIDENCE_LABELS`; tipler `Crop, GrowMethod, Season, EvidenceGrade, CropCategory`
- `@/lib/suitability` → `runAssessment(profile: SiteProfile): AssessmentResult`, `assessCrop`, `CITIES`, `CITY_TO_ZONE`, `CLIMATE_ZONES`, `GOAL_LABELS`, `ENGINE_VERSION`; tipler `SiteProfile, CandidateResult, Scenario, AssessmentResult, Goal`
- `@/data/microgreens` → `MICROGREEN_RECIPES`, `BLOCKED_MICROGREENS`, `SAFETY_LABELS`, `computeTrayCost(input): TrayCostResult`, `DEFAULT_TRAY_INPUT`; tipler `MicrogreenRecipe, TrayCostInput, TrayCostResult`
- `@/data/roadmap` → `EPICS: Epic[]`, `epicProgress(epic)`, `overallProgress()`, `STATUS_WEIGHT`, `STATUS_LABELS`; tipler `TaskStatus, RoadmapTask, Epic`

## İMZA GÖRSEL PRİMİTİFLERİ (araştırmadan çıkan güçlü move'lar — bunları kullan)
- `@/components/graphics` (SAF SVG/CSS, server'da da kullanılır):
  - `<RadialGauge value={0-100} size label sub color track />` — conic-gradient halka gösterge (plan sonuç skoru, panel proje sağlığı, çimlenme oranı)
  - `<SegmentedBar segments={n} current={i} height />` — tamamlanan/mevcut(baskın altın)/bekleyen faz çubuğu (plan adımları, panel epik fazları)
  - `<Sparkline data={number[]} width height color fill />` — mini trend (KPI kartları)
  - `<WaveDivider fill flip height />` — organik dalga section ayracı (keskin çizgi yerine; geçişlerde fill=sonraki bölümün zemini)
  - `<StampBadge ring center={<>...</>} size />` — dönen dairesel mühür rozeti (kart köşe etki-istatistiği)
  - `<ArchFrame ratio children />` — kemer maskeli görsel çerçeve (persona/vitrin kartları)
  - `<SoilLineStages stages={[{emoji,label,day}]} />` — sürekli toprak çizgisi üzerinde büyüme evreleri (mikro filiz, plan)
  - `<BotanicalScene className style />` — gizli 'S' harf formu üzerine dizili, currentColor botanik hero sahnesi (kendi kendini çizen çizgiler)
  - `<NumberedHeading n="01" title eyebrow />` — mono rakam + serif başlık + hairline (bölüm başlıkları)
- `@/components/visuals` (CLIENT "use client"):
  - `<SpotlightCard glow as children />` — imleç-takip fener glow kartı (bento özellikler, panel widget'ları)
  - `<Marquee>...</Marquee>` — kenarları eriyen, hover'da duran sonsuz şerit (veri kaynağı şeridi; içerik otomatik 2x)
  - `<RevealHeading lines={[...]} as />` — satır satır maske içinden yukarı açılan başlık (hero + bölüm başlıkları; RevealProvider gerekli)
  - `<CompareSlider before after beforeLabel afterLabel height />` — görünmez range input'lu karşılaştırma sürgüsü (mikro filiz önce/sonra, plan yerel-test etkisi)
  - `<KpiCard label value unit delta={{value,dir,good}} data={number[]} color />` — kanonik KPI: mono etiket + tabular sayı + delta chip + sparkline

## Doküman gerçekleri (kullan)
- Veri kaynakları: FAO GAEZ v4 (~9km ön-eleme), NASA POWER (günlük iklim), WorldClim 2.1 (normaller), SoilGrids/ISRIC (REST beta duraklatıldı → yerel test üstün), Crop Ontology, USDA GRIN-Global (600k+ accession), EPPO Global Database (zararlı/karantina).
- Pazar: 2024 küresel organik gıda perakende 145 milyar EUR (FiBL/IFOAM). Etsy: 86,5M alıcı, 5,6M satıcı, 10,5 milyar USD GMS; ücret 0,20 USD listing + %6,5 transaction.
- Mikro filiz güvenliği: Penn State Extension, FDA FSMA Produce Safety, Utah State. Bloklu türler: domates/biber/patlıcan/patates (Solanaceae fide alkaloidi).
- İlkeler: "organik" doğrulanmadan rozet YOK; skor ile güven AYRI; üretici verinin sahibi; yerel test küresel tahmine üstün.
- Fiyat paketleri: Keşif (ücretsiz), Plus (6-9 USD), Grower Pro (24-39 USD), Business (99-249 USD), Network (750+ USD).

## Sayfa iskeleti (her sayfa)
```tsx
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { RevealProvider } from "@/components/ui";
// server component sayfa → interaktif kısımlar ayrı "use client" bileşenlerde
export default function Page() {
  return (
    <RevealProvider>
      <Nav />
      <main>...</main>
      <Footer />
    </RevealProvider>
  );
}
```
`RevealProvider` client'tır; server sayfayı sarabilir (children pattern). Metadata: `export const metadata = { title: "..." }`.

## Kurallar
1. Türkçe, premium ve dürüst ton. Sahte kesinlik yok: skor ile güven AYRI gösterilir; veri boşlukları açık.
2. Durum asla yalnız renkle verilmez (ikon + etiket).
3. Görsel: emoji yalnız ürün simgesi olarak küçük dozda; asıl görsellik SVG/CSS (gradyan, botanik çizgi, mockup) ile.
4. Erişilebilirlik: focus-visible hazır; button/link semantiği doğru kullan; kontrast token'ları hazır.
5. localStorage anahtarları: tema `sg-theme`, görevler `sg-tasks`, plan `sg-plan`, panel durumları `sg-roadmap`.
6. Inline style + hazır sınıflar serbest; Tailwind utility de kullanılabilir. Yeni global CSS ekleme — sayfa-özel stil gerekiyorsa `<style>{`...`}</style>` bloğu sayfa bileşeninde kalsın.
7. Next.js 16: client bileşene `"use client"`; sayfalar mümkünse server. `next/link` Link, `next/navigation` usePathname.
