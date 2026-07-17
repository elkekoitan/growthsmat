// SmartGrowth OS — "Canlıya çıkış" hazırlık listesi (SAF katman).
// /panel'de gösterilen; işletme sahibinden tam-canlı için gereken hesap/anahtarları,
// ne işe yaradıklarını, güncel durumlarını ve nereden alınacaklarını (link) listeler.
// SAF: DB/env/header'a DOKUNMAZ — durum bayrakları PARAMETRE olarak girer (server/goLive.ts
// gerçek env/header'dan doldurur). Böylece durum mantığı deterministik test edilir.
//
// DÜRÜSTLÜK İLKESİ: hiçbir madde "hazır" gösterilmez gerçekten hazır değilse; anahtar
// değerleri ASLA sızdırılmaz (yalnız "tanımlı/tanımsız" boolean'ı) — link ve adımlar
// herkese açık, kamuya ait bilgidir.

export type GoLiveStatus = "hazir" | "bekleniyor" | "opsiyonel";

export interface GoLiveLink {
  label: string;
  url: string;
}

export interface GoLiveItem {
  id: string;
  title: string;
  /** Bu neden gerekli — tek cümle, kullanıcıya dönük. */
  why: string;
  status: GoLiveStatus;
  /** Güncel durumun tek cümlelik dürüst açıklaması. */
  statusNote: string;
  /** Adım adım nasıl sağlanır (boşsa "hazır" demektir). */
  steps: string[];
  links: GoLiveLink[];
}

/** server/goLive.ts'in gerçek env/header'dan doldurduğu durum bayrakları. */
export interface GoLiveFlags {
  /** ANTHROPIC_API_KEY tanımlı mı? (asistan LLM yolu aktif mi) */
  llmEnabled: boolean;
  /** Bir ödeme sağlayıcı anahtarı env'de görüldü mü? */
  paymentKeySet: boolean;
  /** İstek HTTPS üzerinden mi geldi? */
  isHttps: boolean;
  /** DATABASE_URL + şifreleme anahtarı tanımlı mı? */
  dbReady: boolean;
}

export function deriveGoLiveItems(flags: GoLiveFlags): GoLiveItem[] {
  return [
    {
      id: "veritabani",
      title: "Veritabanı ve şifreleme anahtarı",
      why: "Kalıcı veri (hesaplar, bahçe, görevler, ilanlar) ve güvenli oturum için gereken temel altyapı.",
      status: flags.dbReady ? "hazir" : "bekleniyor",
      statusNote: flags.dbReady
        ? "DATABASE_URL ve NEXT_SERVER_ACTIONS_ENCRYPTION_KEY tanımlı — kalıcılık ve kimlik doğrulama çalışıyor."
        : "DATABASE_URL veya şifreleme anahtarı tanımlı değil — uygulama kalıcı çalışamaz.",
      steps: flags.dbReady
        ? []
        : [
            "Coolify → smartgrowth projesi → yeni PostgreSQL kaynağı ekle ve başlat.",
            "İç bağlantı dizesini smartgrowth-web → Environment Variables → DATABASE_URL olarak ekle.",
            "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY için 32 baytlık rastgele değer üret ve ekle.",
          ],
      links: [{ label: "Coolify — veritabanı kurulumu", url: "https://coolify.io/docs/databases/postgresql" }],
    },
    {
      id: "ai-asistan",
      title: "AI Asistan (Claude dil modeli)",
      why: "/asistan cevaplarının kural motoru yerine Claude'dan gelmesi için gereken API anahtarı.",
      status: flags.llmEnabled ? "hazir" : "bekleniyor",
      statusNote: flags.llmEnabled
        ? "ANTHROPIC_API_KEY tanımlı — asistan cevapları Claude'dan geliyor (kural motoru yedekte)."
        : "Anahtar tanımlı değil — asistan şu an kural motoruyla çalışıyor (çalışıyor ama LLM devrede değil). Anahtarı eklediğin an devreye girer.",
      steps: flags.llmEnabled
        ? []
        : [
            "Anthropic Console → Settings → API Keys → Create Key ile bir anahtar oluştur.",
            "Coolify → smartgrowth-web → Environment Variables → ANTHROPIC_API_KEY olarak ekle.",
            "Redeploy et — asistan otomatik olarak Claude'u kullanmaya başlar (kod hazır).",
          ],
      links: [{ label: "Anthropic Console — anahtar oluştur", url: "https://console.anthropic.com/settings/keys" }],
    },
    {
      id: "odeme",
      title: "Ödeme altyapısı",
      why: "/pazar'da gerçek tahsilat için. Şu an yalnız sipariş TALEBİ kaydediliyor — para akışı yok.",
      status: "bekleniyor",
      statusNote: flags.paymentKeySet
        ? "Bir ödeme anahtarı env'de görüldü, ancak entegrasyon kodu seçtiğin sağlayıcıya göre yazılacak — sağlayıcıyı onayla."
        : "Sağlayıcı seçilmedi. Türkiye içi için iyzico, uluslararası için Stripe önerilir. Seçim + anahtar bende değil, sende.",
      steps: [
        "Bir sağlayıcı seç: iyzico (Türkiye) veya Stripe (global) — üye işyeri hesabı aç.",
        "Önce SANDBOX/test anahtarlarını al (gerçek para akmaz, güvenle test ederiz).",
        "Anahtarları ilet — ödeme + webhook entegrasyonunu kurup uçtan uca test ederim.",
      ],
      links: [
        { label: "iyzico (Türkiye)", url: "https://www.iyzico.com" },
        { label: "Stripe (global)", url: "https://stripe.com/tr" },
      ],
    },
    {
      id: "alan-adi-tls",
      title: "Özel alan adı ve HTTPS",
      why: "Güvenli oturum cookie'si (Secure bayrağı) ve profesyonel bir adres için. Şu an düz HTTP + sslip.io kullanılıyor.",
      status: flags.isHttps ? "hazir" : "opsiyonel",
      statusNote: flags.isHttps
        ? "İstek HTTPS üzerinden geldi — güvenli cookie aktif."
        : "Şu an HTTP üzerinden çalışıyor (oturum cookie'si buna göre uyarlandı, sorunsuz). Üretim için kendi alan adın + TLS önerilir.",
      steps: flags.isHttps
        ? []
        : [
            "Bir alan adı al (ör. Namecheap, GoDaddy) — örn. bahcem.com.",
            "Alan adının A kaydını sunucu IP'sine (185.255.95.111) yönlendir.",
            "Coolify → smartgrowth-web → Domains → alan adını gir. Coolify Let's Encrypt TLS'i otomatik kurar.",
          ],
      links: [{ label: "Coolify — alan adı & SSL", url: "https://coolify.io/docs/knowledge-base/domains" }],
    },
    {
      id: "otomatik-deploy",
      title: "Otomatik deploy (GitHub webhook)",
      why: "main dalına her güncelleme geldiğinde canlının otomatik yenilenmesi için. Şu an her güncelleme manuel Redeploy gerektiriyor.",
      status: "opsiyonel",
      statusNote:
        "Kod GitHub'a otomatik gidiyor ama canlıya alma şu an manuel Redeploy ile yapılıyor. GitHub webhook'u kurulursa tümüyle otomatikleşir.",
      steps: [
        "Coolify → smartgrowth-web → Webhooks sekmesinden deploy webhook URL'ini kopyala.",
        "GitHub repo → Settings → Webhooks → Add webhook → URL'i yapıştır, content type application/json, 'push' olayı.",
        "Kaydet — bundan sonra her push otomatik deploy tetikler.",
      ],
      links: [{ label: "Coolify — GitHub otomatik deploy", url: "https://coolify.io/docs/knowledge-base/git/github/integration" }],
    },
  ];
}

/** Özet sayaç: kaç madde hazır / bekleniyor / opsiyonel. */
export function summarizeGoLive(items: GoLiveItem[]): { hazir: number; bekleniyor: number; opsiyonel: number; toplam: number } {
  return {
    hazir: items.filter((i) => i.status === "hazir").length,
    bekleniyor: items.filter((i) => i.status === "bekleniyor").length,
    opsiyonel: items.filter((i) => i.status === "opsiyonel").length,
    toplam: items.length,
  };
}
