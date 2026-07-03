"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutAction } from "@/lib/auth-actions"

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/leads", label: "Leads (CRM)" },
  { href: "/admin/pipeline", label: "Pipeline" },
  { href: "/admin/propiedades", label: "Propiedades" },
  { href: "/admin/mapa", label: "Mapa" },
  { href: "/admin/analitica", label: "Analítica" },
  { href: "/admin/alertas", label: "Alertas" },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`rounded-lg px-3 py-2 text-sm transition-colors duration-[var(--dur-fast)] ${
              active ? "bg-gold text-ink font-medium" : "text-paper/75 hover:bg-white/10 hover:text-paper"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminNav({ user }: { user: { name: string; role: string } }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden w-60 shrink-0 flex-col justify-between bg-navy p-4 md:flex">
        <div>
          <Link href="/admin" className="mb-6 block px-3">
            <span className="font-display text-xl text-paper">Floridian First</span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-gold">LeadEngine</span>
          </Link>
          <NavLinks pathname={pathname} />
        </div>
        <div className="border-t border-white/15 pt-4">
          <p className="px-3 text-sm text-paper">{user.name}</p>
          <p className="px-3 text-xs text-paper/60 capitalize">{user.role}</p>
          <form action={logoutAction} className="mt-2 px-3">
            <button type="submit" className="text-xs text-paper/60 transition-colors hover:text-paper">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-navy px-4 py-3 md:hidden">
        <Link href="/admin" className="font-display text-lg text-paper">
          Floridian First
        </Link>
        <button
          type="button"
          aria-label="Menú"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-paper"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {open && (
        <div className="bg-navy px-4 pb-4 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <form action={logoutAction} className="mt-3">
            <button type="submit" className="text-xs text-paper/60">Cerrar sesión</button>
          </form>
        </div>
      )}
    </>
  )
}
