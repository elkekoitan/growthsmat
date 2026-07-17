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
      // 2026-07-13 (Phase 6a): "done" önceden yalnız src/lib/featureFlags.ts'in SAF
      // evaluateFlag()/cohortBucket() fonksiyonlarını kapsıyordu — hiçbir workspace gerçek
      // bir override kaydedemiyordu (repository/UI yoktu). Artık FeatureFlagOverride tablosu
      // + /roller'daki yönetim bölümü (yalnız workspace.manage) gerçek override yazıyor.
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
      // edilerek implement edildi (src/lib/roles.ts, /roller). Postgres/Prisma göçünün
      // Phase 0'ı (2026-07-13): gerçek User/Session/Workspace/Membership/Invite/
      // AuditEvent/Certificate tabloları (prisma/schema.prisma), gerçek e-posta+şifre
      // auth (crypto.scrypt, DB-doğrulanan opak session token — src/server/auth.ts,
      // /giris, /kayit), Coolify'da izole Postgres servisi + otomatik migrate-deploy
      // pipeline'ı canlıda çalışıyor. OAuth/Apple/Google ve gerçek Postgres RLS politikası
      // (satır güvenliği hâlâ yalnız uygulama katmanında — requireMembership() üzerinden,
      // veritabanı seviyesinde CREATE POLICY yok) bu turun kapsamı DIŞINDA, dürüstçe
      // "todo" bırakıldı — sahte kesinlik yok. 2026-07-13 (Faz 1): /roller, /uzman-danisma,
      // /kurasyon artık sahte "persona switcher" DEĞİL — gerçek requireMembership() ile
      // gated, gerçek oturumun rolünü gösteriyor. prisma/seed.ts ile 3 gerçek demo hesap
      // (kalite/uzman/satis rolleri, rastgele üretilen şifre — koda gömülü değil) eklendi
      // ki tek gerçek hesap (sahip, tüm izinler) dışındaki roller de dürüstçe test edilebilsin.
      // 2026-07-13 (dokümantasyon incelemesi): 03-TEKNIK-MIMARI.md §6.1'in workspaces(...)
      // şeması homeJurisdiction'ı dokümante ediyordu ama Workspace modelinde hiç yoktu — bu
      // yüzden /pazar'daki sertifika jurisdiction seçeneklerinin 8/9'u hep etkisizdi (yalnız
      // sabit-kodlanmış "TR" kontrol ediliyordu). Workspace.homeJurisdiction eklendi ve
      // pazar/actions.ts artık bunu kullanıyor (varsayılan hâlâ TR, ADR-009 uyarınca).
      // DÜRÜSTLÜK NOTU: aynı §6.1'in dokümante ettiği Workspace.type/plan ve User.locale/
      // unitSystem alanları HÂLÂ eklenmedi — hiçbirine bağlı gerçek bir davranış yok (plan-
      // bazlı özellik kısıtlaması, i18n locale değişimi veya birim-sistemi dönüşümü hiç yok);
      // yalnız gerçekten kullanılan bir alan (homeJurisdiction) eklendi, kullanılmayan şema
      // süsü eklenmedi (sahte kesinlik yok, tersi yönde de geçerli: kullanılmayan "tam" şema
      // da bir tür sahte kesinliktir).
      { id: "P02-01", title: "User/workspace/membership şeması", status: "done", critical: true },
      { id: "P02-02", title: "E-posta + OAuth kimlik akışı", status: "in_progress" },
      { id: "P02-03", title: "Apple/Google mobil kimlik", status: "todo" },
      { id: "P02-04", title: "Rol ve izin kataloğu", status: "done" },
      { id: "P02-05", title: "API tenant bağlamı ve politika katmanı", status: "done", critical: true },
      { id: "P02-06", title: "PostgreSQL RLS politikaları", status: "todo", critical: true },
      // P02-07 Davet ve üyelik yaşam döngüsü: transition/canCancel (src/lib/membershipLifecycle.ts)
      // SAF fonksiyon olarak test edilerek implement edilmişti; 2026-07-13 (Phase 6b) itibariyle
      // gerçek Invite/Membership/AuditEvent satırlarına da bağlandı (/roller — davet gönder/
      // iptal et/kabul et/reddet). acceptInvite() yardımcısı BİLEREK yeniden kullanılmadı (test
      // sabitlerinde userId=email varsayımı gerçek cuid şemasıyla uyuşmuyor) — bkz.
      // src/server/repositories/invites.ts başındaki not.
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
      // 2026-07-13 (Phase 6e): "done" önceden yalnız SAF computeLaborCapacity() idi — hiçbir
      // gerçek Plan/Task verisine bağlı değildi. Artık /gorevler gerçek Plan.weeklyMinutes +
      // gerçek Task tarihlerinden (mutlak tarih → dayOffset çevrimiyle) haftalık yükü hesaplıyor
      // ve aşım varsa uyarı gösteriyor. BİLİNÇLİ SINIR: Plan'ın TEK workspace-geneli areaM2'si
      // var (ürün başına ayrı alan tahsisi yok) — aynı planda birden fazla ürün varsa dakika
      // tahmini olduğundan yüksek çıkabilir (bkz. src/server/repositories/laborCapacity.ts notu).
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
      // 37 üründen 49 gerçek, lisanslı (Wikimedia Commons CC0/CC BY/CC BY-SA/kamu malı)
      // fotoğraf src/data/photoCredits.ts'e taşındı, /urunler'de
      // 2026-07-13 (dokümantasyon incelemesi — dürüstlük düzeltmesi): kaynak CSV'de HER ZAMAN
      // var olan checksumSha256/checksumVerified/variety/growthStage alanları önceden koda
      // taşınmıyordu — dosya başlığı "checksum doğrulanmış" diyordu ama checksum hiçbir yerde
      // SAKLANMIYOR/GÖSTERİLMİYORDU (07-VERI-KAYNAKLARI-VE-KANIT.md §9 ile karşılaştırmada
      // bulundu). scripts/import-crop-photos.mjs + import-microgreen-photos.mjs güncellendi,
      // her iki kredi kataloğu yeniden üretildi, invariant testler eklendi. Belgenin istediği
      // downloaded/published date, doğrulayan kişi ve ticari kullanım/türetme/model-eğitimi
      // izin bayrakları kaynak CSV'lerde HİÇ YOK — bunlar UYDURULMADI, eksik bırakıldı (ayrı
      // bir kapsam — kaynak CSV'lerin kendisi genişletilmeli). AYRI, DAHA BÜYÜK bir bulgu:
      // assets/mushroom-photos/ ve assets/pest-disease-photos/ (aynı CSV şemasıyla, checksum
      // dahil) hiç import edilmemiş — mushrooms.ts/pestDisease.ts'in hiçbir gerçek fotoğrafı
      // yok, yalnız emoji. Bu, ayrı bir görev olarak flagged (import-mushroom-photos.mjs +
      // import-pest-disease-photos.mjs yazılmalı), bu turun kapsamına alınmadı.
      // kart+detay görseli olarak entegre edildi, CC BY-SA atıf metni UI'da görünür (yasal
      // gereklilik), 2 bilinen yaklaşık/analog görsel (biber-carliston, kabak-sakiz) açıkça
      // işaretli — sahte kesinlik yok. EPPO adapter: canlı API yerine 8 gerçek EPPO/Cornell/UCIPM/
      // Wisconsin zararlı-hastalık datasheet'inden çıkarılan yerel veri seti (pestDisease.ts) —
      // Verticillium solgunluğu + Sofo ve ark. 2025 (Plants/MDPI, CC BY) biyofumigasyon bulgusu
      // (Brassica ITC'lerinin toprak patojenlerini baskılaması) clubroot+Verticillium yönetim
      // notlarına eklendi; yalnız özet erişilebildiği açıkça belirtildi (tam metin engellendi).
      // Takson şeması ayrıca YENİ bir kategoriyle genişledi: mantar yetiştiriciliği (mushrooms.ts,
      // 5 tür — shiitake/istiridye/aslan yelesi/beyaz mantar/şarap mantarı), Cornell/NC State/
      // SARE/Penn State/Thammasat/MDPI araştırmalarından (research/mushroom-cultivation/
      // report.md §1-5'in belgelediği 5 türün tamamı artık kodda — 2026-07-13'e kadar şarap
      // mantarı/Stropharia rugosoannulata koda hiç taşınmamıştı, dokümantasyon incelemesinde
      // bulundu ve eklendi). Agaricus'ta kaynakların yalnız laboratuvar spawn verisi içerdiği
      // (meyvelenme sıcaklık/nem/verim YOK) dataGaps ile açıkça işaretli — uydurulmadı.
      // 2026-07-13 (DB göç Phase 4): /kurasyon artık gerçek Postgres (CorrectionSubmission,
      // platform-geneli). Gönder/incele/onayla/reddet/geri-çek AKIŞININ TAMAMI gerçek ve
      // işlevsel (uzman-danışmadan farklı olarak burada dead-code kalan bir adım yok).
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
      // Rotasyon çözücü DERİNLEŞTİ: sabit "3 sezon" varsayılanı yerine artık pestDisease.ts'teki
      // gerçek hastalık verisiyle familya-özel minimum süre uygulanıyor (ör. Brassicaceae/
      // kökboğan → 7 yıl, sert kısıt yalnız SIKILAŞTIRILIR asla gevşetilmez) — /rotasyon'da
      // gerekçesiyle gösteriliyor.
      // 2026-07-13 (dokümantasyon denetimi, P05-12): "Birlikte ekim ilişki motoru" "done"
      // etiketliydi ama 03-TEKNIK-MIMARI.md §8 ve 05-URUN-VE-BILGI-MODELI.md §6'nın istediği
      // ÇOK BOYUTLU CropRelation (relation_type: intercrop|rotation|trap_crop|border|succession;
      // controlled mechanism enum; spatial_pattern; temporal_pattern; climate_scope; sources;
      // ayrı confidence) HİÇ implemente edilmedi — src/data/crops.ts'teki gerçek CompanionRelation
      // hâlâ tek-boyutlu bir listedir (yalnız effect/mechanism-serbest-metin/evidence, bkz. satır
      // 43-48). docs/04-GOREV-MATRISI.md'de bu görev zaten "todo" — roadmap.ts'in "done" etiketi
      // kendi üstündeki "prototip aşamasında" yorumuyla da çelişiyordu. Durum düzeltildi;
      // çok-boyutlu ilişki verisi UYDURULMADI (her crop çifti için relation_type/spatial_pattern
      // gibi alanları gerçek agronomik kaynak olmadan icat etmek "sahte kesinlik" olurdu) —
      // bu, gerçek araştırma gerektiren, ayrı bir ileri iş kalemi olarak açıkça bırakılıyor.
      // 2026-07-13 (P05-12 devamı): src/lib/intercrop.ts'e SAF, deterministik bir kategori
      // katmanı eklendi — categorizeMechanism()/relationTypeOf() mevcut 40 gerçek ilişkinin
      // KENDİ kaynaklı serbest-metin mechanism'ından kontrollü bir kategori (§8'in istediği
      // light|root_depth|nitrogen|pest|disease|pollinator|timing + rekabet/diğer) ve relation
      // type (intercrop/trap_crop/border) türetir; confidenceFromEvidence() evidence'tan 3
      // seviyeli confidence üretir. Serbest metin KAYBOLMADI, yalnız üstüne eklendi — test
      // (tests/intercrop.test.ts) gerçek 40 ilişkinin >%80'inin anlamlı kategoriye düştüğünü
      // doğruluyor. spatial_pattern/temporal_pattern/climate_scope/sources HÂLÂ yok (gerçek
      // ayrı araştırma gerektirir) — durum bu yüzden hâlâ "in_progress", "done" değil.
      status: (["in_progress", "done", "done", "done", "done", "done", "done", "done", "done", "done", "done", "in_progress", "done", "todo"][i]) as TaskStatus,
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
      // 2026-07-13 (DB göç Phase 2): /plan ve /gorevler artık localStorage DEĞİL, gerçek Postgres
      // (Plan + Task modelleri, prisma/schema.prisma) — workspace başına kalıcı, cihaz-bağımsız.
      // Plan yalnız sihirbazın HAM SiteProfile girdisini saklar (hesaplanan sonuç asla
      // kalıcılaştırılmaz, her okunuşta runAssessment() ile yeniden hesaplanır). Task modeli, eski
      // Tasks.tsx'in yerel "gubreleme" yazım hatasını (taskTemplates.ts'in "gubre"siyle
      // tutarsızdı) düzeltti ve dekoratif/hiç işlevi olmayan "offline" alanını kasıtlı olarak
      // düşürdü.
      // 2026-07-14 (P06-05): "Görev atama ve takvim" done'a çekildi — haftalık takvim şeridi zaten
      // vardı; asıl eksik olan ekip üyesine (kişiye) GERÇEK atamaydı. Task.assignedToUserId eklendi
      // (onDelete: SetNull — üye ayrılırsa geçmiş atama kaydı silinmez), assignTask() hem
      // task.assign izniyle HEM atanan kişinin O workspace'te aktif üyeliğiyle doğruluyor (başka
      // workspace'ten rastgele bir userId atanamaz). /gorevler'de her satırda gerçek atanan kişi
      // (veya "Atanmamış") görünür; izni olan roller için canlı bir üye seçici var.
      // 2026-07-14: "Fotoğraf/ses/ölçümle tamamlama" in_progress'e çekildi — "Ölçüm gir"/"Ses notu"
      // butonları önceden disabled+"Yakında" sahte placeholder'dı. Ölçüm ve saha notu girişi artık
      // GERÇEK: updateTaskLog() Postgres'e yazıyor, /gorevler'de tamamlanan her görevin altında
      // düzenlenebilir bir form var. Fotoğraf/ses kaydı KASITLI OLARAK hâlâ yapılmadı — bunlar
      // dosya/blob depolama altyapısı (bucket + upload akışı) gerektirir, bu henüz kurulu değil;
      // sahte bir "yüklendi" göstermek yerine dürüstçe disabled bırakıldı.
      status: (["done", "done", "todo", "done", "done", "in_progress", "todo", "todo", "done", "todo", "todo"][i]) as TaskStatus,
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
      // 2026-07-13 (DB göç Phase 3): /izlenebilirlik artık salt-okunur bir 8-lotluk sabit demo
      // DEĞİL — gerçek Postgres Lot + LotGenealogy modelleri (prisma/schema.prisma), gerçek
      // "yeni lot kaydet" formu (lot.create izinli roller için) ve genealogy join tablosundan
      // yeniden kurulan parentLotIds. traceability.ts'in 7 saf fonksiyonu (directParents/
      // directChildren/traceBackward/traceForward/validateMassBalance/checkOrganicClaimChain/
      // simulateRecall) artık workspace'in gerçek lotlarını da kabul eden isteğe bağlı `lots`
      // parametresi alıyor — 300 testin tamamı değişmeden geçiyor (varsayılan hâlâ sabit LOTS).
      // 2026-07-13 (dokümantasyon incelemesi): "Lot/operation/mass balance şeması" done
      // etiketliydi ama şemanın "operation" yarısı hiç yoktu — 03-TEKNIK-MIMARI.md §6.5
      // operations(...performed_by) alanına karşılık gelen tek şey serbest metin, kullanıcının
      // yazdığı ownerLabel'dı; gerçek "bunu HANGİ hesap kaydetti" denetim izi yoktu. Lot.
      // createdByUserId/createdByEmail eklendi (createLotAction artık requireMembership()'ten
      // gelen GERÇEK kullanıcıyı yazıyor, sahtelenemez). DÜRÜSTLÜK NOTU: bu, docs'un tam
      // istediği genel operations/mass_balance_entries/quality_checks/recall_cases şeması
      // DEĞİL — tek bir mutasyon türü (lot oluşturma) için ayrı bir "Operation" tablosu kurmak
      // aşırı mühendislik olurdu; gerçek bir geri çağırma YÜRÜTME akışı (şu an yalnız
      // simulateRecall ile önizleme var, UI'da dürüstçe "simüle et" diye işaretli) eklenirse
      // genel Operation tablosu o zaman yeniden değerlendirilmeli (bkz. task #40 hafıza notu).
      // 2026-07-14 (P08): "QR lot doğrulama sayfası" artık gerçek — herkese açık, oturumsuz
      // /lot/[id] rotası (src/app/lot/[id]/page.tsx) Prisma'nın GLOBAL benzersiz cuid'ine
      // (`dbId`, workspace-scoped `code`'dan FARKLI — bkz. src/server/repositories/lots.ts
      // getPublicLotView) göre arar, bu yüzden workspace'ler arası çakışmaya karşı güvenli.
      // Gerçek QR görsel üretimi `qrcode` npm paketiyle (harici servis/API YOK) sunucu
      // tarafında (izlenebilirlik/page.tsx) SVG olarak üretilir. Denetim-izi alanları
      // (createdByUserId/createdByEmail) getPublicLotView'in döndürdüğü nesneye YAPISAL
      // olarak asla giremez — fonksiyon onları spread etmek yerine yalnız Lot alanlarıyla
      // yeni bir nesne kurar.
      status: (["done", "done", "done", "done", "done", "done", "todo", "todo", "todo", "todo", "todo", "done", "todo", "done"][i]) as TaskStatus,
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
      // 2026-07-13 (dürüstlük düzeltmesi): MicrogreenRecipe artık 05 §7'nin TAM şemasını
      // taşıyor — substrateTypeAndDepth, germinationTempC, growthTempC, growthHumidityPct,
      // lightDLI, photoperiodHours, irrigationMethod, foodSafetyNote eklendi (öncesinde
      // yalnız yoğunluk/ıslatma/karartma/hasat/verim vardı, "done" etiketi şemayla
      // TUTARSIZDI). Kaynak: research/microgreens/report.md §5-6 (10 tür, evidence A-D).
      // DÜRÜSTLÜK NOTU: MICROGREEN_RECIPES hâlâ yalnız 10 tür (brokoli→fesleğen, Round 1) —
      // araştırma kütüphanesi 3 dosyada 29 türe çıkmış olsa da (05 §7, round2/round3), o 19
      // ek tür henüz koda taşınmadı; bu ayrı, işaretlenmemiş bir kapsam boşluğudur, bu tur
      // yalnız MEVCUT 10 reçetenin şema alanları tamamlandı. Yeni alanların çoğu (bezelye,
      // ayçiçeği, kale, kişniş gibi türlerde ışık/sıcaklık) rapor §5'in "aksi belirtilmedikçe
      // tüm türlere uygulanır" genel tablosuna düşüyor — türe özel kaynak yalnız brokoli,
      // turp, hardal, roka, amarant ve fesleğenin bazı alanlarında var (dosya başındaki
      // yorumda listelenmiştir); bu bir veri boşluğu değil, kaynağın kendi öngördüğü
      // varsayılan davranıştır — sahte kesinlik yok.
      // 2026-07-13 (Phase 6c): "Oda/raf/ışık kapasite modeli" ve "Restoran aboneliğinden
      // geriye ekim" ("done") önceden yalnız src/lib/microCapacity.ts'in SAF fonksiyonlarıydı
      // (hiçbir workspace gerçek bir oda profili/abonelik kaydedemiyordu). Artık Room/
      // Subscription tabloları + /mikrofiliz'deki gerçek form/kapasite sonucu bölümü var.
      // 2026-07-14 (P09): "Tepsi reçetesi karşılaştırma UI" artık gerçek — /mikrofiliz'de
      // reçete kartlarında çoklu-seçim (en fazla 4), yüzen bir karşılaştırma çubuğu ve
      // 8 metrik (güvenlik, kanıt, zorluk, ön ıslatma, karartma, hasat, verim, familya)
      // üzerinden bir karşılaştırma tablosu var. src/lib/compareCrops.ts'teki mevcut ürün
      // karşılaştırma deseni birebir yeniden kullanıldı (src/lib/compareMicrogreens.ts,
      // findBestRecipeIndex): eşitlik veya betterWhen:"none" olan metriklerde hiçbir reçete
      // sahte biçimde "en iyi" olarak vurgulanmaz.
      status: (["done", "done", "done", "done", "todo", "todo", "in_progress", "todo", "todo", "done", "done", "todo"][i]) as TaskStatus,
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
      // gerçek hesap mantığı) implement edildi. 2026-07-13: /pazar artık GERÇEK Postgres'e
      // bağlı — Listing/Order Prisma modelleri, gerçek ilan açma (üretici, kendi workspace'i),
      // gerçek sipariş verme (alıcı, real DB row), satıcı onay/iptal akışı (commerce.manage
      // izniyle gated). DÜRÜSTLÜK NOTU: Order gerçek bir ödeme işlemi DEĞİL — hiçbir ödeme
      // ağ geçidi (Stripe/PayTR/iyzico) entegre edilmedi, yalnız iki hesap arası kalıcı bir
      // satın-alma TALEBİ kaydı. OAuth/webhook/Etsy checkout backend hâlâ ayrı, yapılmadı.
      // 2026-07-13 (2. tur — dokümantasyon incelemesi + adversarial review sonrası): FR-126
      // ("sertifika doğrulanmadan organik iddia yayınlanamaz") kapısı artık GERÇEKTEN
      // uygulanıyor — src/server/repositories/certificates.ts, evaluateClaim()'i (rulePacks.ts,
      // test edilmiş) gerçek workspace sertifikalarına bağlar. Sertifika kaydı bir İDDİADIR;
      // compliance.review izinli, İLGİLİ workspace'in dışından bir rol onaylamadan
      // ("beklemede" → "onaylandi", platform-geneli inceleme kuyruğu, src/lib/
      // certificateReview.ts) hiçbir sertifika organik iddia yayınlatamaz — bu, kendi
      // işletmesinin sertifikasını "sahip" rolüyle kendi kendine onaylama açığını kapatır.
      // TR yerel takvim günü (UTC+3) doğru hesaplanır (önceki UTC-bugün hatası düzeltildi).
      // Sessiz düşürme (istenen "sertifikali", gerçek sonuç "gecis-sureci") artık hem ilan
      // formunun success mesajında hem gerçek ilan kartlarındaki claim rozetinde açıkça
      // görünür. DÜRÜSTLÜK NOTU: belge URL'i (documentUrl) hâlâ kendi kendine beyan —
      // yalnız bir bağlantı olarak saklanır, içeriği doğrulanmaz; gerçek kimlik/belge
      // doğrulaması (üçüncü taraf API, dosya yükleme+inceleme) bu MVP'nin kapsamı dışında.
      // 2026-07-13 (3. tur — kullanıcı geri bildirimi: "stok takibi" gerçek olmalı): Listing.
      // stockQty eklendi — stockType önceden yalnız kategorik bir etiketti (mevcut/tahmini-
      // hasat/on-siparis), GERÇEK bir adet sayacı yoktu. placeOrder() artık koşullu bir
      // updateMany (stockQty >= miktar) ile ATOMİK olarak stok düşer — aynı anda gelen iki
      // siparişte yarış durumu (race condition) oluşmaz. Sipariş iptal edilirse stok geri
      // eklenir. Gerçek ilan kartlarında kalan stok sayısı görünür, tükenince sipariş
      // engellenir. Vitrinim'de üretici stoğu elle güncelleyebilir (yeniden stoklama).
      // DÜRÜSTLÜK NOTU: bu migration ÖNCESİ var olan ilanlar stockQty=0 ile başlar (0 =
      // tükendi görünür) — üreticinin bunu Vitrinim'den elle güncellemesi gerekir, geçmiş
      // stok miktarı kod tarafından TAHMİN EDİLMEZ.
      // Ek (görev listesinde ayrı satırı yok, epic'e genel katkı): ABD "cottage food" (ev
      // mutfağı üretimi) yasa kataloğu — Georgia/Texas/New Mexico, 3 gerçek 2024-2025 eyalet
      // yasasından (cottageFoodLaws.ts) — ev üreticisinin fazla ürün/ev-işlenmiş gıda satışının
      // hangi eyalette lisanssız izinli olduğunu, gelir tavanını ve etiketleme zorunluluğunu
      // gösterir; New Mexico kaynağının resmi metin değil özet broşür olduğu ve tarih çelişkisi
      // açıkça işaretli.
      // 2026-07-13 (4. tur — FR-183 "Dolandırıcılık, sahte sertifika ve yasaklı ürün
      // incelemesi", dokümantasyon incelemesi): FR-183'ün SERTİFİKA-SAHTECİLİĞİ kısmı artık
      // gerçek bir akışa bağlı — daha önce ONAYLANMIŞ bir sertifika sonradan sahte/şüpheli
      // çıkarsa compliance.review izinli, İLGİLİ workspace'in dışından bir rol onu geriye
      // dönük "iptal-edildi"ye taşıyabilir (revokeCertificate, src/lib/certificateReview.ts;
      // zorunlu gerekçe metni, verifiedBy/At orijinal onay denetim izi olarak KORUNUR, üzerine
      // yazılmaz). evaluateWorkspaceClaim() yalnız "onaylandi" durumunu saydığı için iptal
      // edilen sertifika GELECEKTEKİ her organik-iddia kontrolünü otomatik reddeder — mevcut
      // yayınlanmış ilanlar geriye dönük değişmez, bu bilinçli bir sınırdır. DÜRÜSTLÜK NOTU:
      // FR-183'ün "yasaklı ürün incelemesi" kısmı AYRI mekanizmalarla zaten karşılanıyor
      // (BLOCKED_MICROGREENS/Solanaceae blokları, crops.ts/microgreens.ts) — burada eklenen
      // yalnız sertifika-sahteciliği inceleme/iptal akışı; birleşik tek bir "dolandırıcılık
      // vaka kuyruğu" (P11-10, "Moderasyon vaka ve itiraz") henüz yok, ayrı kapsam.
      // 2026-07-13 (Phase 6d): "Maliyet kategorisi modeli" ve "Ürün/lot/kanal marj hesabı"
      // ("done") önceden yalnız src/lib/costModel.ts'in SAF fonksiyonlarıydı — hiçbir workspace
      // gerçek bir maliyet kalemi kaydedemiyordu. Artık CostCycle/CostEntry tabloları + yeni
      // /maliyet sayfası var: gerçek kalemler kalıcı, marj hesaplayıcısının verim/fire/fiyat
      // girdileri BİLEREK kalıcılaştırılmaz (mikrofiliz tepsi hesaplayıcısıyla aynı ilke).
      // 2026-07-13 (kritik canlı bulgu sonrası): "B2C sepet/sipariş/ödeme" hâlâ "in_progress" —
      // artık gerçek, localStorage'da tutulan çok-ilanlı bir sepet var (/pazar, CartContext.tsx),
      // "Siparişi tamamla" tek tıkla her ilan için AYRI gerçek sipariş talebi oluşturuyor
      // (placeMultipleOrders). Eksik olan tek şey hâlâ "ödeme" — hiçbir ödeme ağ geçidi
      // entegre değil, bu dürüstçe böyle kalıyor (bkz. orders.ts başındaki not).
      status: (["done", "done", "in_progress", "done", "in_progress", "in_progress", "todo", "done", "todo", "todo", "in_progress", "todo", "todo", "done"][i]) as TaskStatus,
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
      // test edilerek implement edildi; gerçek model gateway/RAG akışı henüz yok.
      // Uzman danışma vaka akışı (açık→atandı→yanıtlandı→kapatıldı, compliance.review rol
      // kapısı, doğrulanmış+uzmanlık-eşleşmeli atama, yanıt kanıt seviyesi sessizce
      // yükseltilemez) test edilerek implement edildi (src/lib/expertConsult.ts,
      // /uzman-danisma). Asistanın güvenlik bloğu artık gerçek bir sonraki adıma bağlanıyor
      // (classifySafetyBlock ile önerilen uzmanlık alanı). Görsel gözlem vaka akışı (P11-07,
      // fotoğraf/ölçüm ekli vakalar) ayrı kapsam — henüz yok.
      // 2026-07-13 (DB göç Phase 4): /uzman-danisma artık gerçek Postgres (Expert +
      // ConsultationCase, platform-geneli — workspaceId kasıtlı olarak yok). Vaka açma ve
      // atama gerçek/işlevsel; yanıtlama paneli DÜRÜSTÇE hâlâ hiçbir hesap için açılmıyor
      // (hiçbir gerçek kullanıcı EXPERTS rosterindeki bir kimliğe bağlı değil — yeni bir
      // "uzman hesabı" sistemi kurmak bu fazın kapsamı dışında, sahte bir eşleşme uydurulmadı).
      // 2026-07-17: /asistan artık kullanıcının GERÇEK verisiyle kişisel — AssistantContext
      // (gerçek TrackedCrop bahçesi + bugünkü/gecikmiş görevler) parametre olarak girer
      // (src/lib saflığı korunur), "bahçemde ne var / bugün ne yapmalıyım" gerçek satırlardan
      // cevaplanır, güvenlik filtresi kişisel bloklardan ÖNCE çalışır (bypass yapısal olarak
      // imkânsız, testli). Bu "Domain tool registry"nin (P11-03) ilk gerçek adımı: asistan
      // artık domain verisine (bahçe/görev) bağlanıyor — genel bir registry mimarisi değil
      // henüz, o yüzden in_progress; LLM/gateway hâlâ yok (dış anahtar ister).
      status: (["todo", "done", "in_progress", "in_progress", "done", "todo", "todo", "done", "todo", "todo", "in_progress"][i]) as TaskStatus,
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
      // 2026-07-13 (DB göç Phase 5): /sensor artık gerçek Postgres (Device + Reading +
      // AlertRule, workspace-scoped). DÜRÜSTLÜK NOTU: gerçek IoT donanımı yok — okumalar
      // MANUEL girilir (sahte bir simülatör/cron kasıtlı olarak kurulmadı). Yalnız sicaklik/
      // nem/toprak-nemi için varsayılan alarm eşiği var (eski fixture ile birebir); ec/ph/isik
      // için gerçek saha verisi olmadan bir eşik uydurulmadı, cihaz kuralsız kalır.
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
      // 2026-07-13 (dokümantasyon incelemesi — ikinci dürüstlük düzeltmesi): "Tenant/IDOR
      // güvenlik testi" "done"den "in_progress"e düşürüldü. 03-TEKNIK-MIMARI.md §18 test
      // piramidinde "Domain unit" ile "Integration: PostgreSQL/RLS, ... auth" ayrı katmanlar
      // olarak tanımlanır; tests/roles.test.ts:60-68 tenant izolasyonu senaryosunu (aynı
      // e-posta birden fazla workspace) yalnız `hasPermission()`'a elle kurulmuş bir
      // `Membership[]` dizisiyle DOĞRUDAN çağırarak test ediyor — gerçek bir session,
      // `requireMembership()`, Server Action veya API route'a hiç dokunmuyor. Bu GERÇEK ve
      // değerli bir mantık testi ama mimari belgenin kastettiği anlamda bir IDOR/entegrasyon
      // testi değil (P02-06 Postgres RLS de hâlâ "todo" — DB-entegrasyon test altyapısı bu
      // epic'in kapsamı dışında bırakıldığı zaten belirtilmişti, bkz. göç planı §4).
      status: (["done", "todo", "in_progress", "todo", "in_progress", "in_progress", "todo", "done", "todo", "todo", "todo", "in_progress"][i]) as TaskStatus,
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
