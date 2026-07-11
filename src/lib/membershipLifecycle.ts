// SmartGrowth OS — Davet ve üyelik yaşam döngüsü (PRD FR-006)
// Davet/rol/iptal auditli. Kabul idempotent — aynı kullanıcı+workspace çifti
// ikinci kez üye yapılmaz. İptal yetkisi: davet eden VEYA workspace.manage yetkili.

import { hasPermission, type Role, type Membership } from "@/lib/roles";

export type InviteState =
  | "davet-gonderildi"
  | "kabul-edildi"
  | "reddedildi"
  | "suresi-doldu"
  | "iptal-edildi";

export interface Invite {
  id: string;
  email: string;
  workspaceId: string;
  role: Role;
  invitedBy: string; // userId
  sentAtISO: string;
  expiresAtISO: string;
  state: InviteState;
}

export type InviteAction = "kabul" | "red" | "iptal" | "sure-kontrol";

export interface AuditEvent {
  at: string; // nowISO
  action: string;
  inviteId: string;
  actor: string;
}

export interface TransitionResult {
  invite: Invite;
  audit: AuditEvent;
  changed: boolean;
}

/** Bir davetin durum geçişini uygular (immutable). Süresi geçmişse kabul edilemez. */
export function transition(invite: Invite, action: InviteAction, nowISO: string, actor = "sistem"): TransitionResult {
  const expired = nowISO > invite.expiresAtISO;
  const audit = (state: InviteState, note: string): AuditEvent => ({ at: nowISO, action: `${action}:${note}`, inviteId: invite.id, actor });

  // Süre kontrolü: hâlâ bekleyen ve süresi geçmiş davet 'suresi-doldu' olur
  if (action === "sure-kontrol") {
    if (invite.state === "davet-gonderildi" && expired) {
      return { invite: { ...invite, state: "suresi-doldu" }, audit: audit("suresi-doldu", "otomatik"), changed: true };
    }
    return { invite, audit: audit(invite.state, "degisiklik-yok"), changed: false };
  }

  // Kabul/red yalnız bekleyen davetten mümkün
  if (invite.state !== "davet-gonderildi") {
    return { invite, audit: audit(invite.state, "gecersiz-durum"), changed: false };
  }

  if (action === "kabul") {
    if (expired) {
      return { invite: { ...invite, state: "suresi-doldu" }, audit: audit("suresi-doldu", "kabul-reddedildi"), changed: true };
    }
    return { invite: { ...invite, state: "kabul-edildi" }, audit: audit("kabul-edildi", "ok"), changed: true };
  }

  if (action === "red") {
    return { invite: { ...invite, state: "reddedildi" }, audit: audit("reddedildi", "ok"), changed: true };
  }

  // iptal
  return { invite: { ...invite, state: "iptal-edildi" }, audit: audit("iptal-edildi", "ok"), changed: true };
}

/** İptal yetkisi: daveti gönderen kişi veya workspace.manage izinli rol. */
export function canCancel(invite: Invite, byUserId: string, memberships: Membership[]): boolean {
  if (invite.invitedBy === byUserId) return true;
  return hasPermission(memberships, byUserId, invite.workspaceId, "workspace.manage");
}

/**
 * Kabul edilmiş bir daveti üyeliğe dönüştürür. Aynı kullanıcı+workspace çifti zaten
 * varsa yeni üyelik EKLENMEZ (idempotent) — çift üyelik oluşmaz.
 */
export function acceptInvite(invite: Invite, memberships: Membership[]): Membership[] {
  if (invite.state !== "kabul-edildi") return memberships;
  const already = memberships.some((m) => m.userId === invite.email && m.workspaceId === invite.workspaceId);
  if (already) return memberships;
  return [...memberships, { userId: invite.email, workspaceId: invite.workspaceId, role: invite.role, status: "aktif" }];
}

export const INVITE_STATE_LABELS: Record<InviteState, string> = {
  "davet-gonderildi": "Davet gönderildi",
  "kabul-edildi": "Kabul edildi",
  reddedildi: "Reddedildi",
  "suresi-doldu": "Süresi doldu",
  "iptal-edildi": "İptal edildi",
};
