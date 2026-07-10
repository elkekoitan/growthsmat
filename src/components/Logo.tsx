import type { CSSProperties } from "react";

/**
 * SmartGrowth OS marka markı.
 * Konsept: yükselen filiz + büyüme çizgisi. İki simetrik yaprak alttaki
 * tohumdan çıkar; orta damar yukarı doğru bir büyüme ivmesine dönüşür.
 * Tek renk (currentColor) veya orman gradyanıyla çalışır; 16px'te okunur.
 */
export function Mark({
  size = 32,
  gradient = true,
  className,
  style,
}: {
  size?: number;
  gradient?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const id = gradient ? "sg-mark-grad" : undefined;
  const fill = gradient ? `url(#${id})` : "currentColor";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {gradient && (
        <defs>
          <linearGradient id={id} x1="6" y1="28" x2="26" y2="4" gradientUnits="userSpaceOnUse">
            <stop stopColor="#25573C" />
            <stop offset="0.55" stopColor="#3E865D" />
            <stop offset="1" stopColor="#5FA37B" />
          </linearGradient>
        </defs>
      )}
      {/* Sol yaprak */}
      <path
        d="M15 17.4C15 17.4 12.9 10.2 5.6 8.9C4.7 8.7 3.9 9.6 4.2 10.5C6.1 16.9 11.6 18.6 15 18.7V17.4Z"
        fill={fill}
        opacity="0.72"
      />
      {/* Sağ yaprak */}
      <path
        d="M17 15.2C17 15.2 18.7 6.9 26.4 4.9C27.4 4.7 28.2 5.6 27.9 6.6C25.9 13.9 20.6 16.4 17 16.6V15.2Z"
        fill={fill}
      />
      {/* Gövde + büyüme çizgisi (tohumdan yukarı) */}
      <path
        d="M16 28V14.5C16 11 17.3 8 19.6 5.7"
        stroke={fill}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Tohum */}
      <circle cx="16" cy="27.4" r="2.1" fill={fill} />
    </svg>
  );
}

export function Logo({
  size = 30,
  showText = true,
  textClassName,
}: {
  size?: number;
  showText?: boolean;
  textClassName?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <Mark size={size} />
      {showText && (
        <span
          className={textClassName}
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: size * 0.62,
            letterSpacing: "-0.02em",
            color: "var(--text-hi)",
            lineHeight: 1,
          }}
        >
          SmartGrowth<span style={{ color: "var(--primary)" }}> OS</span>
        </span>
      )}
    </span>
  );
}
