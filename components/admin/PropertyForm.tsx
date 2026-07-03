"use client"

import { useActionState } from "react"
import {
  createProperty,
  updateProperty,
  type CreatePropertyResult,
} from "@/lib/property-actions"

const ZONES = ["Coral Gables", "South Miami", "Kendall"]
const STATUS = [
  { value: "for_sale", label: "En venta" },
  { value: "pending", label: "Reservada" },
  { value: "sold", label: "Vendida" },
]
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

export type PropertyFormValues = {
  id: string
  title: string
  zone: string
  price: number
  bedrooms: number
  bathrooms: number
  areaSqft: number
  address: string
  status: string
}

export function PropertyForm({
  mode,
  property,
}: {
  mode: "create" | "edit"
  property?: PropertyFormValues
}) {
  const boundAction =
    mode === "edit" && property
      ? (prev: CreatePropertyResult | null, fd: FormData) =>
          updateProperty(property.id, prev, fd)
      : createProperty

  const [state, action, pending] = useActionState<CreatePropertyResult | null, FormData>(
    boundAction,
    null,
  )

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-paper p-6">
      <div>
        <label className={labelClass} htmlFor="title">Título</label>
        <input id="title" name="title" required defaultValue={property?.title}
          className={fieldClass} placeholder="3BR Coral Gables Villa" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="zone">Zona</label>
          <select id="zone" name="zone" className={fieldClass} defaultValue={property?.zone ?? "Coral Gables"}>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="price">Precio (USD)</label>
          <input id="price" name="price" type="number" min={1} required defaultValue={property?.price}
            className={fieldClass} placeholder="850000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="areaSqft">Superficie (sqft)</label>
          <input id="areaSqft" name="areaSqft" type="number" min={0} defaultValue={property?.areaSqft}
            className={fieldClass} placeholder="2000" />
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Dirección</label>
          <input id="address" name="address" defaultValue={property?.address}
            className={fieldClass} placeholder="123 Coral Way" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bedrooms">Habitaciones</label>
          <input id="bedrooms" name="bedrooms" type="number" min={0} defaultValue={property?.bedrooms}
            className={fieldClass} placeholder="3" />
        </div>
        <div>
          <label className={labelClass} htmlFor="bathrooms">Baños</label>
          <input id="bathrooms" name="bathrooms" type="number" min={0} defaultValue={property?.bathrooms}
            className={fieldClass} placeholder="2" />
        </div>
        {mode === "edit" && (
          <div>
            <label className={labelClass} htmlFor="status">Estado</label>
            <select id="status" name="status" className={fieldClass} defaultValue={property?.status ?? "for_sale"}>
              {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <button type="submit" disabled={pending}
        className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gold-deep disabled:opacity-60">
        {pending ? "Guardando…" : mode === "edit" ? "Guardar cambios" : "Crear propiedad"}
      </button>
    </form>
  )
}
