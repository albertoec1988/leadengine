import Link from "next/link"
import Image from "next/image"
import { getMapProperties } from "@/lib/admin-queries"
import { formatUSD, formatSqft } from "@/lib/format"
import { PageHeader } from "@/components/admin/ui"
import { PropertyStatusControl } from "@/components/admin/PropertyStatusControl"
import { FeaturedToggle } from "@/components/admin/FeaturedToggle"

export const dynamic = "force-dynamic"

export default async function AdminPropertiesPage() {
  const properties = await getMapProperties()

  return (
    <>
      <PageHeader title="Propiedades" subtitle={`${properties.length} inmuebles en el catálogo`}>
        <Link href="/admin/propiedades/nueva" className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink hover:bg-gold-deep hover:text-paper">
          + Nueva propiedad
        </Link>
      </PageHeader>

      <div className="p-5 sm:p-8">
        <div className="overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-2 py-3"></th>
                <th className="px-4 py-3 font-medium">Propiedad</th>
                <th className="px-4 py-3 font-medium">Zona</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Detalles</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0 hover:bg-paper-2">
                  <td className="px-2 py-3 text-center">
                    <FeaturedToggle id={p.id} isFeatured={p.isFeatured} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-sand">
                        <Image src={p.photoUrl} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <span className="font-medium text-ink">{p.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.zone}</td>
                  <td className="px-4 py-3 font-display text-base text-ink">{formatUSD(p.price)}</td>
                  <td className="px-4 py-3 text-muted">{p.bedrooms}h · {p.bathrooms}b · {formatSqft(p.areaSqft)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <PropertyStatusControl id={p.id} status={p.status} />
                      <Link
                        href={`/admin/propiedades/${p.id}/editar`}
                        className="text-sm font-medium text-gold-deep hover:underline"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/propiedades/${p.id}`} className="text-xs text-gold-deep hover:text-ink">Ver en web →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
