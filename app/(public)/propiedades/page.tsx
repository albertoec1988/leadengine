import type { Metadata } from "next"
import { getProperties, ZONES } from "@/lib/queries"
import { PropertyCard } from "@/components/site/PropertyCard"

export const metadata: Metadata = {
  title: "Propiedades",
  description: "Explora propiedades en venta en Coral Gables, South Miami y Kendall.",
}

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "for_sale", label: "En venta" },
  { value: "pending", label: "Pendiente" },
  { value: "sold", label: "Vendida" },
]

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ zone?: string; status?: string; beds?: string }>
}) {
  const sp = await searchParams
  const properties = await getProperties({
    zone: sp.zone || undefined,
    status: sp.status || undefined,
    beds: sp.beds ? Number(sp.beds) : undefined,
  })

  const selectClass =
    "rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Propiedades</h1>
      <p className="mt-3 text-muted">
        {properties.length} {properties.length === 1 ? "propiedad" : "propiedades"}
        {sp.zone ? ` en ${sp.zone}` : " en nuestras zonas"}.
      </p>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="zone" className="text-xs uppercase tracking-wide text-muted">Zona</label>
          <select id="zone" name="zone" defaultValue={sp.zone ?? ""} className={selectClass}>
            <option value="">Todas las zonas</option>
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs uppercase tracking-wide text-muted">Estado</label>
          <select id="status" name="status" defaultValue={sp.status ?? ""} className={selectClass}>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="beds" className="text-xs uppercase tracking-wide text-muted">Hab. mínimas</label>
          <select id="beds" name="beds" defaultValue={sp.beds ?? ""} className={selectClass}>
            <option value="">Cualquiera</option>
            {[2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+</option>)}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-full bg-navy px-5 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink"
        >
          Filtrar
        </button>
      </form>

      {properties.length === 0 ? (
        <p className="mt-16 text-center text-muted">
          No hay propiedades con esos criterios. Prueba a ampliar el filtro.
        </p>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </section>
  )
}
