// Bayat Server Action hatası sınıflandırma testleri (SAF).
import { test } from "node:test";
import assert from "node:assert/strict";
import { isStaleServerActionError } from "../src/lib/errorClassify.ts";

test("HATA: 'Failed to find Server Action' bayat-sekme olarak sınıflanır", () => {
  assert.equal(isStaleServerActionError("Failed to find Server Action \"abc123\". This request might be from an older or newer deployment."), true);
});

test("HATA: 'server action ... not found' varyantı da yakalanır", () => {
  assert.equal(isStaleServerActionError("The server action was not found on this deployment."), true);
  assert.equal(isStaleServerActionError("Could not find the Server Action for this request."), true);
});

test("HATA: sıradan hata bayat-sekme DEĞİLDİR", () => {
  assert.equal(isStaleServerActionError("TypeError: cannot read properties of undefined"), false);
  assert.equal(isStaleServerActionError("Database connection failed"), false);
});

test("HATA: boş/undefined mesaj güvenli şekilde false döner", () => {
  assert.equal(isStaleServerActionError(undefined), false);
  assert.equal(isStaleServerActionError(null), false);
  assert.equal(isStaleServerActionError(""), false);
});

test("HATA: büyük/küçük harf duyarsız", () => {
  assert.equal(isStaleServerActionError("FAILED TO FIND SERVER ACTION xyz"), true);
});
