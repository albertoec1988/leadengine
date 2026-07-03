import type { Metadata } from "next"
import { getProperties } from "@/lib/queries"
import { formatUSD } from "@/lib/format"
import { PropertyMap, type MapPoint } from "@/components/site/PropertyMap"

export const metadata: Metadata = {
  title: "Mapa de propiedades",
  description: "Explora nuestras propiedades sobre el mapa de Coral Gables, South Miami y Kendall.",
}

export const dynamic = "force-dynamic"

export default async function MapaPage() {
  const properties = await getProperties()
  const points: MapPoint[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    price: formatUSD(p.price),
    status: p.status,
    zone: p.zone,
    href: `/propiedades/${p.id}`,
  }))

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Mapa de propiedades</h1>
      <p className="mt-3 text-muted">
        {points.length} propiedades ubicadas en Coral Gables, South Miami y Kendall.
        Selecciona un punto para ver los detalles.
      </p>
      <div className="mt-8">
        <PropertyMap points={points} />
      </div>
      <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted">
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#1f3a5f" }} /> En venta</span>
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#b8860b" }} /> Pendiente</span>
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#8a8a8a" }} /> Vendida</span>
      </div>
    </section>
  )
}
