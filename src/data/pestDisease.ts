// SmartGrowth OS — Zararlı/hastalık kataloğu (PRD FR-033, P04 "EPPO adapter")
// Kaynak: research/pest-disease-relationships/ — gerçek EPPO datasheet'leri (Bemisia tabaci,
// Diabrotica, Frankliniella, Phyllotreta, Plasmodiophora, Ralstonia), Cornell factsheet'leri
// (geç yanıklık, kabakgil bakteriyel solgunluk) ve UC IPM/TAMU pest note'ları (afidler, iki
// noktalı kırmızı örümcek akarı). Canlı EPPO API entegrasyonu DEĞİL — yerel, statik, kaynağı
// gösterilmiş bir veri seti (bkz. roadmap.ts P04 "EPPO adapter" yorumu).
//
// Familya eşlemesi: kaynak belgeler bazen eski taksonomiyi kullanır (Chenopodiaceae),
// crops.ts güncel APG sınıflandırmasını kullanır (Amaranthaceae) — FAMILY_SYNONYMS bu
// farkı eşleştirme sırasında normalize eder; kaynak veri SESSİZCE değiştirilmez.

import type { Crop } from "@/data/crops";

export type PestKind = "zararli" | "hastalik";

export interface PestDiseaseProfile {
  id: string;
  commonName: string;
  scientificName: string;
  kind: PestKind;
  affectedFamilies: string[];
  symptoms: string;
  management: string;
  sourceOrg: string;
  sourceFile: string;
}

const FAMILY_SYNONYMS: Record<string, string> = {
  Chenopodiaceae: "Amaranthaceae",
};

function normalizeFamily(family: string): string {
  return FAMILY_SYNONYMS[family] ?? family;
}

export const PEST_DISEASE_PROFILES: PestDiseaseProfile[] = [
  {
    id: "bemisia-tabaci",
    commonName: "Tütün beyazsineği (Pamuk/Gümüş yapraklı beyazsinek)",
    scientificName: "Bemisia tabaci (Gennadius)",
    kind: "zararli",
    affectedFamilies: ["Solanaceae", "Brassicaceae", "Cucurbitaceae", "Fabaceae", "Apiaceae", "Asteraceae", "Chenopodiaceae", "Poaceae"],
    symptoms:
      "Yaprak altlarında beslenen ergin ve nimfler yapraklarda klorotik (sararmış) lekelere, yoğun bulaşmada tüm yaprağın sararıp dökülmesine ve salgıladıkları tatlımsı madde (honeydew) üzerinde gelişen kurumuş küf tabakasına yol açar; B biyotipi ayrıca kabakta yaprak gümüşlenmesi, domateste dengesiz olgunlaşma gibi fitotoksik belirtiler oluşturur. Böcek 400'den fazla bitki virüsünü (özellikle begomovirüsler: TYLCV) taşıyarak yaprak kıvrılması ve mozaik gibi ek belirtilere yol açar.",
    management:
      "Kimyasal mücadelede etkin madde rotasyonu şarttır (yaygın direnç gelişmiştir); organik/IPM yaklaşımında entomopatojenik mantarlar (Beauveria bassiana), avcı akar Amblyseius swirskii, parazitoyit Encarsia/Eretmocerus türleri, mineral/bitkisel yağ uygulamaları ve sarı yapışkan tuzaklarla izleme önerilir.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Bemisia_tabaci.pdf",
  },
  {
    id: "diabrotica-undecimpunctata-howardi",
    commonName: "Güney mısır kök kurdu (benekli salatalık böceği)",
    scientificName: "Diabrotica undecimpunctata howardi",
    kind: "zararli",
    affectedFamilies: ["Cucurbitaceae", "Fabaceae", "Poaceae", "Solanaceae", "Asteraceae", "Chenopodiaceae"],
    symptoms:
      "Ergin böcekler kabakgillerin yapraklarında delikler, sürgün ve genç meyvelerde iğne ucu görünümünde yaralar açarak solgunluk ve verim kaybına yol açar. Larvalar mısır köklerinde beslenip gövdeye tünel açar; bulaşık bitkiler bodurlaşır, sararır, şiddetli durumlarda ölür. Ayrıca mısır klorotik benek virüsü (MCMV) ve çeşitli comovirus/carmovirus'ları taşıyan önemli bir vektördür.",
    management:
      "Ekim nöbeti tek başına yeterli değildir; dayanıklı çeşit kullanımı, erken sürüm/geç dikim, şeffaf koruma örtüleri ve siyah plastik malç, sarı yapışkan tuzaklarla izleme ve kitle yakalama önerilir. Larvalara karşı bazı Bacillus thuringiensis (Bt) suşları etkilidir.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Diabrotica_undecimpunctata_howardi.pdf",
  },
  {
    id: "frankliniella-occidentalis",
    commonName: "Batı çiçek tripsi",
    scientificName: "Frankliniella occidentalis",
    kind: "zararli",
    affectedFamilies: ["Solanaceae", "Cucurbitaceae", "Fabaceae", "Apiaceae", "Amaryllidaceae", "Asteraceae", "Chenopodiaceae"],
    symptoms:
      "Yapraklarda üst yüzeyde renk açılması, çöküntüler, gümüşileşme, deformasyon ve kahverengi kabarcıklar görülür; çiçek ve tomurcuklarda yara izi ve \"halka lekelenme\" oluşur. Nimfler tarafından bulaştırılan domates lekeli solgunluk virüsü (TSWV) yapraklarda mozaik ve bodurlaşmaya yol açabilir.",
    management:
      "Kimyasal mücadele zararlının gizli yaşam alışkanlığı ve ilaç direnci nedeniyle güçtür; Amblyseius barkeri ve Neoseiulus cucumeris gibi avcı akarlarla biyolojik mücadele, sera/işletme hijyeni, mavi-sarı yapışkan tuzaklarla izleme ve fide/dikim materyalinin karantina kontrolü öncelikli IPM önlemleridir.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Frankliniella_occidentalis.pdf",
  },
  {
    id: "phyllotreta-cruciferae",
    commonName: "Turpgiller pire böceği (crucifer flea beetle)",
    scientificName: "Phyllotreta cruciferae (Goeze)",
    kind: "zararli",
    affectedFamilies: ["Brassicaceae"],
    symptoms:
      "Erişkin pire böceği turpgiller (lahana, turp, hardal, kanola vb.) yapraklarında ve çeneklerinde küçük, yuvarlak \"saçma deliği\" tarzı delikler açarak beslenir; fide döneminde şiddetli saldırılar bitki kaybına yol açabilir, larvalar kök ve kök boğazında beslenir.",
    management:
      "Münavebe (Brassicaceae dışı bitkilerle rotasyon), erken/geç dikim ile yoğun uçuş dönemlerinden kaçınma, yüzer sıra örtüleri, tuzak bitkiler, tarla temizliği, dayanıklı çeşit kullanımı; organik üretimde izinli müdahale gerektiğinde kaolin kili, diatomeli toprak veya spinosad/piretrin bazlı OMRI onaylı ürünler sınırlı kullanılabilir.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Phyllotreta_cruciferae.pdf",
  },
  {
    id: "plasmodiophora-brassicae",
    commonName: "Lahana kök uru (clubroot)",
    scientificName: "Plasmodiophora brassicae Woronin",
    kind: "hastalik",
    affectedFamilies: ["Brassicaceae"],
    symptoms:
      "Brassicaceae familyasındaki bitkilerin köklerinde şişkin, yumru/ur benzeri deformasyonlara (club-shaped gövde) yol açan toprak kökenli bir protist hastalığıdır; etkilenen bitkilerde solma, cılızlaşma ve sararma görülür.",
    management:
      "Brassicaceae türleriyle uzun süreli (5-7 yıl) ekim nöbeti, toprak pH'ını kireçleme ile 7.2 üzerine çıkarma, drenaj iyileştirme, sertifikalı/hastalıksız fide kullanımı, dayanıklı çeşitler, bulaşık toprağın alet/su ile taşınmasının önlenmesi.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Plasmodiophora_brassicae.pdf",
  },
  {
    id: "ralstonia-solanacearum",
    commonName: "Bakteriyel Solgunluk",
    scientificName: "Ralstonia solanacearum species complex",
    kind: "hastalik",
    affectedFamilies: ["Solanaceae", "Fabaceae", "Cucurbitaceae", "Brassicaceae", "Apiaceae", "Chenopodiaceae", "Asteraceae"],
    symptoms:
      "En genç yapraklarda, günün en sıcak saatinde başlayan ani solgunluk; yapraklarda bronzlaşma/sararma, gövde damarlarında kahverengi renk değişimi ve kesilen sap/yumrudan kremsi-beyaz bakteriyel sızıntı tipiktir. Patateste yumru damar halkasında nekroz; domates, patlıcan ve biberde tek taraflı solgunluk ve hızlı bitki çöküşü görülür.",
    management:
      "Kimyasal tedavisi yoktur; sertifikalı, patojenden ari tohum/fide kullanımı, en az 2 yıl konukçu olmayan bitkilerle münavebe, yabani konukçuların imhası, bulaşık suyla sulamadan kaçınma, aletlerin %20 çamaşır suyu ile dezenfeksiyonu, enfekte parsellerin karantinaya alınıp erken bildirilmesi.",
    sourceOrg: "EPPO (European and Mediterranean Plant Protection Organization)",
    sourceFile: "EPPO_Datasheet_Ralstonia_solanacearum.pdf",
  },
  {
    id: "phytophthora-infestans",
    commonName: "Domates ve Patates Geç Yanıklığı (Mildiyö)",
    scientificName: "Phytophthora infestans",
    kind: "hastalik",
    affectedFamilies: ["Solanaceae"],
    symptoms:
      "Yapraklarda ve gövdelerde nemli koşullarda beyaz sporlanma ('kav') ile çevrili koyu renkli lekeler oluşur. Domates meyvelerinde çürüme, patates yumrularında kahverengi-kırmızımsı iç çürüklük görülür; enfeksiyondan 3-6 gün sonra belirtiler ortaya çıkar ve hastalık hızla tüm tarlayı etkileyebilir.",
    management:
      "Dayanıklı çeşitler ekilmeli; enfekteli yumru/meyveler gömülerek imha edilmeli, Solanaceae familyasıyla en az 3 yıl münavebe uygulanmalı, düzenli gözlem (scouting) yapılmalı, gerektiğinde onaylı (organik üretimde bakır bazlı gibi) fungisitler kullanılmalıdır.",
    sourceOrg: "Cornell University CALS — Plant Pathology and Plant-Microbe Biology Section",
    sourceFile: "Cornell_LateBlight_Factsheet.pdf",
  },
  {
    id: "erwinia-tracheiphila",
    commonName: "Kabakgillerde Bakteriyel Solgunluk",
    scientificName: "Erwinia tracheiphila",
    kind: "hastalik",
    affectedFamilies: ["Cucurbitaceae"],
    symptoms:
      "Hastalık tek bir yaprağın aniden solup donuk yeşile dönmesiyle başlar; solgunluk sürgün boyunca yayılır, yapraklar kahverengileşip ölür, sonunda tüm bitki kurur. Kesilen gövde/sapta beyazımsı bakteriyel sızıntı (mukus ipliği) tipiktir. Salatalık, kabak, kavun ve balkabağını etkiler; karpuz bu hastalığa bağışıktır.",
    management:
      "Etken çizgili/benekli kabak böceklerinin sindirim sisteminde kışlar ve böcek ısırığı yoluyla bulaşır; mücadele böcek vektör kontrolüne dayanır — fide döneminde tül/tülbentle koruma, neem yağı/böcek sabunu/piretrin bazlı ürünlerle haftalık uygulama, dayanıklı çeşit ve karpuz gibi bağışık türlerle rotasyon.",
    sourceOrg: "Cornell University CALS — Plant Disease Diagnostic Clinic",
    sourceFile: "Cornell_PlantClinic_BacterialWilt_Cucurbits.pdf",
  },
  {
    id: "aphids-genel",
    commonName: "Yaprak Bitleri (Afidler)",
    scientificName: "Aphididae (Aphis fabae, Aphis gossypii, Myzus persicae, Macrosiphum euphorbiae, Brevicoryne brassicae vb.)",
    kind: "zararli",
    affectedFamilies: ["Solanaceae", "Brassicaceae", "Cucurbitaceae", "Fabaceae", "Apiaceae", "Chenopodiaceae", "Asteraceae", "Poaceae"],
    symptoms:
      "Bitki özsuyunu emerek yapraklarda sararma, kıvrılma ve sürgünlerde büyüme geriliğine yol açar; bol miktarda bal özü salgılayarak kurum küfü oluşumuna neden olurlar. Virüs taşıyıcılığı yaparak benek, sararma ve büyüme geriliğine sebep olabilirler.",
    management:
      "Doğal düşmanların (uğur böcekleri, parazitoid arılar) korunması esastır; geniş spektrumlu pestisitlerden kaçınılmalı. Düzenli izleme, su püskürtmesiyle mekanik temizlik, aşırı azotlu gübrelemeden kaçınma, yansıtıcı malç; gerektiğinde insektisit sabunları ve neem/kanola yağları en az zararlı seçeneklerdir.",
    sourceOrg: "University of California Statewide IPM Program (UC IPM)",
    sourceFile: "UCIPM_PestNote_Aphids.pdf",
  },
  {
    id: "tetranychus-urticae",
    commonName: "İki Noktalı Kırmızı Örümcek Akarı",
    scientificName: "Tetranychus urticae Koch",
    kind: "zararli",
    affectedFamilies: ["Solanaceae", "Cucurbitaceae", "Fabaceae", "Asteraceae"],
    symptoms:
      "Beslenme, yaprak altında ince, açık yeşil noktalanma (stippling) şeklinde başlar; ilerledikçe sararma, bronzlaşma görülür. Ağır bulaşmalarda ince ipeksi ağlar oluşur, bitki gücünü kaybeder, şiddetli durumlarda ölebilir. Sıcak, kurak ve tozlu koşullarda hızla çoğalır.",
    management:
      "Haftalık düzenli gözlem erken tespit için şarttır. Dengeli sulama/gübreleme, yabani ot temizliği, yeni fidelerin karantinaya alınması; biyolojik mücadelede Phytoseiulus persimilis, Neoseiulus californicus gibi avcı akarlar; gerekirse bahçıvanlık/neem yağı ve potasyum yağ asidi sabunu, farklı etki mekanizması gruplarının rotasyonuyla kullanılabilir.",
    sourceOrg: "Texas A&M AgriLife Extension Service",
    sourceFile: "TAMU_AgriLife_TwospottedSpiderMite.pdf",
  },
];

/** Bir ürünün familyasına göre onu etkileyebilecek zararlı/hastalıkları döner (familya eş anlamlıları normalize edilir). */
export function pestsForCrop(crop: Crop): PestDiseaseProfile[] {
  const cropFamily = normalizeFamily(crop.family);
  return PEST_DISEASE_PROFILES.filter((p) => p.affectedFamilies.some((f) => normalizeFamily(f) === cropFamily));
}

export function pestsByKind(kind: PestKind): PestDiseaseProfile[] {
  return PEST_DISEASE_PROFILES.filter((p) => p.kind === kind);
}

export const PEST_KIND_LABELS: Record<PestKind, string> = {
  zararli: "Zararlı",
  hastalik: "Hastalık",
};
