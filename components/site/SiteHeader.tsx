"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

const NAV = [
  { href: "/propiedades", label: "Listings" },
  { href: "/valuacion", label: "Home Valuation" },
  { href: "/mapa", label: "Map" },
  { href: "/contacto", label: "Contact" },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ffr-navy/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" onClick={() => setOpen(false)} className="flex items-center">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={150}
            height={40}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-montserrat text-sm text-white/80 transition-colors duration-[var(--dur-fast)] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/admin" className="text-sm text-white/60 transition-colors hover:text-white">
            Team access
          </Link>
          <Link
            href="/valuacion"
            className="rounded-full border border-white/70 px-4 py-2 font-montserrat text-sm font-semibold text-white transition-colors duration-[var(--dur-fast)] hover:bg-white hover:text-ffr-navy"
          >
            What&apos;s my home worth?
          </Link>
        </div>

        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 md:hidden"
        >
          <span className="text-lg leading-none text-white">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-ffr-navy px-5 pb-5 md:hidden">
          <nav className="flex flex-col gap-1 pt-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 font-montserrat text-sm text-white/85 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/10"
            >
              Team access
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
