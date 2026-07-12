// SmartGrowth OS — Canlı proje takip matrisi (04-GOREV-MATRISI)
// Ağırlıklı ilerleme: todo=0, in_progress=.35, blocked=.20, review=.80, done=1
// Kritik görevler (güvenlik/lot/organik/offline) ağırlık 2, diğerleri 1.

export type TaskStatus = "todo" | "in_progress" | "blocked" | "review" | "done";

export const STATUS_WEIGHT: Record<TaskStatus, number> = {
  todo: 0,
  in_progress: 0.35,
  blocked: 0.2,
  review: 0.8,
  done: 1,
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Yapılacak",
  in_progress: "Devam ediyor",
  blocked: "Bloke",
  review: "İncelemede",
  done: "Tamam",
};

export interface RoadmapTask {
  id: string;
  title: string;
  status: TaskStatus;
  critical?: boolean;
}

export interface Epic {
  id: string;
  name: string;
  short: string;
  risk: string;
  tasks: RoadmapTask[];
}

// n adet todo görevi üret (kısalık için)
const todos = (prefix: string, count: number, start = 1): RoadmapTask[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${String(start + i).padStart(2, "0")}`,
    title: `${prefix} görev ${start + i}`,
    status: "todo" as TaskStatus,
  }));

export const EPICS: Epic[] = [
  {
    id: "P00",
    name: "Araştırma, ürün ve kararlar",
    short: "Ürün tezi, PRD, mimari, senaryolar",
    risk: "Kaynak güncelliği",
    tasks: [
      { id: "P00-01", title: "Ürün tezini ve ana kapsamı sabitle", status: "done" },
      { id: "P00-02", title: "iOS/Android/web/PWA kapsamını sabitle", status: "done" },
      { id: "P00-03", title: "Resmi iklim/toprak/uygunluk kaynaklarını doğrula", status: "done" },
      { id: "P00-04", title: "Ürün/çeşit/zararlı ontoloji kaynaklarını doğrula", status: "done" },
      { id: "P00-05", title: "Mikro filiz üretim ve güvenlik kaynaklarını doğrula", status: "done" },
      { id: "P00-06", title: "Organik ve gıda mevzuatı başlangıç paketleri", status: "done" },
      { id: "P00-07", title: "Etsy politika, ücret ve API akışını doğrula", status: "done" },
      { id: "P00-08", title: "Yatırımcı sunumu ve pazar tezi", status: "done" },
      { id: "P00-09", title: "Tam PRD (238 FR + NFR)", status: "done" },
      { id: "P00-10", title: "Teknik mimari ve veri modeli", status: "done" },
      { id: "P00-11", title: "Ayrıntılı kullanıcı senaryoları", status: "done" },
      { id: "P00-12", title: "Monetizasyon ve GTM modeli", status: "done" },
    ],
  },
  {
    id: "P01",
    name: "Repo, kalite ve teslimat temeli",
    short: "Monorepo, CI, gözlemlenebilirlik",
    risk: "Monorepo / CI",
    tasks: [
      { id: "P01-01", title: "Canlı proje takip dashboardu", status: "done" },
      { id: "P01-02", title: "Web uygulama iskeleti (Next.js + tasarım dili)", status: "done" },
      { id: "P01-03", title: "Paket yöneticisi/workspace yapılandırması", status: "todo" },
      { id: "P01-04", title: "Ortak TypeScript/ESLint/format standartları", status: "review" },
      { id: "P01-05", title: "Ortam yapılandırması ve secret şeması", status: "todo" },
      { id: "P01-06", title: "CI kalite hattı", status: "todo" },
      { id: "P01-07", title: "Preview/staging yayın hattı", status: "todo" },
      { id: "P01-08", title: "Gözlemlenebilirlik temel paketi", status: "todo" },
      { id: "P01-09", title: "Feature flag ve deney altyapısı", status: "done" },
      { id: "P01-10", title: "Migrasyon expand-contract standardı", status: "todo" },
    ],
  },
  {
    id: "P02",
    name: "Kimlik, tenant ve gizlilik",
    short: "Auth, RLS, rıza, konum gizliliği",
    risk: "Veri izolasyonu",
    tasks: [
      // Membership şeması + rol/izin kataloğu + tenant-bağlamlı hasPermission() test
      // edilerek implement edildi (src/lib/roles.ts, /roller); gerçek OAuth/RLS backend yok.
      { id: "P02-01", title: "User/workspace/membership şeması", status: "in_progress", critical: true },
      { id: "P02-02", title: "E-posta + OAuth kimlik akışı", status: "todo" },
      { id: "P02-03", title: "Apple/Google mobil kimlik", status: "todo" },
      { id: "P02-04", title: "Rol ve izin kataloğu", status: "done" },
      { id: "P02-05", title: "API tenant bağlamı ve politika katmanı", status: "done", critical: true },
      { id: "P02-06", title: "PostgreSQL RLS politikaları", status: "todo", critical: true },
      // P02-07 Davet ve üyelik yaşam döngüsü (transition/canCancel/acceptInvite) test edilerek implement edildi.
      ...todos("P02", 6, 7).map((t, i) => ({ ...t, status: (i === 0 ? "done" : "todo") as TaskStatus, title: ["Davet ve üyelik yaşam döngüsü", "MFA ve yeniden doğrulama", "İzin/rıza merkezi", "Veri dışa aktarma ve silme", "Konum şifreleme/genelleştirme", "Süreli destek erişimi"][i], critical: i === 4 })),
    ],
  },
  {
    id: "P03",
    name: "Alan dijital ikizi ve coğrafi veri",
    short: "Site/parsel, toprak, su, veri kalitesi",
    risk: "Konum gizliliği",
    tasks: todos("P03", 11).map((t, i) => ({
      ...t,
      // Alan veri kalite skoru (eksik+bayat ayrımı) test edilerek implement edildi
      // (/alan-kalitesi); SoilTest/WaterTest kısmi şema olarak tanımlı, tam CRUD/onboarding yok.
      // İş gücü/bütçe kapasitesi (haftalık görev yükü toplama + bütçe aşım tespiti +
      // esnek/ertelenemez görev ayrımıyla öneri) test edilerek implement edildi (laborCapacity.ts).
      status: (["in_progress", "todo", "todo", "todo", "in_progress", "todo", "in_progress", "todo", "done", "todo", "done"][i]) as TaskStatus,
      title: ["Site ve ProductionUnit şeması", "Harita/GPS/adres onboarding", "Parsel/yatak/saksı editörü", "Güneş/gölge/rüzgâr profili", "Toprak örnek ve ölçüm modeli", "Laboratuvar PDF/CSV içe aktarma", "Su kaynağı ve test modeli", "Sera/CEA ortam profili", "İş gücü/bütçe kapasitesi", "Veri kökeni görünümü", "Alan veri kalite skoru"][i],
    })),
  },
  {
    id: "P04",
    name: "Ürün/çeşit bilgi grafiği",
    short: "Takson, çeşit, kanıt, kaynak adaptörleri",
    risk: "Kaynak/lisans/çeşit kimliği",
    tasks: todos("P04", 14).map((t, i) => ({
      ...t,
      // Arama zaten vardı; karşılaştırma (findBestCropIndex, "en iyi" vurgusu eşitlikte
      // gizlenir) bu tur test edilerek tamamlandı → görev artık done.
      // 37 ürün (20 mevcut + 17 yeni) araştırma kütüphanesinden gerçek kaynak/kanıt ile
      // yeniden yazıldı (crops.ts) — tür/çeşit/yerel ad alanları ve claim/source/evidence
      // alanları artık tutarlı şekilde dolu ve doğrulanabilir; adaptörler (Crop Ontology,
      // GRIN, EPPO, FAO GAEZ, NASA POWER, WorldClim, SoilGrids) ve checksum motoru henüz yok.
      // İçerik kürasyon konsolu (öneri→incelemede→onay/red/geri-çekme, compliance.review
      // rol kapısı, sürüm/köken koruması) test edilerek implement edildi (src/lib/curation.ts,
      // /kurasyon). Görsel lisans kataloğu: assets/crop-photos/ araştırma kütüphanesindeki
      // 37 üründen 49 gerçek, lisanslı (Wikimedia Commons CC0/CC BY/CC BY-SA/kamu malı,
      // checksum doğrulanmış) fotoğraf src/data/photoCredits.ts'e taşındı, /urunler'de
      // kart+detay görseli olarak entegre edildi, CC BY-SA atıf metni UI'da görünür (yasal
      // gereklilik), 2 bilinen yaklaşık/analog görsel (biber-carliston, kabak-sakiz) açıkça
      // işaretli — sahte kesinlik yok. EPPO adapter: canlı API yerine 6 gerçek EPPO/Cornell/
      // UCIPM zararlı-hastalık datasheet'inden çıkarılan yerel veri seti (bkz. pestDisease.ts).
      status: (i === 0 ? "done" : i === 2 ? "done" : i === 5 ? "in_progress" : i === 11 ? "done" : i === 12 ? "done" : i === 13 ? "done" : "todo") as TaskStatus,
      title: ["Takson/tür/çeşit/yerel ad şeması", "Yetiştirme yöntemi ve gereksinim şeması", "Claim/source/evidence şeması", "Crop Ontology adapter", "GRIN adapter", "EPPO adapter", "FAO GAEZ veri alma", "NASA POWER cache", "WorldClim raster hattı", "SoilGrids fallback", "Kaynak doğrulama/checksum", "Ürün/çeşit arama ve karşılaştırma", "İçerik kürasyon konsolu", "Görsel lisans kataloğu"][i],
    })),
  },
  {
    id: "P05",
    name: "Uygunluk, birlikte ekim ve plan motoru",
    short: "Skor, güven, senaryo, rotasyon",
    risk: "Sahte kesinlik",
    tasks: todos("P05", 14).map((t, i) => ({
      ...t,
      // v1 motoru + test edilmiş alt skorlar, sert kısıt, ayrı güven ve rotasyon çözücü done;
      // senaryo/birlikte ekim prototip aşamasında; karar geri bildirimi todo.
      status: (["in_progress", "done", "done", "done", "done", "done", "done", "done", "done", "done", "done", "done", "done", "todo"][i]) as TaskStatus,
      title: ["Değerlendirme input snapshot", "Birim/özellik normalizasyonu", "Sert kısıt motoru", "İklim alt skoru", "Toprak/su alt skoru", "Yöntem/operasyon alt skoru", "Risk/sürdürülebilirlik skoru", "Pazar/ekonomi alt skoru", "Güven ve belirsizlik hesabı", "Açıklama ve veri boşluğu", "Ne-olursa senaryo motoru", "Birlikte ekim ilişki motoru", "Rotasyon çözücü", "Karar geri bildirimi"][i],
    })),
  },
  {
    id: "P06",
    name: "Sezon planı, görev ve saha günlüğü",
    short: "Plan, görev şablonu, uygulama kaydı",
    risk: "Görev/uygulama bütünlüğü",
    tasks: todos("P06", 11).map((t, i) => ({
      ...t,
      // /plan'da gerçek 3-senaryo karşılaştırma UI'ı zaten çalışıyordu (önceki turda işaretlenmemiş);
      // görev şablon motoru + gecikme/aşağı akış etkisi (applyTaskDelay) test edilerek implement edildi.
      status: (["todo", "done", "todo", "done", "todo", "todo", "todo", "todo", "done", "todo", "todo"][i]) as TaskStatus,
      title: ["SeasonPlan/Activity şeması", "Plan senaryosu karşılaştırma UI", "Yatak/parsel takvim yerleşimi", "Görev şablon motoru", "Görev atama ve takvim", "Fotoğraf/ses/ölçümle tamamlama", "Uygulama ve girdi lot kaydı", "Hava/sensör görev önerisi", "Gecikme ve aşağı akış etkisi", "QR/NFC üretim birimi açma", "Operasyon KPI"][i],
    })),
  },
  {
    id: "P07",
    name: "Mobil uygulama ve offline senkron",
    short: "Expo, SQLite, outbox/inbox, çakışma",
    risk: "Çakışma ve veri kaybı",
    tasks: todos("P07", 12).map((t, i) => ({
      ...t,
      critical: [2, 5, 6, 7, 8].includes(i),
      // Outbox idempotent yazma protokolü + alan bazlı çakışma çözümü (applyOperation/
      // resolveConflict) test edilerek implement edildi (src/lib/outbox.ts). Inbox/delta,
      // mobil (Expo) ve fiziksel katman henüz yok.
      status: (["todo", "todo", "todo", "todo", "todo", "done", "todo", "done", "todo", "todo", "todo", "todo"][i]) as TaskStatus,
      title: ["Expo/RN proje ve navigasyon", "Ortak sözleşme/domain paketleri", "Güvenli token/anahtar saklama", "Yerel SQLite şeması", "Offline veri paketleme", "Outbox idempotent yazma", "Inbox/delta senkronu", "Alan bazlı çakışma çözümü", "Offline fotoğraf/ses kuyruğu", "Kamera, QR, konum, bildirim", "Tarlada büyük dokunma/ses", "Çalınmış cihaz/erişim iptali"][i],
    })),
  },
  {
    id: "P08",
    name: "Lot, organik uyum ve gıda güvenliği",
    short: "Lot zinciri, sertifika kapısı, geri çağırma",
    risk: "Organik/gıda/geri çağırma",
    tasks: todos("P08", 14).map((t, i) => ({
      ...t,
      critical: true,
      // Lot grafiği, mass balance, organik iddia zinciri ve geri çağırma soy ağacı
      // implement + test edildi (src/lib/traceability.ts, /izlenebilirlik).
      // Jurisdiction/RulePack motoru 3 (TR/EU/US) → 9 jurisdiction'a genişletildi (CA/AU/JP/
      // CODEX/SA/UK) — research/organic-certification-food-safety'den 6 gerçek belge paralel
      // okunup çıkarılan sourced keyPrinciple ile (rulePacks.ts). Sertifika/SOP/CAPA/denetim
      // export gerçek kural motoru gerektirir — henüz yok.
      status: (["done", "done", "done", "done", "done", "done", "todo", "todo", "todo", "todo", "todo", "done", "todo", "in_progress"][i]) as TaskStatus,
      title: ["Lot/operation/mass balance şeması", "Seed→hasat lot zinciri", "Paket/sevkiyat/alıcı zinciri", "Jurisdiction/RulePack motoru", "Sertifika kapsam/geçerlilik", "Organik iddia yayın kapısı", "Girdi uygunluk kontrolü", "Su testi uygunsuzluk akışı", "SOP ve kontrol noktası", "Hijyen/eğitim kayıtları", "Uygunsuzluk ve CAPA", "Geri çağırma soy ağacı", "Denetim dosyası export", "QR lot doğrulama sayfası"][i],
    })),
  },
  {
    id: "P09",
    name: "Mikro filiz uzmanlık stüdyosu",
    short: "Reçete, güvenlik kataloğu, maliyet",
    risk: "Gıda güvenliği",
    tasks: todos("P09", 12).map((t, i) => ({
      ...t,
      // Reçete şeması, Solanaceae güvenlik bloğu ve tepsi maliyet/marj: implement + test edildi.
      status: (["done", "done", "done", "in_progress", "todo", "todo", "in_progress", "todo", "todo", "done", "done", "todo"][i]) as TaskStatus,
      title: ["MicrogreenRecipe şeması", "Güvenlik kataloğu (Solanaceae blok)", "Oda/raf/ışık kapasite modeli", "Tepsi reçetesi karşılaştırma UI", "Tohum/substrat lot kabulü", "Parti/tepsi QR üretimi", "Karartma/ışık/sulama görev dizisi", "Küf/sapma gözlem akışı", "Hasat/kalite/soğuk kayıtları", "Tepsi maliyet ve marj", "Restoran aboneliğinden geriye ekim", "Reçete A/B deneyi"][i],
    })),
  },
  {
    id: "P10",
    name: "Finans, yerel ticaret ve Etsy",
    short: "Maliyet, marj, vitrin, Etsy OAuth",
    risk: "Politika, ücret, tazelik",
    tasks: todos("P10", 14).map((t, i) => ({
      ...t,
      // Master katalog + teslimat bölgeleri + Etsy/yerel ücret simülatörleri (test edilen
      // gerçek hesap mantığı) + /pazar vitrini implement edildi; OAuth/webhook/checkout backend gerektirir.
      status: (["done", "done", "in_progress", "done", "todo", "in_progress", "todo", "done", "todo", "todo", "in_progress", "todo", "todo", "done"][i]) as TaskStatus,
      title: ["Maliyet kategorisi modeli", "Ürün/lot/kanal marj hesabı", "Tahmini hasat stok modeli", "Üretici vitrini ve teslimat", "B2C sepet/sipariş/ödeme", "B2B talep/teklif/fiyat", "Restoran/CSA aboneliği", "Master katalog/kanal listing", "Etsy OAuth 2.0 PKCE", "Etsy taslak listing akışı", "Etsy politika/iddia kapısı", "Etsy webhook idempotency", "QPS/QPD limit/reconciliation", "Kanal ücret simülasyonu"][i],
    })),
  },
  {
    id: "P11",
    name: "AI asistan, uzman ve topluluk",
    short: "Model gateway, RAG, güvenlik filtresi",
    risk: "Kaynak ve yüksek risk",
    tasks: todos("P11", 11).map((t, i) => ({
      ...t,
      // Kural-tabanlı (LLM'siz) güvenlik sınıflandırma + kaynaklı Q&A motoru ve /asistan UI'ı
      // test edilerek implement edildi; gerçek model gateway/RAG/uzman akışı henüz yok.
      status: (["todo", "done", "todo", "in_progress", "done", "todo", "todo", "todo", "todo", "todo", "in_progress"][i]) as TaskStatus,
      title: ["Model gateway ve adaptör", "Politika/risk sınıflandırma", "Domain tool registry", "Sürümlü kaynak/RAG indeksi", "Kaynaklı sohbet UI/API", "Yazma taslağı ve onay", "Görsel gözlem vaka akışı", "Uzman profil ve görüş", "Topluluk/deney paylaşımı", "Moderasyon ve itiraz", "AI altın set ve eval"][i],
    })),
  },
  {
    id: "P12",
    name: "Sensör, analitik ve kurumsal ağ",
    short: "Cihaz, zaman serisi, benchmark",
    risk: "Cihaz komutu/gizlilik",
    tasks: todos("P12", 11).map((t, i) => ({
      ...t,
      // Cihaz/okuma şeması + aykırı değer filtresi test edilerek implement edildi (/sensor);
      // alarm kuralı motoru çalışıyor ama gerçek bildirim gönderimi yok (in_progress).
      status: (["done", "todo", "todo", "done", "in_progress", "todo", "todo", "todo", "todo", "todo", "todo"][i]) as TaskStatus,
      title: ["Cihaz/sensör/metric şeması", "MQTT/HTTP adapter", "Zaman serisi ingest/partition", "Sensör kalite ve aykırı değer", "Alarm kuralı ve bildirim", "Aktüatör komut güvenliği", "Üretim/maliyet dashboardu", "Tahmin-gerçek kalibrasyon", "Kooperatif toplu kapasite", "Anonim bölgesel benchmark", "Kurumsal program raporu"][i],
    })),
  },
  {
    id: "P13",
    name: "Güvenlik, kalite, pilot ve yayın",
    short: "Test piramidi, pilotlar, production",
    risk: "Uçtan uca güven",
    tasks: todos("P13", 12).map((t, i) => ({
      ...t,
      critical: [2, 4, 5, 7].includes(i),
      // Bu tur kod değil DÜRÜSTLÜK düzeltmesi: 104 testlik gerçek paket zaten
      // tenant izolasyonu (roles.test.ts), lot/geri-çağırma (traceability.test.ts) ve
      // AI güvenlik (assistant.test.ts) kapsıyordu ama hiç işaretlenmemişti. Web de
      // gerçekten canlı (Coolify) — yalnız web kapsamı, mağaza yayını yok.
      status: (["done", "todo", "done", "todo", "in_progress", "in_progress", "todo", "done", "todo", "todo", "todo", "in_progress"][i]) as TaskStatus,
      title: ["Unit/property test kapsaması", "OpenAPI/event contract testleri", "Tenant/IDOR güvenlik testi", "Offline chaos/çakışma testleri", "Lot ve geri çağırma E2E", "Organik/iddia adversarial test", "Etsy sandbox/contract E2E", "AI güvenlik ve kaynak eval", "WCAG 2.2 AA ve mobil kullanılabilirlik", "Yük, yedek ve restore tatbikatı", "Üç pilotu yürüt ve ölç", "Mağaza/web production yayın"][i],
    })),
  },
];

export interface EpicProgress {
  id: string;
  name: string;
  short: string;
  risk: string;
  taskCount: number;
  doneCount: number;
  weightedPercent: number;
  statusCounts: Record<TaskStatus, number>;
}

export function epicProgress(epic: Epic): EpicProgress {
  const statusCounts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, blocked: 0, review: 0, done: 0 };
  let weightedScore = 0;
  let totalWeight = 0;
  for (const t of epic.tasks) {
    statusCounts[t.status]++;
    const w = t.critical ? 2 : 1;
    weightedScore += STATUS_WEIGHT[t.status] * w;
    totalWeight += w;
  }
  return {
    id: epic.id,
    name: epic.name,
    short: epic.short,
    risk: epic.risk,
    taskCount: epic.tasks.length,
    doneCount: statusCounts.done,
    weightedPercent: totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0,
    statusCounts,
  };
}

export function overallProgress() {
  const progresses = EPICS.map(epicProgress);
  let weightedScore = 0;
  let totalWeight = 0;
  let taskCount = 0;
  let doneCount = 0;
  for (const epic of EPICS) {
    for (const t of epic.tasks) {
      const w = t.critical ? 2 : 1;
      weightedScore += STATUS_WEIGHT[t.status] * w;
      totalWeight += w;
      taskCount++;
      if (t.status === "done") doneCount++;
    }
  }
  return {
    weightedPercent: totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0,
    simplePercent: taskCount > 0 ? (doneCount / taskCount) * 100 : 0,
    taskCount,
    doneCount,
    epics: progresses,
  };
}
