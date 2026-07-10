"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "@/components/icons";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="mesh-light grain"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <div className="card" style={{ maxWidth: 480, padding: 36, textAlign: "center", position: "relative" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
            color: "var(--color-danger)",
            marginBottom: 20,
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: 10 }}>Beklenmeyen bir hata oluştu</h2>
        <p style={{ color: "var(--text-mid)", marginBottom: 24, fontSize: "var(--fs-base)" }}>
          Görüntülemeye çalıştığın sayfa şu an yüklenemedi. Bu genelde geçicidir — tekrar
          deneyebilir veya ana sayfaya dönebilirsin.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => unstable_retry()} className="btn btn-primary">
            Tekrar dene
          </button>
          <Link href="/" className="btn btn-secondary">
            Ana sayfa
          </Link>
        </div>
        {error.digest && (
          <p className="font-mono" style={{ marginTop: 20, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
