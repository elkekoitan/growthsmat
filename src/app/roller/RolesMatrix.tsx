"use client";

import { useMemo } from "react";
import { ALL_PERMISSIONS, ROLE_LABELS, can, type Role, type Permission } from "@/lib/roles";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { Check, X, ShieldCheck } from "@/components/icons";

const ROLES = Object.keys(ROLE_LABELS) as Role[];

const CHECK_PERMISSIONS: Permission[] = ["workspace.manage", "lot.recall", "claim.publish", "finance.export"];

export interface RolesMatrixProps {
  email: string;
  role: Role;
  workspaceId: string;
}

export function RolesMatrix({ email, role, workspaceId }: RolesMatrixProps) {
  const checks = useMemo(
    () => CHECK_PERMISSIONS.map((p) => ({ permission: p, allowed: can(role, p) })),
    [role]
  );

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

      <style>{`
        .perm-table { border-collapse: collapse; width: 100%; min-width: 720px; font-size: var(--fs-sm); }
        .perm-table th, .perm-table td { border-bottom: 1px solid var(--border-hair); padding: 8px 12px; text-align: left; white-space: nowrap; }
        .perm-table thead th { color: var(--text-low); font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }
        .perm-table tbody tr:hover { background: var(--bg-surface-2); }
      `}</style>
    </>
  );
}
