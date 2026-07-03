"use client"

import { useState, useTransition } from "react"
import { updateLeadStatus, addLeadNote } from "@/lib/lead-actions"

const STATUSES = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Calificado" },
  { value: "visit", label: "Visita" },
  { value: "offer", label: "Oferta" },
  { value: "won", label: "Ganado" },
  { value: "lost", label: "Perdido" },
]

export function LeadStatusControl({ leadId, status }: { leadId: string; status: string }) {
  const [pending, start] = useTransition()
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Estado:</span>
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => start(() => updateLeadStatus(leadId, e.target.value))}
        className="rounded-lg border border-line bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-gold-deep disabled:opacity-60"
      >
        {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {pending && <span className="text-xs text-muted">guardando…</span>}
    </label>
  )
}

export function AddNote({ leadId }: { leadId: string }) {
  const [value, setValue] = useState("")
  const [pending, start] = useTransition()

  function submit() {
    const content = value.trim()
    if (!content) return
    start(async () => {
      await addLeadNote(leadId, content)
      setValue("")
    })
  }

  return (
    <div className="grid gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        placeholder="Añade una nota de seguimiento (llamada, email, visita…)"
        className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !value.trim()}
        className="justify-self-start rounded-full bg-navy px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Añadir nota"}
      </button>
    </div>
  )
}
