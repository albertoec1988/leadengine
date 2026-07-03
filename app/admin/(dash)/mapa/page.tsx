import { getMapProperties } from "@/lib/admin-queries"
import { formatUSD } from "@/lib/format"
import { PageHeader } from "@/components/admin/ui"
import { PropertyMap, type MapPoint } from "@/components/site/PropertyMap"

export const dynamic = "force-dynamic"

export default async function AdminMapPage() {
  const properties = await getMapProperties()
  const points: MapPoint[] = properties.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    price: formatUSD(p.price),
    status: p.status,
    zone: p.zone,
    href: `/admin/propiedades`,
  }))

  return (
    <>
      <PageHeader title="Mapa" subtitle={`${points.length} propiedades por zona`} />
      <div className="p-5 sm:p-8">
        <PropertyMap points={points} height="72vh" />
        <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted">
          <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#1f3a5f" }} /> En venta</span>
          <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#b8860b" }} /> Pendiente</span>
          <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-full" style={{ background: "#8a8a8a" }} /> Vendida</span>
        </div>
      </div>
    </>
  )
}
