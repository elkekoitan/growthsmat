import { test } from "node:test";
import assert from "node:assert/strict";
import { transition, canCancel, acceptInvite, type Invite } from "../src/lib/membershipLifecycle.ts";
import type { Membership } from "../src/lib/roles.ts";

const NOW = "2026-07-10T10:00:00Z";

function invite(over: Partial<Invite> = {}): Invite {
  return {
    id: "inv-1",
    email: "yeni@ornek.com",
    workspaceId: "ws-a",
    role: "saha-calisani",
    invitedBy: "sahip@ornek.com",
    sentAtISO: "2026-07-01T10:00:00Z",
    expiresAtISO: "2026-07-20T10:00:00Z",
    state: "davet-gonderildi",
    ...over,
  };
}

test("geçerli davet kabulü kabul-edildi durumuna geçer + audit üretir", () => {
  const r = transition(invite(), "kabul", NOW);
  assert.equal(r.invite.state, "kabul-edildi");
  assert.equal(r.changed, true);
  assert.ok(r.audit.action.includes("kabul"));
});

test("süresi dolmuş davet KABUL EDİLEMEZ, suresi-doldu olur", () => {
  const r = transition(invite({ expiresAtISO: "2026-07-05T10:00:00Z" }), "kabul", NOW);
  assert.equal(r.invite.state, "suresi-doldu");
});

test("kabul edilmiş davet ikinci kez kabul edilemez (geçersiz durum)", () => {
  const r = transition(invite({ state: "kabul-edildi" }), "kabul", NOW);
  assert.equal(r.invite.state, "kabul-edildi");
  assert.equal(r.changed, false);
});

test("reddedilen davet kabul edilemez", () => {
  const r = transition(invite({ state: "reddedildi" }), "kabul", NOW);
  assert.equal(r.changed, false);
});

test("sure-kontrol bekleyen süresi geçmiş daveti suresi-doldu yapar", () => {
  const r = transition(invite({ expiresAtISO: "2026-07-05T10:00:00Z" }), "sure-kontrol", NOW);
  assert.equal(r.invite.state, "suresi-doldu");
  assert.equal(r.changed, true);
});

test("her geçiş audit event üretir (denetim kaydı)", () => {
  for (const action of ["kabul", "red", "iptal"] as const) {
    const r = transition(invite(), action, NOW, "actor-1");
    assert.equal(r.audit.inviteId, "inv-1");
    assert.equal(r.audit.actor, "actor-1");
    assert.equal(r.audit.at, NOW);
  }
});

test("iptal yetkisi: daveti gönderen kişide vardır", () => {
  assert.equal(canCancel(invite(), "sahip@ornek.com", []), true);
});

test("iptal yetkisi: workspace.manage izinli rolde vardır", () => {
  const memberships: Membership[] = [{ userId: "yonetici@x.com", workspaceId: "ws-a", role: "sahip", status: "aktif" }];
  assert.equal(canCancel(invite(), "yonetici@x.com", memberships), true);
});

test("iptal yetkisi: yetkisiz kullanıcıda YOKTUR", () => {
  const memberships: Membership[] = [{ userId: "izleyici@x.com", workspaceId: "ws-a", role: "goruntuleyici", status: "aktif" }];
  assert.equal(canCancel(invite(), "izleyici@x.com", memberships), false);
});

test("acceptInvite kabul edilmiş davetten membership üretir", () => {
  const accepted = invite({ state: "kabul-edildi" });
  const result = acceptInvite(accepted, []);
  assert.equal(result.length, 1);
  assert.equal(result[0].userId, "yeni@ornek.com");
  assert.equal(result[0].status, "aktif");
});

test("IDEMPOTENT: aynı kullanıcı+workspace ikinci kez üye yapılmaz", () => {
  const accepted = invite({ state: "kabul-edildi" });
  const existing: Membership[] = [{ userId: "yeni@ornek.com", workspaceId: "ws-a", role: "kalite", status: "aktif" }];
  const result = acceptInvite(accepted, existing);
  assert.equal(result.length, 1); // yeni üyelik eklenmedi
});

test("giriş invite objesi mutate edilmez", () => {
  const inv = invite();
  const snapshot = JSON.stringify(inv);
  transition(inv, "kabul", NOW);
  assert.equal(JSON.stringify(inv), snapshot);
});
