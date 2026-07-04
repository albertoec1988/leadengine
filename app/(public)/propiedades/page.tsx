import type { Metadata } from "next"
import Link from "next/link"
import { getProperties, ZONES } from "@/lib/queries"
import { PropertyCard } from "@/components/site/PropertyCard"
import { PropertyMap } from "@/components/site/PropertyMap"
import { formatUSD } from "@/lib/format"

// Los datos vienen de la base de datos; renderizamos en cada request para no
// depender de la BD durante el build (igual que la home y el mapa).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Propiedades",
  description: "Explora propiedades en venta en Coral Gables, South Miami, Kendall, Miami y Fort Lauderdale.",
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
  searchParams: Promise<{ zone?: string; status?: string; beds?: string; view?: string }>
}) {
  const sp = await searchParams
  const view = sp.view === "map" ? "map" : "list"
  // En la vista mapa, mostramos solo propiedades en venta por defecto.
  const effectiveStatus = view === "map" ? (sp.status || "for_sale") : sp.status
  const properties = await getProperties({
    zone: sp.zone || undefined,
    status: effectiveStatus || undefined,
    beds: sp.beds ? Number(sp.beds) : undefined,
  })

  const selectClass =
    "rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Propiedades</h1>
      <p className="mt-3 text-muted">
        {properties.length} {properties.length === 1 ? "propiedad" : "propiedades"}
        {view === "map" && !sp.status ? " en venta" : ""}
        {sp.zone ? ` en ${sp.zone}` : " en nuestras zonas"}.
      </p>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
        {view === "map" ? <input type="hidden" name="view" value="map" /> : null}
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

      {(() => {
        const qs = (v: string) => {
          const params = new URLSearchParams()
          if (sp.zone) params.set("zone", sp.zone)
          if (sp.status) params.set("status", sp.status)
          if (sp.beds) params.set("beds", sp.beds)
          if (v === "map") params.set("view", "map")
          const s = params.toString()
          return s ? `?${s}` : ""
        }
        const chip = (active: boolean) =>
          `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active ? "bg-navy text-paper" : "border border-line text-muted hover:text-ink"
          }`
        return (
          <div className="mt-4 flex items-center gap-2">
            <Link href={`/propiedades${qs("list")}`} className={chip(view === "list")}>Lista</Link>
            <Link href={`/propiedades${qs("map")}`} className={chip(view === "map")}>Mapa</Link>
          </div>
        )
      })()}

      {properties.length === 0 ? (
        <p className="mt-16 text-center text-muted">
          No hay propiedades con esos criterios. Prueba a ampliar el filtro.
        </p>
      ) : view === "map" ? (
        <div className="mt-10">
          <PropertyMap
            height="65vh"
            points={properties.map((p) => ({
              id: p.id,
              title: p.title,
              lat: p.lat,
              lng: p.lng,
              price: formatUSD(p.price),
              status: p.status,
              zone: p.zone,
              href: `/propiedades/${p.id}`,
            }))}
          />
        </div>
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
