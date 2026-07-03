"use client"

import { useTransition } from "react"
import { moveOpportunityStage } from "@/lib/lead-actions"

const STAGES = [
  { value: "new", label: "Nuevo" },
  { value: "contacted", label: "Contactado" },
  { value: "visit", label: "Visita" },
  { value: "offer", label: "Oferta" },
  { value: "closed", label: "Cerrado" },
]

export function StageControl({ opportunityId, stage }: { opportunityId: string; stage: string }) {
  const [pending, start] = useTransition()
  return (
    <select
      defaultValue={stage}
      disabled={pending}
      onChange={(e) => start(() => moveOpportunityStage(opportunityId, e.target.value))}
      aria-label="Mover etapa"
      className="w-full rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink outline-none focus:border-gold-deep disabled:opacity-60"
    >
      {STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  )
}
