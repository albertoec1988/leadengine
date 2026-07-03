"use client"

import { useState } from "react"
import Link from "next/link"

const NAV = [
  { href: "/propiedades", label: "Propiedades" },
  { href: "/valuacion", label: "Valuación" },
  { href: "/mapa", label: "Mapa" },
  { href: "/contacto", label: "Contacto" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-xl text-ink">Floridian First</span>
          <span className="hidden text-[11px] uppercase tracking-[0.2em] text-gold-deep sm:inline">
            Realty
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted transition-colors duration-[var(--dur-fast)] hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/admin" className="text-sm text-muted transition-colors hover:text-ink">
            Acceso equipo
          </Link>
          <Link
            href="/valuacion"
            className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] hover:bg-gold-deep hover:text-paper"
          >
            Valorar mi casa
          </Link>
        </div>

        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-line md:hidden"
        >
          <span className="text-lg leading-none text-ink">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-paper md:hidden">
          <nav className="mx-auto flex w-full max-w-6xl flex-col px-5 py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-3 text-sm text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/valuacion"
              onClick={() => setOpen(false)}
              className="mt-3 rounded-full bg-gold px-4 py-3 text-center text-sm font-medium text-ink"
            >
              Valorar mi casa
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="py-3 text-center text-sm text-muted"
            >
              Acceso equipo
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
