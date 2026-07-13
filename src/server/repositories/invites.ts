// SmartGrowth OS — Davet repository katmanı (gerçek Postgres CRUD).
// Karar mantığı src/lib/membershipLifecycle.ts'te ZATEN vardı ve test edilmişti (PRD FR-006,
// roadmap P02-06 "done") — ama hiçbir repository/UI onu gerçek Invite/Membership/AuditEvent
// satırlarına bağlamıyordu (roadmap'in "done" etiketi yalnız SAF fonksiyonlar için doğruydu,
// gerçek bir davet göndermenin/kabul etmenin hiçbir yolu yoktu). Bu dosya transition()/
// canCancel()'ı olduğu gibi kullanır — YENİDEN İCAT ETMEZ.
//
// DÜRÜSTLÜK NOTU (bilinçli sınır): membershipLifecycle.ts'in kendi acceptInvite(invite,
// memberships) yardımcısı BURADA kullanılmaz — o saf fonksiyon test sabitlerinde userId'yi
// invite.email ile aynı varsayar (bkz. tests/membershipLifecycle.test.ts), ama gerçek şemada
// User.id bir cuid'dir, e-posta değil. Bu uyumsuzluğu zorla gizlemek yerine, gerçek Membership
// satırı burada GERÇEK userId ile doğrudan yazılır; yalnız durum-geçiş kararı (transition) ve
// iptal yetkisi (canCancel) — ki ikisinde de bu varsayım yok — yeniden kullanılır.
import "server-only";

import { getDb } from "../db";
import { fromPrismaRole, toPrismaRole, can, type Role, type Membership as LibMembership } from "@/lib/roles";
import { transition, canCancel, type Invite as LibInvite, type InviteState } from "@/lib/membershipLifecycle";
import type { Role as PrismaRole } from "../../../generated/prisma/enums";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

const TO_PRISMA_STATE: Record<InviteState, PrismaInviteStateValue> = {
  "davet-gonderildi": "davet_gonderildi",
  "kabul-edildi": "kabul_edildi",
  reddedildi: "reddedildi",
  "suresi-doldu": "suresi_doldu",
  "iptal-edildi": "iptal_edildi",
};
type PrismaInviteStateValue = "davet_gonderildi" | "kabul_edildi" | "reddedildi" | "suresi_doldu" | "iptal_edildi";
const FROM_PRISMA_STATE: Record<string, InviteState> = {
  davet_gonderildi: "davet-gonderildi",
  kabul_edildi: "kabul-edildi",
  reddedildi: "reddedildi",
  suresi_doldu: "suresi-doldu",
  iptal_edildi: "iptal-edildi",
};

export interface RealInvite {
  id: string;
  email: string;
  workspaceId: string;
  workspaceName?: string;
  role: Role;
  invitedByUserId: string;
  state: InviteState;
  sentAt: string;
  expiresAt: string;
}

function toDomain(row: {
  id: string;
  email: string;
  workspaceId: string;
  role: string;
  invitedByUserId: string;
  state: string;
  sentAt: Date;
  expiresAt: Date;
  workspace?: { name: string };
}): RealInvite {
  return {
    id: row.id,
    email: row.email,
    workspaceId: row.workspaceId,
    workspaceName: row.workspace?.name,
    role: fromPrismaRole(row.role),
    invitedByUserId: row.invitedByUserId,
    state: FROM_PRISMA_STATE[row.state] ?? (row.state as InviteState),
    sentAt: row.sentAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

/** RealInvite'ı membershipLifecycle.ts'in transition()/canCancel() bekleyen saf şekline çevirir. */
function toLibInvite(inv: RealInvite): LibInvite {
  return {
    id: inv.id,
    email: inv.email,
    workspaceId: inv.workspaceId,
    role: inv.role,
    invitedBy: inv.invitedByUserId,
    sentAtISO: inv.sentAt,
    expiresAtISO: inv.expiresAt,
    state: inv.state,
  };
}

export async function listOutgoingInvites(workspaceId: string): Promise<RealInvite[]> {
  const db = getDb();
  const rows = await db.invite.findMany({ where: { workspaceId }, orderBy: { sentAt: "desc" } });
  return rows.map(toDomain);
}

/** Belirli bir e-postaya gönderilmiş, hâlâ bekleyen davetleri döner (giriş yapmış kullanıcı için). */
export async function listIncomingInvites(email: string): Promise<RealInvite[]> {
  const db = getDb();
  const rows = await db.invite.findMany({
    where: { email: { equals: email, mode: "insensitive" }, state: "davet_gonderildi" },
    orderBy: { sentAt: "desc" },
    include: { workspace: { select: { name: true } } },
  });
  return rows.map(toDomain);
}

export type InviteActionResult = { applied: true; invite: RealInvite } | { applied: false; reason: string };

export async function createInvite(
  workspaceId: string,
  actorRole: Role,
  invitedByUserId: string,
  email: string,
  role: Role
): Promise<InviteActionResult> {
  if (!can(actorRole, "workspace.manage")) return { applied: false, reason: "Yetkisiz — workspace.manage izni gerekir." };
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) return { applied: false, reason: "Geçerli bir e-posta gir." };
  const db = getDb();
  const row = await db.invite.create({
    data: {
      email: cleanEmail,
      workspaceId,
      role: toPrismaRole(role) as PrismaRole,
      invitedByUserId,
      expiresAt: new Date(Date.now() + INVITE_TTL_MS),
    },
  });
  return { applied: true, invite: toDomain(row) };
}

export async function cancelInviteById(inviteId: string, actorUserId: string, actorRole: Role, actorWorkspaceId: string): Promise<InviteActionResult> {
  const db = getDb();
  const row = await db.invite.findUnique({ where: { id: inviteId } });
  if (!row) return { applied: false, reason: "Davet bulunamadı." };
  const existing = toDomain(row);
  if (existing.workspaceId !== actorWorkspaceId) return { applied: false, reason: "Yalnız kendi işletmenin davetini iptal edebilirsin." };

  const memberships: LibMembership[] = [{ userId: actorUserId, workspaceId: actorWorkspaceId, role: actorRole, status: "aktif" }];
  if (!canCancel(toLibInvite(existing), actorUserId, memberships)) {
    return { applied: false, reason: "Yetkisiz — daveti gönderen kişi veya workspace.manage izni gerekir." };
  }

  const nowISO = new Date().toISOString();
  const result = transition(toLibInvite(existing), "iptal", nowISO, actorUserId);
  if (!result.changed) return { applied: false, reason: "Yalnız gönderilmiş (bekleyen) davet iptal edilebilir." };

  const [saved] = await db.$transaction([
    db.invite.update({ where: { id: inviteId }, data: { state: TO_PRISMA_STATE[result.invite.state] } }),
    db.auditEvent.create({ data: { action: result.audit.action, inviteId, actorUserId } }),
  ]);
  return { applied: true, invite: toDomain(saved) };
}

export async function acceptInviteById(inviteId: string, userId: string, userEmail: string): Promise<InviteActionResult> {
  const db = getDb();
  const row = await db.invite.findUnique({ where: { id: inviteId } });
  if (!row) return { applied: false, reason: "Davet bulunamadı." };
  const existing = toDomain(row);
  if (existing.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { applied: false, reason: "Bu davet senin hesabına ait değil." };
  }
  const existingMembership = await db.membership.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: existing.workspaceId } },
  });
  if (existingMembership) return { applied: false, reason: "Bu işletmede zaten üyeliğin var." };

  const nowISO = new Date().toISOString();
  const result = transition(toLibInvite(existing), "kabul", nowISO, userId);
  if (result.invite.state !== "kabul-edildi") {
    return { applied: false, reason: result.invite.state === "suresi-doldu" ? "Davetin süresi dolmuş." : "Bu davet artık bekleyen durumda değil." };
  }

  await db.$transaction([
    db.invite.update({ where: { id: inviteId }, data: { state: TO_PRISMA_STATE[result.invite.state] } }),
    db.auditEvent.create({ data: { action: result.audit.action, inviteId, actorUserId: userId } }),
    db.membership.create({
      data: { userId, workspaceId: existing.workspaceId, role: toPrismaRole(existing.role) as PrismaRole, status: "aktif" },
    }),
  ]);
  return { applied: true, invite: { ...existing, state: result.invite.state } };
}

export async function declineInviteById(inviteId: string, userId: string, userEmail: string): Promise<InviteActionResult> {
  const db = getDb();
  const row = await db.invite.findUnique({ where: { id: inviteId } });
  if (!row) return { applied: false, reason: "Davet bulunamadı." };
  const existing = toDomain(row);
  if (existing.email.toLowerCase() !== userEmail.toLowerCase()) {
    return { applied: false, reason: "Bu davet senin hesabına ait değil." };
  }
  const nowISO = new Date().toISOString();
  const result = transition(toLibInvite(existing), "red", nowISO, userId);
  if (!result.changed) return { applied: false, reason: "Bu davet artık bekleyen durumda değil." };

  const [saved] = await db.$transaction([
    db.invite.update({ where: { id: inviteId }, data: { state: TO_PRISMA_STATE[result.invite.state] } }),
    db.auditEvent.create({ data: { action: result.audit.action, inviteId, actorUserId: userId } }),
  ]);
  return { applied: true, invite: toDomain(saved) };
}
