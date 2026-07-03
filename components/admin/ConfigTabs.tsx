"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const TABS = [
  { href: "/admin/configuracion/integraciones", label: "Integraciones" },
  { href: "/admin/configuracion/general", label: "General" },
  { href: "/admin/configuracion/usuarios", label: "Usuarios" },
]

export function ConfigTabs() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex gap-1 border-b border-line">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(t.href + "/")
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active
                ? "border-gold-deep font-medium text-ink"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
