import { test } from "node:test";
import assert from "node:assert/strict";
import { PEST_DISEASE_PROFILES, pestsForCrop, pestsByKind } from "../src/data/pestDisease.ts";
import { CROP_BY_ID } from "../src/data/crops.ts";

test("her profilde zorunlu alanlar dolu (kaynak/kanıt izlenebilirliği)", () => {
  for (const p of PEST_DISEASE_PROFILES) {
    assert.ok(p.commonName.length > 0, `${p.id} commonName boş`);
    assert.ok(p.scientificName.length > 0, `${p.id} scientificName boş`);
    assert.ok(p.affectedFamilies.length > 0, `${p.id} affectedFamilies boş`);
    assert.ok(p.sourceOrg.length > 0, `${p.id} sourceOrg boş`);
    assert.ok(p.sourceFile.length > 0, `${p.id} sourceFile boş`);
  }
});

test("id'ler benzersizdir", () => {
  const ids = PEST_DISEASE_PROFILES.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("pestsForCrop: Solanaceae ürün (domates) çoklu zararlı/hastalık döner", () => {
  const domates = CROP_BY_ID["cherry-domates-kompakt"];
  const pests = pestsForCrop(domates);
  const ids = pests.map((p) => p.id);
  assert.ok(ids.includes("phytophthora-infestans"));
  assert.ok(ids.includes("ralstonia-solanacearum"));
  assert.ok(ids.includes("bemisia-tabaci"));
});

test("pestsForCrop: dar konukçulu hastalık (clubroot) yalnız Brassicaceae ürünlerde çıkar", () => {
  const clubroot = PEST_DISEASE_PROFILES.find((p) => p.id === "plasmodiophora-brassicae");
  assert.deepEqual(clubroot?.affectedFamilies, ["Brassicaceae"]);
});

test("pestsForCrop: eşleşmeyen familya (Oleaceae — zeytin) için BOŞ döner (sahte eşleşme yok)", () => {
  const zeytin = CROP_BY_ID["zeytin"];
  const pests = pestsForCrop(zeytin);
  assert.equal(pests.length, 0);
});

test("pestsForCrop: familya eş anlamlısı (Amaranthaceae ↔ eski Chenopodiaceae) doğru eşleşir", () => {
  const pazi = CROP_BY_ID["pazi"];
  assert.equal(pazi.family, "Amaranthaceae");
  const pests = pestsForCrop(pazi);
  const ids = pests.map((p) => p.id);
  assert.ok(ids.includes("bemisia-tabaci"));
  assert.ok(ids.includes("ralstonia-solanacearum"));
  assert.ok(ids.includes("aphids-genel"));
});

test("pestsByKind: zararli ve hastalik kümeleri ayrık ve toplam profil sayısına eşittir", () => {
  const zararli = pestsByKind("zararli");
  const hastalik = pestsByKind("hastalik");
  assert.equal(zararli.length + hastalik.length, PEST_DISEASE_PROFILES.length);
  const overlap = zararli.filter((p) => hastalik.includes(p));
  assert.equal(overlap.length, 0);
});

test("geniş konukçulu zararlı (Ralstonia) 7 familyayı etkiler — dar/geniş konukçu ayrımı veride görünür", () => {
  const ralstonia = PEST_DISEASE_PROFILES.find((p) => p.id === "ralstonia-solanacearum");
  assert.equal(ralstonia?.affectedFamilies.length, 7);
});
