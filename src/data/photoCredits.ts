// SmartGrowth OS — Ürün fotoğrafı lisans kataloğu (PRD P04-14 "Görsel lisans kataloğu")
// Kaynak: assets/crop-photos/index.csv (Wikimedia Commons, CC0/CC BY/CC BY-SA/kamu malı;
// tamamı ticari kullanıma açık, checksum doğrulanmış). Otomatik üretildi:
// npm run import-photos (scripts/import-crop-photos.mjs) — elle düzenleme YAPMA.
//
// isApproximation=true olan 2 üründe (biber-carliston, kabak-sakiz) birebir çeşit fotoğrafı
// bulunamadı — yakın akraba/analog görsel kullanıldı (sahte kesinlik yok: bu açıkça işaretli
// ve UI'da gösterilmeli).

export interface PhotoCredit {
  cropId: string;
  role: "primary" | "secondary";
  filename: string;
  creator: string;
  sourceUrl: string;
  license: string;
  attributionText: string;
  isApproximation: boolean;
}

export const PHOTO_CREDITS: PhotoCredit[] = [
  {
    "cropId": "cherry-domates-kompakt",
    "role": "primary",
    "filename": "tomato_04_harvest.jpg",
    "creator": "daSupremo",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Harvested_tomatoes.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "daSupremo, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "sirik-domates-beefsteak",
    "role": "primary",
    "filename": "brandywine_01_fruit.jpg",
    "creator": "Rennaux",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Organic_tomatoes.JPG",
    "license": "CC BY-SA 3.0",
    "attributionText": "Rennaux, CC BY-SA 3.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "salatalik",
    "role": "primary",
    "filename": "cucumber_03_harvest.jpg",
    "creator": "George Chernilevsky",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Basket_with_vegetables_2017_G1.jpg",
    "license": "Public domain",
    "attributionText": "George Chernilevsky, public domain, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "marul",
    "role": "primary",
    "filename": "lettuce_03_harvest.jpg",
    "creator": "Dwight Sipler",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Lettuce_Mini_Heads_%22Cherokee%22_(7331114674).jpg",
    "license": "CC BY 2.0",
    "attributionText": "Dwight Sipler, CC BY 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "ispanak",
    "role": "primary",
    "filename": "spinach_03_harvest.jpg",
    "creator": "Anitah Pezz",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Spinach_harvesting_at_the_farm.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Anitah Pezz, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "feslegen",
    "role": "primary",
    "filename": "basil_04_harvest.jpg",
    "creator": "USDA (photo credit: USDAgov)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:USDA_Farmers_Market_(20170526-AMS-LSC-0063).jpg",
    "license": "Public domain",
    "attributionText": "USDA, public domain (U.S. government work), via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "havuc",
    "role": "primary",
    "filename": "carrot_03_roots.jpg",
    "creator": "Stephen Ausmus (USDA Agricultural Research Service)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Carrots_of_many_colors.jpg",
    "license": "Public domain",
    "attributionText": "Stephen Ausmus (USDA Agricultural Research Service), Public domain, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "fasulye-sirik",
    "role": "primary",
    "filename": "bean_03_pods.jpg",
    "creator": "Christopher Franz",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Four_Different_Varieties_of_Green_Beans_(Phaseolus_vulgaris).jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Christopher Franz, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "bezelye",
    "role": "primary",
    "filename": "pea_04_harvest.jpg",
    "creator": "Macdon",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Dwarf_snap_peas_IMG_8999.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Macdon, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "lahana-brokoli",
    "role": "primary",
    "filename": "broccoli_04_harvest.jpg",
    "creator": "Bruce Dupree / Alabama Cooperative Extension System (ACES)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Broccoli_close_up_(49200262862).jpg",
    "license": "CC0",
    "attributionText": "Bruce Dupree, Alabama Cooperative Extension System, CC0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "cilek",
    "role": "primary",
    "filename": "strawberry_03_harvest.jpg",
    "creator": "Shixart1985",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Person_picks_strawberries_in_a_garden_during_the_day.jpg",
    "license": "CC BY 2.0",
    "attributionText": "Shixart1985, CC BY 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "sogan-kuru",
    "role": "primary",
    "filename": "onion_04_harvest.jpg",
    "creator": "pamsai",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:4_Onions_(5290071431).jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "pamsai, CC BY-SA 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "lahana",
    "role": "primary",
    "filename": "cabbage_04_harvest.jpg",
    "creator": "Richard Webb",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cabbage_harvest_-_geograph.org.uk_-_4190720.jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "Richard Webb, CC BY-SA 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "patates",
    "role": "primary",
    "filename": "potato_04_harvest.jpg",
    "creator": "Luigi Guarino",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Digging_up_potatoes_for_Christmas_lunch.jpg",
    "license": "CC BY 2.0",
    "attributionText": "Luigi Guarino, CC BY 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "nohut",
    "role": "primary",
    "filename": "chickpea_04_harvest.jpg",
    "creator": "Dosseman",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:%C3%87orum_chickpea_production_3416.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Dosseman, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "misir",
    "role": "primary",
    "filename": "maize_03_harvest.jpg",
    "creator": "Alabama Cooperative Extension System",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:CORN_HARVEST_close_up_of_ear_(48980552538).jpg",
    "license": "CC0",
    "attributionText": "Alabama Cooperative Extension System, CC0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "misir",
    "role": "secondary",
    "filename": "bloodybutcher_02_ear.jpg",
    "creator": "Amada44",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Corn_-_bloody_butcher_-_9698.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Amada44, CC BY-SA 3.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "misir",
    "role": "secondary",
    "filename": "hopicorn_01_ears_museum.jpg",
    "creator": "Adam Jones, Ph.D.",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Early_20th_century_Hopi_corn_(UBC).jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Adam Jones, Ph.D., CC BY-SA 3.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "karpuz",
    "role": "primary",
    "filename": "watermelon_03_harvest.jpg",
    "creator": "USDAgov",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:2018_USDA_Farmers_Market_-_Watermelon_(20180803-AMS-LSC-0898).jpg",
    "license": "Public domain",
    "attributionText": "USDAgov, Public domain, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "tatli-patates",
    "role": "primary",
    "filename": "sweetpotato_04_harvest.jpg",
    "creator": "Filo gèn'",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ipomoea_batatas_-_Tubers.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Filo gèn', CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "patlican",
    "role": "primary",
    "filename": "eggplant_04_harvest.jpg",
    "creator": "SarKaLay (Myanmar Wikimedia contributor)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Eggplants_KhyanTee.jpg",
    "license": "CC0",
    "attributionText": "SarKaLay, CC0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "karnabahar",
    "role": "primary",
    "filename": "cauliflower_04_harvest.jpg",
    "creator": "Peter horid",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coliflower_on_dirt_taken_out_001.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Peter horid, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "sarimsak",
    "role": "primary",
    "filename": "garlic_04_harvest.jpg",
    "creator": "terri_bateman",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:-365_garlic_harvest_(28151809812).jpg",
    "license": "CC BY 2.0",
    "attributionText": "terri_bateman, CC BY 2.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "pirasa",
    "role": "primary",
    "filename": "leek_04_harvest.jpg",
    "creator": "Evelyn Simak",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Leek_(Allium_ampeloprasum_var._porrum)_ready_for_harvesting_-_geograph.org.uk_-_584750.jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "Evelyn Simak, CC BY-SA 2.0, via Wikimedia Commons / Geograph Britain and Ireland",
    "isApproximation": false
  },
  {
    "cropId": "kereviz",
    "role": "primary",
    "filename": "celery_02_stalks.jpg",
    "creator": "Dinkum",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:C%C3%A9leri_%C3%A0_c%C3%B4tes.JPG",
    "license": "CC0",
    "attributionText": "Dinkum, CC0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "kavun",
    "role": "primary",
    "filename": "melon_04_harvest.jpg",
    "creator": "Scott Bauer, USDA-ARS",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cucumis_melo_var._reticulatus_(photo_by_Scott_Bauer).jpg",
    "license": "Public domain",
    "attributionText": "Scott Bauer, USDA Agricultural Research Service, Public domain, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "kale",
    "role": "primary",
    "filename": "kale_04_market.jpg",
    "creator": "USDA",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Fresno_Family_Farm_sells_curly_kale.jpg",
    "license": "Public domain",
    "attributionText": "USDA, Public domain (U.S. government work), via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "balkabagi",
    "role": "primary",
    "filename": "seminolepumpkin_01_fruit.jpg",
    "creator": "A Thinking Stomach",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Seminole_pumpkin_fruit.jpg",
    "license": "CC BY 3.0",
    "attributionText": "A Thinking Stomach, CC BY 3.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "balkabagi",
    "role": "secondary",
    "filename": "pumpkin_04_harvestdisplay.jpg",
    "creator": "George Chernilevsky",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cucurbita_2011_G1_Large.jpg",
    "license": "CC0",
    "attributionText": "George Chernilevsky, CC0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "zeytin",
    "role": "primary",
    "filename": "olive_04_fruit_green_unripe.jpg",
    "creator": "Rosendahl",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Immature_green_olives.jpg",
    "license": "Public domain",
    "attributionText": "Rosendahl, Public domain, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "portakal",
    "role": "primary",
    "filename": "citrus_02_fruit_navel_ripe.jpg",
    "creator": "David J. Stang",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Citrus_sinensis_Navel_0zz.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "David J. Stang, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "roka",
    "role": "primary",
    "filename": "roka_01_harvested_leaves_market.jpg",
    "creator": "Peter Burka",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Arugula_(51107429934).jpg",
    "license": "CC BY-SA 2.0",
    "attributionText": "Arugula by Peter Burka, CC BY-SA 2.0, via Wikimedia Commons (Flickr, bot-verified)",
    "isApproximation": false
  },
  {
    "cropId": "roka",
    "role": "secondary",
    "filename": "roka_02_growing_plant_rosette.jpg",
    "creator": "Michal (atlas.roslin.pl)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Atlas_roslin_pl_Rokietta_siewna_122_6958.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Rokietta siewna by Michal / atlas.roslin.pl, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "pazi",
    "role": "primary",
    "filename": "pazi_01_garden_plant_colorful_stems.jpg",
    "creator": "James Steakley",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Beta_vulgaris_subsp._vulgaris_(Swiss_chard).JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "Photo by James Steakley, CC BY-SA 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "pazi",
    "role": "secondary",
    "filename": "pazi_02_leaf_blade_golden_stalks.jpg",
    "creator": "Schnobby",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Chard_with_yellow_stalks.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Photo by Schnobby, CC BY-SA 3.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "maydanoz",
    "role": "primary",
    "filename": "maydanoz_01_curly_leaves_closeup.jpg",
    "creator": "Kurt Kaiser",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Curly_parsley.jpg",
    "license": "CC0",
    "attributionText": "Photo by Kurt Kaiser, CC0/Public Domain Dedication, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "maydanoz",
    "role": "secondary",
    "filename": "maydanoz_02_flatleaf_growing_bed.jpg",
    "creator": "Bjankuloski06",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Garden_parsley,_Auckland.jpg",
    "license": "CC BY 4.0",
    "attributionText": "Photo by Bjankuloski06, CC BY 4.0, via Wikimedia Commons",
    "isApproximation": false
  },
  {
    "cropId": "nane",
    "role": "primary",
    "filename": "nane_01_spearmint_labeled_plant.jpg",
    "creator": "Michael Rivera (Mjrmtg)",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Coastal_Georgia_Botanical_Gardens,_Spearmint.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Coastal Georgia Botanical Gardens, Spearmint by Michael Rivera (Mjrmtg), via Wikimedia Commons, CC BY-SA 4.0",
    "isApproximation": false
  },
  {
    "cropId": "nane",
    "role": "secondary",
    "filename": "nane_02_spearmint_leaves_closeup.jpg",
    "creator": "Jonathunder",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:FreshMint.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "FreshMint by Jonathunder, via Wikimedia Commons, CC BY-SA 3.0",
    "isApproximation": false
  },
  {
    "cropId": "aromatik-kekik",
    "role": "primary",
    "filename": "aromatik-kekik_01_thymus_vulgaris_bush.jpg",
    "creator": "Cesdeva",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:CommonThyme.jpg",
    "license": "CC0",
    "attributionText": "Common Thyme by Cesdeva, via Wikimedia Commons, CC0 Public Domain Dedication",
    "isApproximation": false
  },
  {
    "cropId": "aromatik-kekik",
    "role": "secondary",
    "filename": "aromatik-kekik_02_thymus_vulgaris_flowering_macro.jpg",
    "creator": "Pharmattila",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Flowering_Thymus_vulgaris.jpg",
    "license": "CC BY-SA 4.0",
    "attributionText": "Flowering Thymus vulgaris by Pharmattila, via Wikimedia Commons, CC BY-SA 4.0",
    "isApproximation": false
  },
  {
    "cropId": "turp-bahce",
    "role": "primary",
    "filename": "turp-bahce_01_red_radish_harvest_pile.jpg",
    "creator": "Benoit Prieur",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Boucheries_Andr%C3%A9s_%C3%A0_Rillieux-la-Pape_-_radis_rouges.jpg",
    "license": "CC0",
    "attributionText": "Boucheries Andres a Rillieux-la-Pape - radis rouges by Benoit Prieur, via Wikimedia Commons, CC0 Public Domain Dedication",
    "isApproximation": false
  },
  {
    "cropId": "turp-bahce",
    "role": "secondary",
    "filename": "turp-bahce_02_red_radish_bunch.jpg",
    "creator": "TeWeBs",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:A_Bunch_of_Radishes.JPG",
    "license": "CC BY-SA 4.0",
    "attributionText": "A Bunch of Radishes by TeWeBs, via Wikimedia Commons, CC BY-SA 4.0",
    "isApproximation": false
  },
  {
    "cropId": "sogan-yesil",
    "role": "primary",
    "filename": "sogan-yesil_01_bunch_tied.jpg",
    "creator": "Kowloonese",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Scallion.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Scallion.jpg by Kowloonese, via Wikimedia Commons, CC BY-SA 3.0",
    "isApproximation": false
  },
  {
    "cropId": "sogan-yesil",
    "role": "secondary",
    "filename": "sogan-yesil_02_bunch_roots_woodboard.jpg",
    "creator": "Donovan Govan",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Spring_Onion.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Spring Onion.jpg by Donovan Govan, via Wikimedia Commons, CC BY-SA 3.0",
    "isApproximation": false
  },
  {
    "cropId": "biber-carliston",
    "role": "primary",
    "filename": "biber-carliston_01_cubanelle-analog_basket_red-green_USDA.jpg",
    "creator": "Bill Tarpenning / USDA",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cubanelle_Peppers.jpg",
    "license": "Public Domain (US gov work)",
    "attributionText": "Cubanelle Peppers, USDA photo by Bill Tarpenning, public domain, via Wikimedia Commons",
    "isApproximation": true
  },
  {
    "cropId": "biber-carliston",
    "role": "secondary",
    "filename": "biber-carliston_02_cubanelle-analog_green_closeup.jpg",
    "creator": "Daderot",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Cubanelle_peppers,_green_-_Massachusetts.jpg",
    "license": "CC0",
    "attributionText": "Cubanelle peppers, green - Massachusetts by Daderot, CC0, via Wikimedia Commons",
    "isApproximation": true
  },
  {
    "cropId": "kabak-sakiz",
    "role": "primary",
    "filename": "kabak-sakiz_01_roundzucchini-analog_studio_CC0.jpg",
    "creator": "Fructibus",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Round_zucchini_2017_A1.jpg",
    "license": "CC0",
    "attributionText": "Round zucchini 2017 A1 by Fructibus, CC0, via Wikimedia Commons",
    "isApproximation": true
  },
  {
    "cropId": "kabak-sakiz",
    "role": "secondary",
    "filename": "kabak-sakiz_02_roundzucchini-analog_studio_monto.jpg",
    "creator": "Tiia Monto",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Round_zucchini.jpg",
    "license": "CC BY-SA 3.0",
    "attributionText": "Round zucchini by Tiia Monto, via Wikimedia Commons, CC BY-SA 3.0",
    "isApproximation": true
  }
];

/** Bir ürünün birincil (kart/detay) görselinin kredi bilgisini döner. */
export function primaryCredit(cropId: string): PhotoCredit | undefined {
  return PHOTO_CREDITS.find((c) => c.cropId === cropId && c.role === "primary");
}

/** Bir ürünün /photos/crops/ altındaki birincil görsel yolu (varsa). */
export function cropPhotoPath(cropId: string): string | undefined {
  return primaryCredit(cropId) ? `/photos/crops/${cropId}.jpg` : undefined;
}
