"use client";

import { useMemo, useState, useTransition } from "react";
import { useActionState } from "react";
import { ALL_PERMISSIONS, ROLE_LABELS, can, type Role, type Permission } from "@/lib/roles";
import { FLAG_BY_KEY, type FlagDecision } from "@/lib/featureFlags";
import { INVITE_STATE_LABELS } from "@/lib/membershipLifecycle";
import type { RealInvite } from "@/server/repositories/invites";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Check, X, ShieldCheck } from "@/components/icons";
import {
  setFlagOverrideAction,
  createInviteAction,
  cancelInviteAction,
  acceptInviteAction,
  declineInviteAction,
  type RollerFormState,
} from "./actions";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const CHECK_PERMISSIONS: Permission[] = ["workspace.manage", "lot.recall", "claim.publish", "finance.export"];

const INITIAL_FORM_STATE: RollerFormState = {};

export interface RolesMatrixProps {
  email: string;
  role: Role;
  workspaceId: string;
  flags: FlagDecision[];
  outgoingInvites: RealInvite[];
  incomingInvites: RealInvite[];
}

export function RolesMatrix({ email, role, workspaceId, flags, outgoingInvites, incomingInvites }: RolesMatrixProps) {
  const checks = useMemo(
    () => CHECK_PERMISSIONS.map((p) => ({ permission: p, allowed: can(role, p) })),
    [role]
  );
  const canManage = can(role, "workspace.manage");

  const [flagMsg, setFlagMsg] = useState<Record<string, string>>({});
  const [flagPending, startFlagTransition] = useTransition();

  function handleFlagOverride(flagKey: string, action: "ac" | "kapat" | "kaldir") {
    startFlagTransition(async () => {
      const res = await setFlagOverrideAction(flagKey, action);
      setFlagMsg((m) => ({ ...m, [flagKey]: res.error ?? res.success ?? "" }));
    });
  }

  const [inviteState, inviteAction, invitePending] = useActionState(createInviteAction, INITIAL_FORM_STATE);
  const [inviteMsg, setInviteMsg] = useState<Record<string, string>>({});
  const [invitePendingRow, startInviteTransition] = useTransition();

  function handleCancelInvite(id: string) {
    startInviteTransition(async () => {
      const res = await cancelInviteAction(id);
      setInviteMsg((m) => ({ ...m, [id]: res.error ?? res.success ?? "" }));
    });
  }
  function handleAcceptInvite(id: string) {
    startInviteTransition(async () => {
      const res = await acceptInviteAction(id);
      setInviteMsg((m) => ({ ...m, [id]: res.error ?? res.success ?? "" }));
    });
  }
  function handleDeclineInvite(id: string) {
    startInviteTransition(async () => {
      const res = await declineInviteAction(id);
      setInviteMsg((m) => ({ ...m, [id]: res.error ?? res.success ?? "" }));
    });
  }

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="mesh-light grain section" style={{ paddingBottom: "clamp(2rem, 4vw, 3rem)" }}>
        <div className="container-narrow hero-stagger" style={{ textAlign: "center" }}>
          <span className="eyebrow">
            <ShieldCheck size={13} /> Rol ve izin
          </span>
          <h1 style={{ fontSize: "var(--fs-h1)", marginTop: 18, marginBottom: 14 }} className="text-balance">
            Tenant bağlamı <em style={{ fontStyle: "italic", color: "var(--primary)" }}>her istekte doğrulanır</em>.
          </h1>
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-lead)", maxWidth: 640, margin: "0 auto" }} className="text-pretty">
            Tenant bağlamı kimlik tokenından türetilmez — her istekte üyelik doğrulanır. Rol
            tek başına yetmez; kullanıcı + çalışma alanı eşleşmesi gerekir.
          </p>
        </div>
      </section>

      {/* ---------- GERÇEK KİMLİK ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="01" eyebrow="Gerçek oturum" title="Senin üyeliğin" />
          <div className="card" style={{ padding: 22, marginBottom: 36 }}>
            <p style={{ fontSize: "var(--fs-sm)", color: "var(--text-mid)", marginBottom: 16 }}>
              Kullanıcı: <strong>{email}</strong> — çalışma alanı <strong className="font-mono">{workspaceId}</strong>{" "}
              için rolün: <strong>{ROLE_LABELS[role]}</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 10 }}>
              {checks.map((c) => (
                <div key={c.permission} className={`chip ${c.allowed ? "chip-ok" : "chip-danger"}`} style={{ justifyContent: "flex-start" }}>
                  {c.allowed ? <Check size={13} /> : <X size={13} />}
                  {c.permission}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- MATRİS ---------- */}
      <section className="paper-section section">
        <div className="container-x">
          <NumberedHeading n="02" eyebrow="8 rol × 18 izin" title="Yetki matrisi" />
          <Reveal i={0} style={{ overflowX: "auto" }}>
            <table className="perm-table">
              <thead>
                <tr>
                  <th>İzin</th>
                  {ROLES.map((r) => (
                    <th key={r}>{ROLE_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_PERMISSIONS.map((p) => (
                  <tr key={p}>
                    <td className="font-mono">{p}</td>
                    {ROLES.map((r) => (
                      <td key={r} style={{ textAlign: "center" }}>
                        {can(r, p) ? (
                          <Check size={14} style={{ color: "var(--color-success)" }} />
                        ) : (
                          <span style={{ color: "var(--text-low)" }}>—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      {/* ---------- ÖZELLİK BAYRAKLARI ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container-x">
          <NumberedHeading n="03" eyebrow="Deterministik kohort + override" title="Özellik bayrakları" />
          <p style={{ color: "var(--text-mid)", fontSize: "var(--fs-sm)", marginBottom: 20, maxWidth: 640 }}>
            Öncelik sırası: açık override &gt; kohort (rolloutPct) &gt; varsayılan. Kohort ataması bu
            çalışma alanının id&apos;sine göre deterministiktir — aynı workspace her zaman aynı kovaya düşer.
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {flags.map((f) => {
              const def = FLAG_BY_KEY[f.flagKey];
              if (!def) return null;
              const msg = flagMsg[f.flagKey];
              return (
                <div key={f.flagKey} className="card" style={{ padding: 16, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 220 }}>
                    <p style={{ fontWeight: 600, fontSize: "var(--fs-sm)" }}>{def.label}</p>
                    <p style={{ color: "var(--text-low)", fontSize: "var(--fs-xs)" }}>{def.description}</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`chip ${f.value ? "chip-ok" : "chip-danger"}`}>
                      {f.value ? <Check size={12} /> : <X size={12} />} {f.value ? "Açık" : "Kapalı"}
                    </span>
                    <span className="chip">{f.source === "override" ? "override" : f.source === "cohort" ? "kohort" : "varsayılan"}</span>
                    {canManage && (
                      <>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={flagPending} onClick={() => handleFlagOverride(f.flagKey, "ac")}>
                          Aç
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" disabled={flagPending} onClick={() => handleFlagOverride(f.flagKey, "kapat")}>
                          Kapat
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={flagPending || f.source !== "override"}
                          onClick={() => handleFlagOverride(f.flagKey, "kaldir")}
                        >
                          Override kaldır
                        </button>
                      </>
                    )}
                  </div>
                  {msg && <p style={{ width: "100%", fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{msg}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- EKİP DAVETLERİ ---------- */}
      <section className="paper-section section">
        <div className="container-x">
          <NumberedHeading n="04" eyebrow="Çok kiracılı işbirliği" title="Ekip davetleri" />

          {incomingInvites.length > 0 && (
            <div className="card" style={{ padding: 18, marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>Bana bekleyen davetler</p>
              <div style={{ display: "grid", gap: 8 }}>
                {incomingInvites.map((inv) => (
                  <div key={inv.id} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hair)", paddingBottom: 8 }}>
                    <p style={{ fontSize: "var(--fs-sm)" }}>
                      <strong>{inv.workspaceName ?? inv.workspaceId}</strong> — {ROLE_LABELS[inv.role]} rolüyle davet edildin
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" className="btn btn-primary btn-sm" disabled={invitePendingRow} onClick={() => handleAcceptInvite(inv.id)}>
                        Kabul et
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" disabled={invitePendingRow} onClick={() => handleDeclineInvite(inv.id)}>
                        Reddet
                      </button>
                    </div>
                    {inviteMsg[inv.id] && <p style={{ width: "100%", fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{inviteMsg[inv.id]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {canManage && (
            <div className="card" style={{ padding: 18, marginBottom: 24 }}>
              <p style={{ fontWeight: 600, marginBottom: 10 }}>Ekibine yeni birini davet et</p>
              <form action={inviteAction} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px" }}>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>E-posta</span>
                  <input type="email" name="email" required placeholder="ornek@calisma-alani.com" className="btn btn-secondary" style={{ textAlign: "left" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>Rol</span>
                  <select name="role" defaultValue="goruntuleyici" className="btn btn-secondary">
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="submit" className="btn btn-primary btn-sm" disabled={invitePending}>
                  Davet gönder
                </button>
              </form>
              {(inviteState.error || inviteState.success) && (
                <p style={{ marginTop: 10, fontSize: "var(--fs-xs)", color: inviteState.error ? "var(--color-danger)" : "var(--text-mid)" }}>
                  {inviteState.error ?? inviteState.success}
                </p>
              )}
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <p style={{ fontWeight: 600, marginBottom: 10 }}>Gönderdiğin davetler</p>
            {outgoingInvites.length === 0 ? (
              <p style={{ color: "var(--text-low)", fontSize: "var(--fs-sm)" }}>Henüz kimseyi davet etmedin.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {outgoingInvites.map((inv) => (
                  <div key={inv.id} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border-hair)", paddingBottom: 8 }}>
                    <p style={{ fontSize: "var(--fs-sm)" }}>
                      {inv.email} — {ROLE_LABELS[inv.role]}
                    </p>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="chip">{INVITE_STATE_LABELS[inv.state]}</span>
                      {inv.state === "davet-gonderildi" && (
                        <button type="button" className="btn btn-ghost btn-sm" disabled={invitePendingRow} onClick={() => handleCancelInvite(inv.id)}>
                          İptal et
                        </button>
                      )}
                    </div>
                    {inviteMsg[inv.id] && <p style={{ width: "100%", fontSize: "var(--fs-xs)", color: "var(--text-mid)" }}>{inviteMsg[inv.id]}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <style>{`
        .perm-table { border-collapse: collapse; width: 100%; min-width: 720px; font-size: var(--fs-sm); }
        .perm-table th, .perm-table td { border-bottom: 1px solid var(--border-hair); padding: 8px 12px; text-align: left; white-space: nowrap; }
        .perm-table thead th { color: var(--text-low); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .perm-table tbody tr:hover { background: var(--bg-surface-2); }
      `}</style>
    </>
  );
}
