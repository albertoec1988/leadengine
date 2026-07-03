"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { simulateInbound } from "@/lib/actions"

const CHANNELS: { value: "whatsapp" | "instagram" | "web"; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "web", label: "Web" },
]

export function SimulateInbound() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  function fire(channel: "whatsapp" | "instagram" | "web") {
    start(async () => {
      await simulateInbound(channel)
      setMsg(`Nuevo lead de ${channel} consolidado en el CRM.`)
      router.refresh()
    })
  }

  return (
    <div className="rounded-xl border border-line bg-paper p-5">
      <h2 className="font-display text-lg text-ink">Captura omnicanal (demo)</h2>
      <p className="mt-1 text-sm text-muted">
        Simula un lead entrante desde un canal externo y compruébalo entrando al CRM al instante.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.value}
            type="button"
            disabled={pending}
            onClick={() => fire(c.value)}
            className="rounded-full border border-navy px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-navy hover:text-paper disabled:opacity-50"
          >
            + {c.label}
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 text-sm text-success">{msg}</p>}
    </div>
  )
}
