"use client"

// CTA con micro-animación: el texto se desplaza y la flecha entra en hover (<250ms).
// Sin JS de animación: es CSS puro vía Tailwind (group-hover), funciona siempre.

import Link from "next/link"

export function AnimatedCta({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string
  children: React.ReactNode
  variant?: "solid" | "outline"
  className?: string
}) {
  const base =
    "group inline-flex items-center gap-2 overflow-hidden rounded-full px-7 py-3.5 text-sm font-semibold uppercase tracking-wider transition-colors duration-200"
  const styles =
    variant === "solid"
      ? "bg-ffr-navy text-white hover:bg-ffr-navy/90"
      : "border-2 border-white/90 bg-ffr-navy/40 text-white backdrop-blur-sm hover:bg-white hover:text-ffr-navy"
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      <span className="transition-transform duration-200 group-hover:-translate-x-1">{children}</span>
      <span
        aria-hidden
        className="translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
      >
        →
      </span>
    </Link>
  )
}
