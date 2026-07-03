import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getPropertyById } from "@/lib/queries"
import { formatUSD, formatSqft } from "@/lib/format"
import { PropertyStatusBadge } from "@/components/site/StatusBadge"
import { PropertyContactForm } from "@/components/site/PropertyContactForm"

// El detalle depende de un id dinámico y consulta la BD; se renderiza en cada
// request para no instanciar Prisma ni consultar la BD durante el build.
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const property = await getPropertyById(id)
  return { title: property ? property.title : "Propiedad" }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await getPropertyById(id)
  if (!property) notFound()

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-10 sm:py-14">
      <Link href="/propiedades" className="text-sm text-muted transition-colors hover:text-ink">
        ← Volver a propiedades
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-sand">
            <Image
              src={property.photoUrl}
              alt={property.title}
              fill
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
              priority
            />
            <div className="absolute left-4 top-4">
              <PropertyStatusBadge status={property.status} />
            </div>
          </div>

          <div className="mt-6">
            <p className="font-display text-4xl text-ink sm:text-5xl">{formatUSD(property.price)}</p>
            <h1
              className="mt-2 text-xl font-medium text-ink"
              style={{ overflowWrap: "anywhere", minWidth: 0 }}
            >
              {property.title}
            </h1>
            <p className="mt-1 text-muted">{property.address}</p>

            <dl className="mt-6 grid grid-cols-3 gap-4 border-y border-line py-5 text-center">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Habitaciones</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{property.bedrooms}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Baños</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{property.bathrooms}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted">Superficie</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{formatSqft(property.areaSqft)}</dd>
              </div>
            </dl>

            <p className="mt-6 leading-relaxed text-ink">
              Excepcional propiedad en {property.zone}. Espacios luminosos, acabados
              de calidad y una ubicación privilegiada cerca de los mejores colegios,
              comercio y restaurantes de la zona. Contáctanos para agendar una visita.
            </p>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PropertyContactForm
            propertyId={property.id}
            zone={property.zone}
            propertyTitle={property.title}
          />
        </aside>
      </div>
    </section>
  )
}
