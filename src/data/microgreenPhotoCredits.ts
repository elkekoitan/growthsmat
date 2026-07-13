// SmartGrowth OS — Mikro filiz fotoğrafı lisans kataloğu (crop-photos'un mikro filiz eşleniği)
// Kaynak: assets/microgreen-photos/index.csv (Wikimedia Commons/Flickr, CC BY/CC BY-SA;
// tamamı ticari kullanıma açık, checksum doğrulanmış). Otomatik üretildi:
// npm run import-microgreen-photos (scripts/import-microgreen-photos.mjs) — elle düzenleme YAPMA.

export interface MicrogreenPhotoCredit {
  microgreenId: string;
  role: "primary" | "secondary";
  filename: string;
  creator: string;
  sourceUrl: string;
  license: string;
  attributionText: string;
}

export const MICROGREEN_PHOTO_CREDITS: MicrogreenPhotoCredit[] = [
  {
    "microgreenId": "brokoli",
    "role": "primary",
    "filename": "broccoli_microgreens_harvest_ready.jpg",
    "creator": "anotherdaysjourney",
    "sourceUrl": "https://www.flickr.com/photos/27560524@N03/52541632995",
    "license": "CC BY 2.0",
    "attributionText": "\"Tray of broccoli microgreens\" by anotherdaysjourney is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "microgreenId": "turp",
    "role": "primary",
    "filename": "radish_microgreens_harvest_ready.jpg",
    "creator": "Pannet",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Микрозелень_редьки_Дайкон.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Микрозелень редьки Дайкон\" (Daikon radish microgreens) by Pannet, licensed CC BY-SA 4.0"
  },
  {
    "microgreenId": "hardal",
    "role": "primary",
    "filename": "mustard_microgreens_harvest_ready.jpg",
    "creator": "katerha",
    "sourceUrl": "https://www.flickr.com/photos/8489692@N03/33049237124",
    "license": "CC BY 2.0",
    "attributionText": "\"Mustard microgreens\" by katerha is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "microgreenId": "aycicegi",
    "role": "primary",
    "filename": "sunflower_microgreens_harvest_ready.jpg",
    "creator": "Pannet",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sunflower_microgreens_01.jpg",
    "license": "CC BY 4.0",
    "attributionText": "\"Sunflower microgreens\" by Pannet, licensed CC BY 4.0"
  },
  {
    "microgreenId": "bezelye",
    "role": "primary",
    "filename": "pea_seed_germination.jpg",
    "creator": "Jun Seita",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pisum_sativum_seedling_(8755683513).jpg",
    "license": "CC BY 2.0",
    "attributionText": "\"Pisum sativum seedling\" by Jun Seita (Palo Alto, CA, US), licensed CC BY 2.0"
  },
  {
    "microgreenId": "roka",
    "role": "primary",
    "filename": "arugula_microgreens_harvest_ready.jpg",
    "creator": "Jnzl's Photos",
    "sourceUrl": "https://www.flickr.com/photos/102748040@N03/19988195996",
    "license": "CC BY 2.0",
    "attributionText": "\"Microgreens rocket\" by Jnzl's Photos is licensed under CC BY 2.0. https://creativecommons.org/licenses/by/2.0/"
  },
  {
    "microgreenId": "feslegen",
    "role": "primary",
    "filename": "basil_microgreens_greening.jpg",
    "creator": "Jon Eben Field",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pot_of_basil_sprouts_(Ocimum_basilicum)_-_20050422.jpg",
    "license": "CC BY 2.0",
    "attributionText": "\"A pot of basil sprouts (Ocimum basilicum) on a windowsill\" by Jon Eben Field (Vancouver, British Columbia, Canada), licensed CC BY 2.0"
  },
  {
    "microgreenId": "kisnis",
    "role": "primary",
    "filename": "cilantro_microgreens_greening.jpg",
    "creator": "Joybot",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coriander_sprouts_(5893242387).jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "\"Coriander sprouts\" by Joybot, licensed CC BY-SA 2.0"
  },
  {
    "microgreenId": "amarant",
    "role": "primary",
    "filename": "amaranth_microgreens_color_development.jpg",
    "creator": "USDAgov (NRCS) via Flickr",
    "sourceUrl": "https://www.flickr.com/photos/41284017@N08/50534942263",
    "license": "Public Domain Mark 1.0",
    "attributionText": "\"20201021-NRCS-LSC-0456\" by USDAgov is marked with Public Domain Mark 1.0. https://creativecommons.org/publicdomain/mark/1.0/"
  },
  {
    "microgreenId": "pak-choi",
    "role": "primary",
    "filename": "pakchoi_seedlings_hydroponic_greenhouse.jpg",
    "creator": "Forest and Kim Starr",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Starr-150326-0887-Brassica_rapa_var_chinensis-seedlings_in_Hydroponics_greenhouse-Town_Sand_Island-Midway_Atoll_(24971491710).jpg",
    "license": "CC BY 3.0 US",
    "attributionText": "\"Brassica rapa var. chinensis (Bok choi, pak choi, pak choy, pok choi) - Seedlings in Hydroponics greenhouse, Town Sand Island, Midway Atoll\" by Forest and Kim Starr, licensed CC BY 3.0 US"
  },
  {
    "microgreenId": "pazi-mikrofiliz",
    "role": "primary",
    "filename": "swisschard_baby_seedlings_closeup.jpg",
    "creator": "edibleoffice",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Swiss-Chard-Seedlings_1641.JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Baby swiss chard (seedlings)\" by edibleoffice, licensed CC BY-SA 4.0"
  },
  {
    "microgreenId": "kirmizi-lahana",
    "role": "primary",
    "filename": "redcabbage_microgreens_usda_ars.jpg",
    "creator": "Peggy Greb (USDA Agricultural Research Service)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Red_Cabbage_Microgreens.jpg",
    "license": "Public Domain (US government work)",
    "attributionText": "\"Red cabbage microgreens\" by Peggy Greb, USDA ARS (image ID d3089-2), public domain"
  },
  {
    "microgreenId": "rezene",
    "role": "primary",
    "filename": "fennel_seedling_tray_greenhouse.jpg",
    "creator": "Kolforn",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:-2020-06-29_Fennel_seedlings_(Foeniculum),_Trimingham.JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"A tray of fennel seedlings growing in a greenhouse in a garden in the village of Trimingham, Norfolk, England\" by Kolforn, licensed CC BY-SA 4.0"
  },
  {
    "microgreenId": "dereotu",
    "role": "primary",
    "filename": "dill_sprouts_closeup_view.jpg",
    "creator": "Ата (Ata)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sprouts_of_dill.jpg",
    "license": "CC0 1.0 (Public Domain Dedication)",
    "attributionText": "\"Sprouts of dill\" by Ata, dedicated to the public domain (CC0 1.0)"
  },
  {
    "microgreenId": "frenk-sogani",
    "role": "primary",
    "filename": "chives_seedlings_sprouting_stage.jpg",
    "creator": "Norman21",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chive_seedlings_sprouting.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "\"Photograph of chive seedlings sprouting\" by Norman21, licensed CC BY-SA 3.0"
  },
  {
    "microgreenId": "pancar",
    "role": "primary",
    "filename": "beet_microgreens_grower_photo.jpg",
    "creator": "Katygreen4",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Beet_microgreens.jpg",
    "license": "CC BY 4.0",
    "attributionText": "\"beet microgreens\" by Katygreen4, licensed CC BY 4.0"
  },
  {
    "microgreenId": "kereviz-mikrofiliz",
    "role": "primary",
    "filename": "celery_seedlings_recycled_pots_planting.jpg",
    "creator": "Badak Ironman",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Celery_seedlings_planted_in_recycled_pots.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "\"Celery seedlings planted in recycled pots\" by Badak Ironman, licensed CC BY-SA 4.0"
  },
  {
    "microgreenId": "maydanoz-mikrofiliz",
    "role": "primary",
    "filename": "parsley_12days_growth_stage_reference.jpg",
    "creator": "Pawelmb (assumed; no machine-readable author provided, based on copyright claims)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Pietruszka.parsley.12days.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "\"Parsley, Pietruszka zwyczajna, Petroselinum sativum, 12 days old\" by Pawelmb (assumed), licensed CC BY-SA 3.0"
  },
  {
    "microgreenId": "kale",
    "role": "primary",
    "filename": "kale-mixed-microgreens-tray-katerha-flickr.jpg",
    "creator": "Kate Ter Haar",
    "sourceUrl": "https://www.flickr.com/photos/katerha/49879739643/",
    "license": "CC BY 2.0",
    "attributionText": "Not blooms but a bouquet of micro greens by Kate Ter Haar, CC BY 2.0"
  },
  {
    "microgreenId": "misir-filizi",
    "role": "primary",
    "filename": "corn-shoots-misir-filizleri-01-cebeci-wikimedia.jpg",
    "creator": "Zeynel Cebeci",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Corn_shoots_-_M%C4%B1s%C4%B1r_filizleri_01.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Corn shoots - Misir filizleri by Zeynel Cebeci, CC BY-SA 4.0"
  },
  {
    "microgreenId": "shiso",
    "role": "primary",
    "filename": "shiso-red-sprouts-day10-mika-flickr.jpg",
    "creator": "Mika",
    "sourceUrl": "https://www.flickr.com/photos/soulfish/26311400023/",
    "license": "CC BY-SA 2.0",
    "attributionText": "Red shiso sprouts by Mika, CC BY-SA 2.0"
  },
  {
    "microgreenId": "tatsoi",
    "role": "primary",
    "filename": "tatsoi-microgreen-tray-cahabaclub.jpg",
    "creator": "Cahaba Club Micro Greens",
    "sourceUrl": "https://www.flickr.com/photos/cahabaclubherbs/8549118285/",
    "license": "CC BY-SA 2.0",
    "attributionText": "At Micro Tatsoi by Cahaba Club Micro Greens, CC BY-SA 2.0"
  },
  {
    "microgreenId": "alabas",
    "role": "primary",
    "filename": "alabas-cotyledon-tray-schlaghecken.jpg",
    "creator": "Josef Schlaghecken",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Kohlrabi_Keimlinge_in_EPT--Josef_Schlaghecken.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Kohlrabi Keimlinge in EPT by Josef Schlaghecken, CC BY-SA 4.0"
  },
  {
    "microgreenId": "latin-cicegi",
    "role": "primary",
    "filename": "latin-cicegi-seedling-tray-amandaslater.jpg",
    "creator": "Amanda Slater",
    "sourceUrl": "https://www.flickr.com/photos/pikerslanefarm/2399065606/",
    "license": "CC BY-SA 2.0",
    "attributionText": "April 8th Nasturtium Seedlings by Amanda Slater, CC BY-SA 2.0"
  },
  {
    "microgreenId": "karabugday",
    "role": "primary",
    "filename": "buckwheat-microgreens-tray-cluster-flickr-cc0.jpg",
    "creator": "Mary Jane Duford (Home For The Harvest)",
    "sourceUrl": "https://www.flickr.com/photos/149811903@N04/33786277020",
    "license": "CC0 1.0",
    "attributionText": "Buckwheat Microgreens by Mary Jane Duford, CC0"
  },
  {
    "microgreenId": "kuzukulagi",
    "role": "primary",
    "filename": "rumex-acetosa-sorrel-seedling-cluster-wikimedia-ccbysa.jpg",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rumex_acetosa_kz02.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Rumex acetosa seedlings by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0"
  },
  {
    "microgreenId": "kizil-kuzukulagi",
    "role": "primary",
    "filename": "rumex-sanguineus-red-veined-sorrel-seedling-cluster-wikimedia-ccbysa.jpg",
    "creator": "Agnieszka Kwiecien, Nova",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Rumex_sanguineus_Szczaw_gajowy_2019-05-10_05.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Wood Dock seedlings, Wroclaw University Botanical Garden, by Agnieszka Kwiecien, Nova, CC BY-SA 4.0"
  },
  {
    "microgreenId": "hodan",
    "role": "primary",
    "filename": "borago-officinalis-microgreen-seedling-primary.jpg",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Borago_officinalis_kz08.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Borago officinalis kz08 by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0"
  },
  {
    "microgreenId": "semizotu",
    "role": "primary",
    "filename": "portulaca-oleracea-microgreen-seedling-primary.jpg",
    "creator": "Krzysztof Ziarnek (Kenraiz)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Portulaca_oleracea_kz02.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Portulaca oleracea kz02 by Krzysztof Ziarnek, Kenraiz, CC BY-SA 4.0"
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
