"use client";

import type { CSSProperties, ReactNode } from "react";
import { useReveal, useCountUp } from "./hooks";

/** Sayfa genelinde scroll-reveal'ı etkinleştirir (bir kez mount edilir). */
export function RevealProvider({ children }: { children: ReactNode }) {
  useReveal();
  return <>{children}</>;
}

/** Reveal edilen sarmalayıcı — index ile stagger gecikmesi. */
export function Reveal({
  children,
  i = 0,
  as: Tag = "div",
  className = "",
  style,
}: {
  children: ReactNode;
  i?: number;
  as?: "div" | "section" | "li" | "article" | "span";
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Tag className={`reveal ${className}`} style={{ ["--i" as string]: i, ...style }}>
      {children}
    </Tag>
  );
}

/** Sayaç — görünürlükte animasyonlu. */
export function Counter({
  value,
  duration,
  decimals = 0,
  suffix = "",
  prefix = "",
  className = "",
}: {
  value: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useCountUp(value, duration, decimals);
  return (
    <span className={className}>
      {prefix}
      <span ref={ref} className="tnum">
        0
      </span>
      {suffix}
    </span>
  );
}
