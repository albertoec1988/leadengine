"use client"

import { useState } from "react"
import { submitValuation, type ValuationResponse } from "@/lib/actions"
import { formatUSD } from "@/lib/format"

const ZONES = ["Coral Gables", "South Miami", "Kendall"]
const CONDITIONS: { value: string; label: string }[] = [
  { value: "excellent", label: "Excelente" },
  { value: "good", label: "Bueno" },
  { value: "fair", label: "Aceptable" },
  { value: "needs_work", label: "A reformar" },
]

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

export function ValuationForm() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<Extract<ValuationResponse, { ok: true }> | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const res = await submitValuation({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      zone: String(fd.get("zone") ?? "Coral Gables"),
      areaSqft: Number(fd.get("areaSqft") ?? 0),
      bedrooms: Number(fd.get("bedrooms") ?? 0),
      bathrooms: Number(fd.get("bathrooms") ?? 0),
      condition: String(fd.get("condition") ?? "good") as never,
    })
    setPending(false)
    if (res.ok) setResult(res)
    else setError(res.error)
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-gold-deep bg-paper-2 p-8 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Estimación de valor
        </p>
        <p className="mt-3 font-display text-5xl text-ink">{formatUSD(result.estimate)}</p>
        <p className="mt-2 text-sm text-muted">
          Rango estimado {formatUSD(result.low)} – {formatUSD(result.high)}
        </p>
        {result.rationale && (
          <p className="mx-auto mt-4 max-w-md rounded-lg bg-paper px-4 py-3 text-sm text-ink">
            {result.rationale}
          </p>
        )}
        <p className="mt-3 text-xs uppercase tracking-wide text-muted">
          {result.source === "ai" ? "Estimación asistida por IA" : "Modelo de comparables"}
        </p>
        <p className="mx-auto mt-5 max-w-sm text-sm text-ink">
          Gracias. Un agente de Floridian First te contactará con un análisis
          detallado y comparables reales de tu zona.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-line bg-paper-2 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">Nombre</label>
          <input id="name" name="name" required className={fieldClass} placeholder="Tu nombre" />
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className={fieldClass} placeholder="tu@email.com" />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Teléfono (opcional)</label>
          <input id="phone" name="phone" className={fieldClass} placeholder="+1 305 …" />
        </div>
        <div>
          <label className={labelClass} htmlFor="zone">Zona</label>
          <select id="zone" name="zone" className={fieldClass} defaultValue="Coral Gables">
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor="areaSqft">Superficie (sqft)</label>
          <input id="areaSqft" name="areaSqft" type="number" min={200} required className={fieldClass} placeholder="2000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bedrooms">Habitaciones</label>
          <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={3} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="bathrooms">Baños</label>
          <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={2} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="condition">Estado</label>
          <select id="condition" name="condition" className={fieldClass} defaultValue="good">
            {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] hover:bg-gold-deep hover:text-paper disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Calculando…" : "Obtener mi valuación"}
      </button>
      <p className="text-xs text-muted">
        Al enviar aceptas que un agente de Floridian First te contacte. Estimación
        orientativa basada en datos de mercado de tu zona.
      </p>
    </form>
  )
}
