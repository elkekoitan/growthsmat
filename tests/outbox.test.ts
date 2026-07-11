import { test } from "node:test";
import assert from "node:assert/strict";
import { emptyState, applyOperation, applyBatch, resolveConflict, type Operation } from "../src/lib/outbox.ts";

function op(over: Partial<Operation> = {}): Operation {
  return {
    operationId: "op-1",
    deviceId: "dev-a",
    entityType: "task",
    entityId: "task-1",
    baseVersion: 0,
    mutation: { status: "done" },
    clientTimestamp: "2026-07-10T10:00:00Z",
    ...over,
  };
}

test("ilk operasyon uygulanır ve sürüm 1 olur", () => {
  const out = applyOperation(emptyState(), op());
  assert.equal(out.result, "applied");
  assert.equal(out.newVersion, 1);
  assert.equal(out.state.entities["task-1"].data.status, "done");
});

test("IDEMPOTENCY: aynı operationId ikinci kez uygulanmaz, state değişmez", () => {
  const s1 = applyOperation(emptyState(), op()).state;
  const out2 = applyOperation(s1, op()); // aynı operationId
  assert.equal(out2.result, "duplicate");
  assert.equal(out2.state, s1); // referans aynı — state değişmedi
});

test("stale baseVersion → conflict, otomatik üzerine yazma YOK", () => {
  const s1 = applyOperation(emptyState(), op({ operationId: "op-1", baseVersion: 0 })).state;
  // s1'de sürüm 1; baseVersion 0 ile gelen yeni op çakışır
  const out = applyOperation(s1, op({ operationId: "op-2", baseVersion: 0, mutation: { status: "todo" } }));
  assert.equal(out.result, "conflict");
  assert.equal(out.state.entities["task-1"].data.status, "done"); // eski değer korundu
});

test("doğru baseVersion ile ardışık yazma sürümü artırır", () => {
  const s1 = applyOperation(emptyState(), op({ operationId: "op-1", baseVersion: 0 })).state;
  const out = applyOperation(s1, op({ operationId: "op-2", baseVersion: 1, mutation: { note: "x" } }));
  assert.equal(out.result, "applied");
  assert.equal(out.newVersion, 2);
});

test("farklı cihazlardan aynı entity'e sıralı yazma çalışır", () => {
  const s1 = applyOperation(emptyState(), op({ operationId: "a", deviceId: "dev-a", baseVersion: 0 })).state;
  const s2 = applyOperation(s1, op({ operationId: "b", deviceId: "dev-b", baseVersion: 1, mutation: { qty: 5 } }));
  assert.equal(s2.result, "applied");
  assert.equal(s2.state.entities["task-1"].version, 2);
});

test("tombstone'lu entity'e yazma 'deleted' döner", () => {
  const base = emptyState();
  base.entities["task-1"] = { version: 3, data: {}, tombstone: true };
  const out = applyOperation(base, op({ baseVersion: 3 }));
  assert.equal(out.result, "deleted");
});

test("applyBatch tekrarlı op'ları duplicate olarak işaretler", () => {
  const ops = [op({ operationId: "x", baseVersion: 0 }), op({ operationId: "x", baseVersion: 0 })];
  const { results } = applyBatch(emptyState(), ops);
  assert.deepEqual(results, ["applied", "duplicate"]);
});

test("giriş state'i mutate edilmez (immutability)", () => {
  const s0 = emptyState();
  const snapshot = JSON.stringify(s0);
  applyOperation(s0, op());
  assert.equal(JSON.stringify(s0), snapshot);
});

test("resolveConflict 'ekleme-birlestir' dizileri tekrarsız birleştirir", () => {
  const r = resolveConflict({ fotolar: ["a", "b"] }, { fotolar: ["b", "c"] }, "ekleme-birlestir");
  assert.equal(r.resolved, true);
  assert.deepEqual(r.data!.fotolar, ["a", "b", "c"]);
});

test("resolveConflict 'durum-koru' tamamlanmış görevi geri almaz", () => {
  const r = resolveConflict({ status: "done" }, { status: "todo" }, "durum-koru");
  assert.equal(r.data!.status, "done");
});

test("resolveConflict 'kullanici-secsin' otomatik karar vermez, iki sürümü döner", () => {
  const r = resolveConflict({ qty: 10 }, { qty: 7 }, "kullanici-secsin");
  assert.equal(r.resolved, false);
  assert.ok(r.candidates);
  assert.equal(r.candidates!.server.qty, 10);
  assert.equal(r.candidates!.client.qty, 7);
});
