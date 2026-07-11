import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateClaim, selectActivePack, type Certificate } from "../src/lib/rulePacks.ts";

const NOW = "2026-07-10";

function cert(over: Partial<Certificate> = {}): Certificate {
  return {
    id: "cert-1",
    holder: "Mehmet Çiftlik",
    jurisdiction: "TR",
    scopeCropIds: ["cherry-domates-kompakt", "marul"],
    validFrom: "2026-01-01",
    validTo: "2026-12-31",
    issuer: "Yetkilendirilmiş Kontrol Kuruluşu",
    ...over,
  };
}

test("geçerli sertifika + kapsamdaki ürün → sertifikali (allowed)", () => {
  const r = evaluateClaim(cert(), "cherry-domates-kompakt", "TR", NOW);
  assert.equal(r.allowed, true);
  assert.equal(r.status, "sertifikali");
  assert.ok(r.packVersion);
});

test("SERTİFİKA YOK → hiçbir koşulda sertifikali dönmez, belge-yok", () => {
  const r = evaluateClaim(undefined, "cherry-domates-kompakt", "TR", NOW);
  assert.equal(r.allowed, false);
  assert.equal(r.status, "belge-yok");
});

test("süresi dolmuş sertifika iddiayı bloklar", () => {
  const r = evaluateClaim(cert({ validTo: "2026-06-01" }), "cherry-domates-kompakt", "TR", NOW);
  assert.equal(r.allowed, false);
  assert.equal(r.status, "suresi-dolmus");
});

test("kapsam dışı ürün bloklanır", () => {
  const r = evaluateClaim(cert(), "roka", "TR", NOW); // roka kapsamda değil
  assert.equal(r.allowed, false);
  assert.equal(r.status, "kapsam-disi");
});

test("farklı yargı alanı sertifikası kapsam dışı sayılır", () => {
  const r = evaluateClaim(cert({ jurisdiction: "EU" }), "cherry-domates-kompakt", "TR", NOW);
  assert.equal(r.allowed, false);
  assert.equal(r.status, "kapsam-disi");
});

test("geçiş süreci sertifikası açık etiketle izin verir", () => {
  const r = evaluateClaim(cert({ inTransition: true }), "marul", "TR", NOW);
  assert.equal(r.allowed, true);
  assert.equal(r.status, "gecis-sureci");
});

test("pack seçimi yürürlük tarihine göre doğru sürümü verir", () => {
  const eski = selectActivePack("TR", "2024-06-01");
  const yeni = selectActivePack("TR", "2026-07-10");
  assert.equal(eski?.version, "2024.01");
  assert.equal(yeni?.version, "2026.07");
});

test("karar, seçilen paketin sürümünü taşır (karar kökeni korunur)", () => {
  const r = evaluateClaim(cert(), "marul", "TR", "2026-07-10");
  assert.equal(r.packVersion, "2026.07");
});

test("TR/EU/US için gerçek yasal kaynaklar tanımlı", () => {
  const tr = selectActivePack("TR", NOW);
  const eu = selectActivePack("EU", NOW);
  const us = selectActivePack("US", NOW);
  assert.ok(tr!.legalSources.some((s) => s.includes("5262")));
  assert.ok(eu!.legalSources.some((s) => s.includes("2018/848")));
  assert.ok(us!.legalSources.some((s) => s.includes("7 CFR")));
});
