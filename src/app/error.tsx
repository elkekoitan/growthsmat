"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShieldCheck } from "@/components/icons";
import { isStaleServerActionError } from "@/lib/errorClassify";

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

  // Deploy sonrası bayat sekme: Server Action ID döndü, eski JS bu action'ı bulamıyor.
  // unstable_retry() İŞE YARAMAZ (eski kod hâlâ bellekte) — tam sayfa yenileme yeni
  // action ID'lerini yükler. Bu durumda birincil eylemi "Sayfayı yenile" yaparız.
  const isStale = isStaleServerActionError(error.message);

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
        {isStale ? (
          <>
            <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: 10 }}>Uygulama güncellendi</h2>
            <p style={{ color: "var(--text-mid)", marginBottom: 24, fontSize: "var(--fs-base)" }}>
              Bu sekme açıkken yeni bir sürüm yayınlandı. Kaldığın yerden devam etmek için
              sayfayı yenilemen yeterli — verilerin kaybolmaz.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => window.location.reload()} className="btn btn-primary">
                Sayfayı yenile
              </button>
              <Link href="/" className="btn btn-secondary">
                Ana sayfa
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: "var(--fs-h3)", marginBottom: 10 }}>Beklenmeyen bir hata oluştu</h2>
            <p style={{ color: "var(--text-mid)", marginBottom: 24, fontSize: "var(--fs-base)" }}>
              Görüntülemeye çalıştığın sayfa şu an yüklenemedi. Bu genelde geçicidir — tekrar
              deneyebilir veya ana sayfaya dönebilirsin.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => unstable_retry()} className="btn btn-primary">
                Tekrar dene
              </button>
              <button onClick={() => window.location.reload()} className="btn btn-secondary">
                Sayfayı yenile
              </button>
              <Link href="/" className="btn btn-ghost">
                Ana sayfa
              </Link>
            </div>
          </>
        )}
        {error.digest && (
          <p className="font-mono" style={{ marginTop: 20, fontSize: "var(--fs-xs)", color: "var(--text-low)" }}>
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
