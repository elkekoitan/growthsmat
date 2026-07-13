// SmartGrowth OS — Mikro filiz fotoğrafı lisans kataloğu (crop-photos'un mikro filiz eşleniği)
// Kaynak: assets/microgreen-photos/index.csv (Wikimedia Commons/Flickr, CC BY/CC BY-SA;
// tamamı ticari kullanıma açık). Otomatik üretildi:
// npm run import-microgreen-photos (scripts/import-microgreen-photos.mjs) — elle düzenleme YAPMA.
//
// DÜRÜSTLÜK NOTU: checksumSha256/checksumVerified kaynak CSV'de vardı ama önceden buraya
// taşınmıyordu (dosya başlığı "checksum doğrulanmış" diyordu, hiçbir yerde saklanmıyordu —
// dokümantasyon incelemesinde bulundu, photoCredits.ts ile aynı düzeltme uygulandı).

export interface MicrogreenPhotoCredit {
  microgreenId: string;
  role: "primary" | "secondary";
  filename: string;
  speciesLabel: string;
  growthStageOrSubject: string;
  creator: string;
  sourceUrl: string;
  license: string;
  attributionText: string;
  checksumSha256: string;
  checksumVerified: boolean;
}

export const MICROGREEN_PHOTO_CREDITS: MicrogreenPhotoCredit[] = [
  {
    "microgreenId": "brokoli",
    "role": "primary",
    "filename": "broccoli_microgreens_harvest_ready.jpg",
    "speciesLabel": "Broccoli (Brassica oleracea var. italica)",
    "growthStageOrSubject": "Harvest-ready tray",
    "creator": "anotherdaysjourney",
    "sourceUrl": "https://www.flickr.com/photos/27560524@N03/52541632995",
    "license": "CC BY 2.0",
    "attributionText": "\"Tray of broccoli microgreens\" by anotherdaysjourney is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/",
    "checksumSha256": "9f77723f4d27c7906d998ffb8b210913742dab2d30ce0cb752d5665b6c8522d8",
    "checksumVerified": true
  },
  {
    "microgreenId": "turp",
    "role": "primary",
    "filename": "radish_microgreens_harvest_ready.jpg",
    "speciesLabel": "Radish (Raphanus sativus, Daikon)",
    "growthStageOrSubject": "Harvest-ready",
    "creator": "Pannet",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Микрозелень_редьки_Дайкон.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Микрозелень редьки Дайкон\" (Daikon radish microgreens) by Pannet, licensed CC BY-SA 4.0",
    "checksumSha256": "dc5ee477922029cfd6d531872fc82af051546a960870b2973102207475ceead9",
    "checksumVerified": true
  },
  {
    "microgreenId": "hardal",
    "role": "primary",
    "filename": "mustard_microgreens_harvest_ready.jpg",
    "speciesLabel": "Mustard (Brassica juncea)",
    "growthStageOrSubject": "Harvest-ready",
    "creator": "katerha",
    "sourceUrl": "https://www.flickr.com/photos/8489692@N03/33049237124",
    "license": "CC BY 2.0",
    "attributionText": "\"Mustard microgreens\" by katerha is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/",
    "checksumSha256": "82460fb1e61f42637a9ee95e7a46b9379177ed0e389edcbfa32cf902b45a00c2",
    "checksumVerified": true
  },
  {
    "microgreenId": "aycicegi",
    "role": "primary",
    "filename": "sunflower_microgreens_harvest_ready.jpg",
    "speciesLabel": "Sunflower (Helianthus annuus)",
    "growthStageOrSubject": "Harvest-ready",
    "creator": "Pannet",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sunflower_microgreens_01.jpg",
    "license": "CC BY 4.0",
    "attributionText": "\"Sunflower microgreens\" by Pannet, licensed CC BY 4.0",
    "checksumSha256": "3d4b599ffd9b9193b5d6553e5ded0b1cbb59ce91bc306d3359721e3ff770ef45",
    "checksumVerified": true
  },
  {
    "microgreenId": "bezelye",
    "role": "primary",
    "filename": "pea_seed_germination.jpg",
    "speciesLabel": "Pea shoots (Pisum sativum)",
    "growthStageOrSubject": "Seed germination / seedling stage",
    "creator": "Jun Seita",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pisum_sativum_seedling_(8755683513).jpg",
    "license": "CC BY 2.0",
    "attributionText": "\"Pisum sativum seedling\" by Jun Seita (Palo Alto, CA, US), licensed CC BY 2.0",
    "checksumSha256": "869da081c9e6bf50b519e13ebfe9e15cf6c555059856347e23dc1cd244e6627d",
    "checksumVerified": true
  },
  {
    "microgreenId": "roka",
    "role": "primary",
    "filename": "arugula_microgreens_harvest_ready.jpg",
    "speciesLabel": "Arugula (Eruca sativa)",
    "growthStageOrSubject": "Harvest-ready tray",
    "creator": "Jnzl's Photos",
    "sourceUrl": "https://www.flickr.com/photos/102748040@N03/19988195996",
    "license": "CC BY 2.0",
    "attributionText": "\"Microgreens rocket\" by Jnzl's Photos is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/",
    "checksumSha256": "fb28a78cbe2d03f1b6b2d596e11c71892fe87425740100e6ed41c2f53e971463",
    "checksumVerified": true
  },
  {
    "microgreenId": "feslegen",
    "role": "primary",
    "filename": "basil_microgreens_greening.jpg",
    "speciesLabel": "Basil (Ocimum basilicum)",
    "growthStageOrSubject": "Greening stage (potted sprouts on windowsill)",
    "creator": "Jon Eben Field",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pot_of_basil_sprouts_(Ocimum_basilicum)_-_20050422.jpg",
    "license": "CC BY 2.0",
    "attributionText": "\"A pot of basil sprouts (Ocimum basilicum) on a windowsill\" by Jon Eben Field (Vancouver, British Columbia, Canada), licensed CC BY 2.0",
    "checksumSha256": "1bb005ac2f7f602b775c7f44e31e29a5f6642c9991f0dff4116b7824ff8c094e",
    "checksumVerified": true
  },
  {
    "microgreenId": "kisnis",
    "role": "primary",
    "filename": "cilantro_microgreens_greening.jpg",
    "speciesLabel": "Cilantro / Coriander (Coriandrum sativum)",
    "growthStageOrSubject": "Greening stage (sprouts); species identification rests on the original photographer's own caption rather than independent botanical confirmation -- see report.md gap #8",
    "creator": "Joybot",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coriander_sprouts_(5893242387).jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "\"Coriander sprouts\" by Joybot, licensed CC BY-SA 2.0",
    "checksumSha256": "3678bc4bad7cab73383ae4d5615bfd9b69eee0b3fa15e4b22b8942edb2693e84",
    "checksumVerified": true
  },
  {
    "microgreenId": "amarant",
    "role": "primary",
    "filename": "amaranth_microgreens_color_development.jpg",
    "speciesLabel": "Amaranth (Amaranthus cruentus / A. tricolor)",
    "growthStageOrSubject": "Color-development stage (pigmentation visible); stage label is the researcher's own visual assessment via direct image review -- the USDA/NRCS source provides only a generic photo ID, no stage caption",
    "creator": "USDAgov (NRCS) via Flickr",
    "sourceUrl": "https://www.flickr.com/photos/41284017@N08/50534942263",
    "license": "Public Domain Mark 1.0",
    "attributionText": "\"20201021-NRCS-LSC-0456\" by USDAgov is marked with Public Domain Mark 1.0. https://creativecommons.org/publicdomain/mark/1.0/",
    "checksumSha256": "2985961384dd5a114c49648f8382ed5da027c02f276d5d8e3067e9f0b9455e97",
    "checksumVerified": true
  },
  {
    "microgreenId": "pak-choi",
    "role": "primary",
    "filename": "pakchoi_seedlings_hydroponic_greenhouse.jpg",
    "speciesLabel": "Pak choi / bok choy (Brassica rapa subsp. chinensis)",
    "growthStageOrSubject": "Seedling stage in a hydroponics greenhouse tray (labeled 'Brassica rapa var. chinensis' by photographer; var./subsp. naming variation noted in report)",
    "creator": "Forest and Kim Starr",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Starr-150326-0887-Brassica_rapa_var_chinensis-seedlings_in_Hydroponics_greenhouse-Town_Sand_Island-Midway_Atoll_(24971491710).jpg",
    "license": "CC BY 3.0 US",
    "attributionText": "\"Brassica rapa var. chinensis (Bok choi, pak choi, pak choy, pok choi) - Seedlings in Hydroponics greenhouse, Town Sand Island, Midway Atoll\" by Forest and Kim Starr, licensed CC BY 3.0 US",
    "checksumSha256": "5ec9598f6bafcd7bf61b581b6e01be93059f98faf33b9b8acd8e27ba155f7ccc",
    "checksumVerified": true
  },
  {
    "microgreenId": "pazi-mikrofiliz",
    "role": "primary",
    "filename": "swisschard_baby_seedlings_closeup.jpg",
    "speciesLabel": "Swiss chard (Beta vulgaris subsp. vulgaris, Cicla/Flavescens Group)",
    "growthStageOrSubject": "Baby seedling stage, close-up",
    "creator": "edibleoffice",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Swiss-Chard-Seedlings_1641.JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Baby swiss chard (seedlings)\" by edibleoffice, licensed CC BY-SA 4.0",
    "checksumSha256": "7757cb8dc78aa5c3143b14449aadd5474bf34999f228c4b07ec93a804e96edfe",
    "checksumVerified": true
  },
  {
    "microgreenId": "kirmizi-lahana",
    "role": "primary",
    "filename": "redcabbage_microgreens_usda_ars.jpg",
    "speciesLabel": "Red cabbage (Brassica oleracea var. capitata f. rubra)",
    "growthStageOrSubject": "Harvested microgreens, official USDA ARS research photo",
    "creator": "Peggy Greb (USDA Agricultural Research Service)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Red_Cabbage_Microgreens.jpg",
    "license": "Public Domain (US government work)",
    "attributionText": "\"Red cabbage microgreens\" by Peggy Greb, USDA ARS (image ID d3089-2), public domain",
    "checksumSha256": "de0cef147cb8faadbf35084aea04b724fcc3ffa5ef05455bf4ad62ff36f9b30d",
    "checksumVerified": true
  },
  {
    "microgreenId": "rezene",
    "role": "primary",
    "filename": "fennel_seedling_tray_greenhouse.jpg",
    "speciesLabel": "Fennel (Foeniculum vulgare)",
    "growthStageOrSubject": "Tray of seedlings growing in a greenhouse (garden-scale, not a commercial microgreens facility)",
    "creator": "Kolforn",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:-2020-06-29_Fennel_seedlings_(Foeniculum),_Trimingham.JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"A tray of fennel seedlings growing in a greenhouse in a garden in the village of Trimingham, Norfolk, England\" by Kolforn, licensed CC BY-SA 4.0",
    "checksumSha256": "9457363cadca0e6ce21eb76627d1b05a1d87c98c5705a449d1d38643ae07f990",
    "checksumVerified": true
  },
  {
    "microgreenId": "dereotu",
    "role": "primary",
    "filename": "dill_sprouts_closeup_view.jpg",
    "speciesLabel": "Dill (Anethum graveolens)",
    "growthStageOrSubject": "Sprout stage, close-up (original Ukrainian caption: dill sprouts)",
    "creator": "Ата (Ata)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sprouts_of_dill.jpg",
    "license": "CC0 1.0 (Public Domain Dedication)",
    "attributionText": "\"Sprouts of dill\" by Ata, dedicated to the public domain (CC0 1.0)",
    "checksumSha256": "a5a8286d4d1a86097b0d2b0d7774cad7f0c00071c931f9aabd7c60184e4443b0",
    "checksumVerified": true
  },
  {
    "microgreenId": "frenk-sogani",
    "role": "primary",
    "filename": "chives_seedlings_sprouting_stage.jpg",
    "speciesLabel": "Chives (Allium schoenoprasum)",
    "growthStageOrSubject": "Seedling/sprouting stage",
    "creator": "Norman21",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chive_seedlings_sprouting.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "\"Photograph of chive seedlings sprouting\" by Norman21, licensed CC BY-SA 3.0",
    "checksumSha256": "dec04fa321e994119c82d911b5e8ec43bde17b32b9e6cf0b552883fff3ad2728",
    "checksumVerified": true
  },
  {
    "microgreenId": "pancar",
    "role": "primary",
    "filename": "beet_microgreens_grower_photo.jpg",
    "speciesLabel": "Beet / beetroot (Beta vulgaris subsp. vulgaris, Crassa/Conditiva Group)",
    "growthStageOrSubject": "Harvested/growing microgreens (grower-submitted photo); low resolution (540x540)",
    "creator": "Katygreen4",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Beet_microgreens.jpg",
    "license": "CC BY 4.0",
    "attributionText": "\"beet microgreens\" by Katygreen4, licensed CC BY 4.0",
    "checksumSha256": "a21326d6dc6b244d2ce73f201298b269b40ddb0b829bc9e12bf046f8b2ad2800",
    "checksumVerified": true
  },
  {
    "microgreenId": "kereviz-mikrofiliz",
    "role": "primary",
    "filename": "celery_seedlings_recycled_pots_planting.jpg",
    "speciesLabel": "Celery (Apium graveolens)",
    "growthStageOrSubject": "Seedling stage, planted in recycled pots",
    "creator": "Badak Ironman",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celery_seedlings_planted_in_recycled_pots.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Celery seedlings planted in recycled pots\" by Badak Ironman, licensed CC BY-SA 4.0",
    "checksumSha256": "71612101383e502aa1cf91dc0d07783885c555bc81507832267a8d22332dd296",
    "checksumVerified": true
  },
  {
    "microgreenId": "maydanoz-mikrofiliz",
    "role": "primary",
    "filename": "parsley_12days_growth_stage_reference.jpg",
    "speciesLabel": "Parsley (Petroselinum crispum)",
    "growthStageOrSubject": "12 days old (per original caption) -- directly within the microgreen harvest-age range",
    "creator": "Pawelmb (assumed; no machine-readable author provided, based on copyright claims)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pietruszka.parsley.12days.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "\"Parsley, Pietruszka zwyczajna, Petroselinum sativum, 12 days old\" by Pawelmb (assumed), licensed CC BY-SA 3.0",
    "checksumSha256": "7e1786e226407ae4a8df1a1e99b3bd6a615dc5ccc3c1b479b9f099534bc95885",
    "checksumVerified": true
  },
  {
    "microgreenId": "kale",
    "role": "primary",
    "filename": "kale-mixed-microgreens-tray-katerha-flickr.jpg",
    "speciesLabel": "Kale (Brassica oleracea var. sabellica/acephala)",
    "growthStageOrSubject": "TRUE microgreen stage -- CAVEAT: mixed tray (broccoli+kale+purple kohlrabi+red cabbage), kale confirmed present but not kale-exclusive",
    "creator": "Kate Ter Haar",
    "sourceUrl": "https://www.flickr.com/photos/katerha/49879739643/",
    "license": "CC BY 2.0",
    "attributionText": "Not blooms but a bouquet of micro greens by Kate Ter Haar, CC BY 2.0",
    "checksumSha256": "13b15010831a101fd204d55a06c18b8d9f08c2d1f024c543b6d8ee307b5f40cd",
    "checksumVerified": true
  },
  {
    "microgreenId": "misir-filizi",
    "role": "primary",
    "filename": "corn-shoots-misir-filizleri-01-cebeci-wikimedia.jpg",
    "speciesLabel": "Corn shoots / Misir filizi (Zea mays)",
    "growthStageOrSubject": "Young shoot stage (2-3 leaf, ~10-15cm) -- CAVEAT: field/soil-grown, not literally tray-grown; closest honest proxy found",
    "creator": "Zeynel Cebeci",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Corn_shoots_-_M%C4%B1s%C4%B1r_filizleri_01.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Corn shoots - Misir filizleri by Zeynel Cebeci, CC BY-SA 4.0",
    "checksumSha256": "12d5059c2fd3db0ffd8a689ccaae6fb7812d2a17f32be71596cd9430e029e104",
    "checksumVerified": true
  },
  {
    "microgreenId": "shiso",
    "role": "primary",
    "filename": "shiso-red-sprouts-day10-mika-flickr.jpg",
    "speciesLabel": "Shiso / Perilla (Perilla frutescens)",
    "growthStageOrSubject": "TRUE microgreen stage confirmed -- day ~10 per photographer caption, cotyledons + emerging red true leaves",
    "creator": "Mika",
    "sourceUrl": "https://www.flickr.com/photos/soulfish/26311400023/",
    "license": "CC BY-SA 2.0",
    "attributionText": "Red shiso sprouts by Mika, CC BY-SA 2.0",
    "checksumSha256": "3763b19b400d5be37e6f07761771e37fce44d3bc902ca5a5156a53fbc53c74db",
    "checksumVerified": true
  },
  {
    "microgreenId": "tatsoi",
    "role": "primary",
    "filename": "tatsoi-microgreen-tray-cahabaclub.jpg",
    "speciesLabel": "Tatsoi (Brassica rapa var. rosularis)",
    "growthStageOrSubject": "TRUE microgreen stage -- dense harvest-density cotyledon tray. Low-res (476x335), fine for thumbnails only",
    "creator": "Cahaba Club Micro Greens",
    "sourceUrl": "https://www.flickr.com/photos/cahabaclubherbs/8549118285/",
    "license": "CC BY-SA 2.0",
    "attributionText": "At Micro Tatsoi by Cahaba Club Micro Greens, CC BY-SA 2.0",
    "checksumSha256": "ff08397c11bbe6a465682cab9ff070301c4a49b9295d75db181bfcb566e2cdb8",
    "checksumVerified": true
  },
  {
    "microgreenId": "alabas",
    "role": "primary",
    "filename": "alabas-cotyledon-tray-schlaghecken.jpg",
    "speciesLabel": "Purple kohlrabi (Brassica oleracea var. gongylodes)",
    "growthStageOrSubject": "TRUE cotyledon stage, multi-cell propagation tray, top-down -- CAVEAT: purple cultivar not visually confirmed from this angle",
    "creator": "Josef Schlaghecken",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kohlrabi_Keimlinge_in_EPT--Josef_Schlaghecken.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Kohlrabi Keimlinge in EPT by Josef Schlaghecken, CC BY-SA 4.0",
    "checksumSha256": "b0a49fc8b88279a6d3909b0e528f148127b3a5a963f617498540c9e4cc402306",
    "checksumVerified": true
  },
  {
    "microgreenId": "latin-cicegi",
    "role": "primary",
    "filename": "latin-cicegi-seedling-tray-amandaslater.jpg",
    "speciesLabel": "Nasturtium (Tropaeolum majus)",
    "growthStageOrSubject": "TRUE seedling stage, multiple plants in cell tray, cotyledons + first true leaves",
    "creator": "Amanda Slater",
    "sourceUrl": "https://www.flickr.com/photos/pikerslanefarm/2399065606/",
    "license": "CC BY-SA 2.0",
    "attributionText": "April 8th Nasturtium Seedlings by Amanda Slater, CC BY-SA 2.0",
    "checksumSha256": "627a2b0fd32f0c531b45846791f6154ddaaf5b59df6d1191a94ae9f0cd150eb2",
    "checksumVerified": true
  },
  {
    "microgreenId": "karabugday",
    "role": "primary",
    "filename": "buckwheat-microgreens-tray-cluster-flickr-cc0.jpg",
    "speciesLabel": "Buckwheat lettuce/microgreens (Fagopyrum esculentum)",
    "growthStageOrSubject": "TRUE microgreen stage -- dense cluster, thin stems, small cotyledons, harvest-ready",
    "creator": "Mary Jane Duford (Home For The Harvest)",
    "sourceUrl": "https://www.flickr.com/photos/149811903@N04/33786277020",
    "license": "CC0 1.0",
    "attributionText": "Buckwheat Microgreens by Mary Jane Duford, CC0",
    "checksumSha256": "b7863647941e4dd8c2b9b6df90dd8883f4a85cc9ffd9a68a2747eda682f80d8c",
    "checksumVerified": true
  },
  {
    "microgreenId": "kuzukulagi",
    "role": "primary",
    "filename": "rumex-acetosa-sorrel-seedling-cluster-wikimedia-ccbysa.jpg",
    "speciesLabel": "Sorrel (Rumex acetosa)",
    "growthStageOrSubject": "TRUE cotyledon/seedling stage, cluster of 3 -- CAVEAT: garden soil, not literal microgreen tray",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rumex_acetosa_kz02.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Rumex acetosa seedlings by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0",
    "checksumSha256": "404ce74fae7226e69d3f0f81f4512983f751ceb97aea8b81e8bd225f21048ce5",
    "checksumVerified": true
  },
  {
    "microgreenId": "kizil-kuzukulagi",
    "role": "primary",
    "filename": "rumex-sanguineus-red-veined-sorrel-seedling-cluster-wikimedia-ccbysa.jpg",
    "speciesLabel": "Red-veined sorrel (Rumex sanguineus)",
    "growthStageOrSubject": "TRUE cotyledon/seedling stage, cluster of 5-6, shows characteristic red veining -- CAVEAT: botanical garden soil, not literal tray",
    "creator": "Agnieszka Kwiecien, Nova",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rumex_sanguineus_Szczaw_gajowy_2019-05-10_05.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Wood Dock seedlings, Wroclaw University Botanical Garden, by Agnieszka Kwiecien, Nova, CC BY-SA 4.0",
    "checksumSha256": "3e066e2d5585d6f0c7ad4b570050819fc3efb090f18d2b2c75e1ccbe2a8d1bd6",
    "checksumVerified": true
  },
  {
    "microgreenId": "hodan",
    "role": "primary",
    "filename": "borago-officinalis-microgreen-seedling-primary.jpg",
    "speciesLabel": "Borage (Borago officinalis)",
    "growthStageOrSubject": "TRUE cotyledon stage, two hairy cotyledons, no true leaves, from soil",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Borago_officinalis_kz08.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Borago officinalis kz08 by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0",
    "checksumSha256": "6239a30975bf6a7e187eda94e8cfea2424604fa1ddbe05a711a27267f31623f0",
    "checksumVerified": true
  },
  {
    "microgreenId": "semizotu",
    "role": "primary",
    "filename": "portulaca-oleracea-microgreen-seedling-primary.jpg",
    "speciesLabel": "Purslane (Portulaca oleracea)",
    "growthStageOrSubject": "TRUE seedling stage macro, reddish succulent stem base, fleshy cotyledons",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Portulaca_oleracea_kz02.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Portulaca oleracea kz02 by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0",
    "checksumSha256": "2fad8df9b59cea872024d1d1f312c3bb72d1853bb5076ce05d0e804ec8cd495f",
    "checksumVerified": true
  }
];

/** Bir mikro filizin birincil (kart/detay) görselinin kredi bilgisini döner. */
export function primaryMicrogreenCredit(microgreenId: string): MicrogreenPhotoCredit | undefined {
  return MICROGREEN_PHOTO_CREDITS.find((c) => c.microgreenId === microgreenId && c.role === "primary");
}

/** Bir mikro filizin /photos/microgreens/ altındaki birincil görsel yolu (varsa). */
export function microgreenPhotoPath(microgreenId: string): string | undefined {
  return primaryMicrogreenCredit(microgreenId) ? `/photos/microgreens/${microgreenId}.jpg` : undefined;
}
