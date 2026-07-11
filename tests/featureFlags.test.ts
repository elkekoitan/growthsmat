import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateFlag, evaluateAll, cohortBucket, parseOverrides, serializeOverrides, type FlagDefinition } from "../src/lib/featureFlags.ts";

const TEST_FLAGS: FlagDefinition[] = [
  { key: "hep-acik", label: "", defaultOn: true, rolloutPct: 100, description: "" },
  { key: "hep-kapali", label: "", defaultOn: false, rolloutPct: 0, description: "" },
  { key: "yarim", label: "", defaultOn: false, rolloutPct: 50, description: "" },
];

test("override her şeyi ezer (kohort ve default'tan önce)", () => {
  const d = evaluateFlag("hep-kapali", { "hep-kapali": true }, "seed-1", TEST_FLAGS);
  assert.equal(d.value, true);
  assert.equal(d.source, "override");
});

test("rolloutPct=100 her seed'de açık, source=cohort", () => {
  for (const seed of ["a", "b", "c", "xyz"]) {
    const d = evaluateFlag("hep-acik", {}, seed, TEST_FLAGS);
    assert.equal(d.value, true);
    assert.equal(d.source, "cohort");
  }
});

test("rolloutPct=0 her seed'de kapalı", () => {
  for (const seed of ["a", "b", "c"]) {
    assert.equal(evaluateFlag("hep-kapali", {}, seed, TEST_FLAGS).value, false);
  }
});

test("DETERMİNİSTİK: aynı seed hep aynı sonucu verir", () => {
  const a = evaluateFlag("yarim", {}, "kullanici-42", TEST_FLAGS).value;
  const b = evaluateFlag("yarim", {}, "kullanici-42", TEST_FLAGS).value;
  assert.equal(a, b);
});

test("cohortBucket deterministik ve 0-99 aralığında", () => {
  assert.equal(cohortBucket("sabit"), cohortBucket("sabit"));
  for (const s of ["x", "y", "z", "uzun-bir-seed-degeri"]) {
    const b = cohortBucket(s);
    assert.ok(b >= 0 && b < 100);
  }
});

test("cohortSeed verilmezse varsayılan kullanılır (source=default)", () => {
  const d = evaluateFlag("hep-acik", {}, undefined, TEST_FLAGS);
  assert.equal(d.source, "default");
  assert.equal(d.value, true);
});

test("bilinmeyen bayrak güvenli false + default source döner", () => {
  const d = evaluateFlag("olmayan-bayrak", {}, "seed", TEST_FLAGS);
  assert.equal(d.value, false);
  assert.equal(d.source, "default");
});

test("evaluateAll tüm bayraklar için karar döner", () => {
  const all = evaluateAll({}, "seed", TEST_FLAGS);
  assert.equal(all.length, TEST_FLAGS.length);
});

test("parseOverrides bozuk JSON'da çökmez, boş obje döner", () => {
  assert.deepEqual(parseOverrides("{bozuk"), {});
  assert.deepEqual(parseOverrides(null), {});
  assert.deepEqual(parseOverrides(serializeOverrides({ x: true })), { x: true });
});

test("parseOverrides boolean olmayan değerleri filtreler", () => {
  assert.deepEqual(parseOverrides(JSON.stringify({ a: true, b: "evet", c: 1 })), { a: true });
});
