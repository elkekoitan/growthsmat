import { test } from "node:test";
import assert from "node:assert/strict";
import {
  can,
  canAny,
  canAll,
  hasPermission,
  findMembership,
  ROLE_PERMISSIONS,
  ALL_PERMISSIONS,
  type Membership,
} from "../src/lib/roles.ts";

test("sahip tüm izinlere sahiptir", () => {
  for (const p of ALL_PERMISSIONS) assert.equal(can("sahip", p), true, `sahip → ${p}`);
});

test("görüntüleyici yalnız read izinlerine sahiptir, yazma/onay izni yok", () => {
  assert.equal(can("goruntuleyici", "site.read"), true);
  assert.equal(can("goruntuleyici", "site.write"), false);
  assert.equal(can("goruntuleyici", "plan.approve"), false);
  assert.equal(can("goruntuleyici", "lot.create"), false);
  assert.equal(can("goruntuleyici", "workspace.manage"), false);
});

test("saha çalışanı görev yürütebilir ama finans dışa aktaramaz", () => {
  assert.equal(can("saha-calisani", "task.execute"), true);
  assert.equal(can("saha-calisani", "finance.export"), false);
  assert.equal(can("saha-calisani", "workspace.manage"), false);
});

test("yönetici workspace.manage HARİÇ her şeyi yapabilir (sahipten tek fark)", () => {
  assert.equal(can("yonetici", "workspace.manage"), false);
  const diff = ALL_PERMISSIONS.filter((p) => can("sahip", p) !== can("yonetici", p));
  assert.deepEqual(diff, ["workspace.manage"]);
});

test("kalite rolü geri çağırma yetkisine sahiptir, uzman ise değil", () => {
  assert.equal(can("kalite", "lot.recall"), true);
  assert.equal(can("uzman", "lot.recall"), false);
});

test("uzman organik iddia yayınlayabilir (claim.publish)", () => {
  assert.equal(can("uzman", "claim.publish"), true);
  assert.equal(can("satis", "claim.publish"), false);
});

test("canAny / canAll doğru mantıkla çalışır", () => {
  assert.equal(canAny("satis", ["workspace.manage", "commerce.manage"]), true);
  assert.equal(canAll("satis", ["workspace.manage", "commerce.manage"]), false);
  assert.equal(canAll("sahip", ["site.read", "site.write"]), true);
});

test("her rolün en az bir izni vardır (boş rol yok)", () => {
  for (const role of Object.keys(ROLE_PERMISSIONS) as (keyof typeof ROLE_PERMISSIONS)[]) {
    assert.ok(ROLE_PERMISSIONS[role].length > 0, `${role} izinsiz kalamaz`);
  }
});

test("TENANT İZOLASYONU: aynı kullanıcının farklı workspace'teki üyeliği dikkate alınmaz", () => {
  const memberships: Membership[] = [
    { userId: "u1", workspaceId: "ws-a", role: "sahip", status: "aktif" },
    { userId: "u1", workspaceId: "ws-b", role: "goruntuleyici", status: "aktif" },
  ];
  // u1, ws-a'da sahip → workspace.manage yapabilir
  assert.equal(hasPermission(memberships, "u1", "ws-a", "workspace.manage"), true);
  // AYNI kullanıcı ws-b'de sadece görüntüleyici → workspace.manage YAPAMAZ
  assert.equal(hasPermission(memberships, "u1", "ws-b", "workspace.manage"), false);
  // u1'in hiç üyeliği olmayan ws-c'de HİÇBİR izni yok
  assert.equal(hasPermission(memberships, "u1", "ws-c", "site.read"), false);
});

test("askıya alınmış/iptal üyelik izin vermez (rol uygun olsa bile)", () => {
  const memberships: Membership[] = [
    { userId: "u2", workspaceId: "ws-a", role: "sahip", status: "askida" },
  ];
  assert.equal(hasPermission(memberships, "u2", "ws-a", "site.read"), false);
});

test("findMembership durumdan bağımsız üyeliği bulur (durum kontrolü ayrı katman)", () => {
  const memberships: Membership[] = [{ userId: "u3", workspaceId: "ws-a", role: "kalite", status: "iptal" }];
  const m = findMembership(memberships, "u3", "ws-a");
  assert.ok(m);
  assert.equal(m!.role, "kalite");
  assert.equal(hasPermission(memberships, "u3", "ws-a", "lot.recall"), false); // iptal → false
});

test("bilinmeyen kullanıcı/workspace kombinasyonu çökmeden false döner", () => {
  assert.equal(hasPermission([], "yok", "yok", "site.read"), false);
});
