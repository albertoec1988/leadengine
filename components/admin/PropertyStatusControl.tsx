"use client"

import { useTransition } from "react"
import { updatePropertyStatus } from "@/lib/property-actions"

const STATUS = [
  { value: "for_sale", label: "En venta" },
  { value: "pending", label: "Pendiente" },
  { value: "sold", label: "Vendida" },
]

export function PropertyStatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition()
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => start(() => updatePropertyStatus(id, e.target.value))}
      aria-label="Estado de la propiedad"
      className="rounded-md border border-line bg-paper px-2 py-1 text-xs text-ink outline-none focus:border-gold-deep disabled:opacity-60"
    >
      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
    </select>
  )
}
