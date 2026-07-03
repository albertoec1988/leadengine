"use client"

import { useActionState } from "react"
import { createProperty, type CreatePropertyResult } from "@/lib/property-actions"

const ZONES = ["Coral Gables", "South Miami", "Kendall"]
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

export function NewPropertyForm() {
  const [state, action, pending] = useActionState<CreatePropertyResult | null, FormData>(createProperty, null)

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-paper p-6">
      <div>
        <label className={labelClass} htmlFor="title">Título</label>
        <input id="title" name="title" required className={fieldClass} placeholder="3BR Coral Gables Villa" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="zone">Zona</label>
          <select id="zone" name="zone" className={fieldClass} defaultValue="Coral Gables">
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="price">Precio (USD)</label>
          <input id="price" name="price" type="number" min={1} required className={fieldClass} placeholder="850000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="areaSqft">Superficie (sqft)</label>
          <input id="areaSqft" name="areaSqft" type="number" min={0} className={fieldClass} placeholder="2000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Dirección</label>
          <input id="address" name="address" className={fieldClass} placeholder="123 Coral Way" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bedrooms">Habitaciones</label>
          <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={3} className={fieldClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="bathrooms">Baños</label>
          <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={2} className={fieldClass} />
        </div>
      </div>
      {state && !state.ok && <p role="alert" className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="justify-self-start rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Crear propiedad"}
      </button>
    </form>
  )
}
