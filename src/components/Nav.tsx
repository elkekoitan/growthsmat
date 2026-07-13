"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useTheme } from "./hooks";
import { Moon, Sun, Menu, X, ArrowRight } from "./icons";

const NAV_LINKS = [
  { href: "/plan", label: "Plan" },
  { href: "/pazar", label: "Pazar" },
  { href: "/asistan", label: "Asistan" },
  { href: "/urunler", label: "Ürün Kâşifi" },
  { href: "/gorevler", label: "Görevler" },
  { href: "/mikrofiliz", label: "Mikro Filiz" },
  { href: "/panel", label: "Proje Paneli" },
];

export function Nav() {
  const [theme, toggle] = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- route değişince menüyü kasıtlı kapatıyor
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={scrolled ? "glass" : ""}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "background 250ms ease, border-color 250ms ease",
        borderBottom: scrolled ? undefined : "1px solid transparent",
      }}
    >
      <nav className="container-x" style={{ display: "flex", alignItems: "center", height: 68, gap: 20 }}>
        <Link href="/" aria-label="SmartGrowth OS ana sayfa">
          <Logo size={30} />
        </Link>

        <div className="nav-links" style={{ display: "flex", gap: 4, marginLeft: 12, flex: 1 }}>
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: "var(--fs-base)",
                  fontWeight: 500,
                  color: active ? "var(--primary)" : "var(--text-mid)",
                  background: active ? "color-mix(in srgb, var(--primary) 9%, transparent)" : "transparent",
                  transition: "color 150ms, background 150ms",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={toggle}
            aria-label="Temayı değiştir"
            className="btn btn-ghost btn-sm"
            style={{ width: 38, height: 38, padding: 0 }}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link href="/giris" className="btn btn-ghost btn-sm nav-cta">
            Giriş
          </Link>
          <Link href="/kayit" className="btn btn-primary btn-sm nav-cta">
            Ücretsiz başla <ArrowRight size={16} />
          </Link>
          <button
            className="nav-burger btn btn-ghost btn-sm"
            style={{ width: 38, height: 38, padding: 0, display: "none" }}
            aria-label="Menü"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="glass" style={{ padding: "8px 0 16px", animation: "fade-up 250ms var(--ease-out) both" }}>
          <div className="container-x" style={{ display: "grid", gap: 4 }}>
            {[...NAV_LINKS, { href: "/giris", label: "Giriş" }, { href: "/kayit", label: "Kayıt ol" }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  fontWeight: 500,
                  color: pathname === l.href ? "var(--primary)" : "var(--text-hi)",
                  background: pathname === l.href ? "color-mix(in srgb, var(--primary) 9%, transparent)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 940px) {
          .nav-links { display: none !important; }
          .nav-burger { display: inline-flex !important; }
          .nav-cta { display: none !important; }
        }
      `}</style>
    </header>
  );
}
