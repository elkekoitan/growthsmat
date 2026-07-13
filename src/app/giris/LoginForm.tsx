"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthFormState } from "@/server/auth";
import { NumberedHeading } from "@/components/graphics";
import { Reveal } from "@/components/ui";
import { ShieldCheck, ArrowRight, X } from "@/components/icons";

const INITIAL_STATE: AuthFormState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, INITIAL_STATE);

  return (
    <section className="paper-section section">
      <div className="container-x" style={{ maxWidth: 480 }}>
        <div className="eyebrow">
          <ShieldCheck size={16} /> Giriş
        </div>
        <NumberedHeading n="01" eyebrow="Hesabına dön" title="Giriş yap" />
        <Reveal i={0} className="card" style={{ padding: 24, display: "grid", gap: 16, marginTop: 16 }}>
          <form action={action} style={{ display: "grid", gap: 16 }}>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              E-posta
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                className="btn btn-secondary"
                style={{ textAlign: "left" }}
                placeholder="sen@isletmen.com"
              />
            </label>
            <label style={{ display: "grid", gap: 6, fontSize: "var(--fs-sm)" }}>
              Şifre
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                className="btn btn-secondary"
                style={{ textAlign: "left" }}
                placeholder="••••••••"
              />
            </label>
            {state?.error ? (
              <span className="chip chip-danger" style={{ justifySelf: "start" }}>
                <X size={13} /> {state.error}
              </span>
            ) : null}
            <button type="submit" disabled={pending} className="btn btn-primary" style={{ justifySelf: "start" }}>
              {pending ? "Giriş yapılıyor…" : "Giriş yap"} <ArrowRight size={16} />
            </button>
          </form>
          <div style={{ fontSize: "var(--fs-sm)", color: "var(--text-low)" }}>
            Hesabın yok mu? <Link href="/kayit">Kayıt ol</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
