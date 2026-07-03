import Link from "next/link"
import {
  getFeaturedProperties,
  getZoneSummary,
  getActivePropertyCount,
} from "@/lib/queries"
import { formatCompactUSD } from "@/lib/format"
import { PropertyCard } from "@/components/site/PropertyCard"

export default async function HomePage() {
  const [featured, zones, activeCount] = await Promise.all([
    getFeaturedProperties(6),
    getZoneSummary(),
    getActivePropertyCount(),
  ])

  return (
    <>
      {/* Hero — Marquee */}
      <section className="relative overflow-hidden border-b border-line bg-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1
              className="font-display text-5xl leading-[1.03] text-ink sm:text-6xl lg:text-7xl"
              style={{ overflowWrap: "anywhere", minWidth: 0 }}
            >
              Tu próxima casa en Coral Gables.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              Inmobiliaria boutique. Compramos, vendemos y valoramos viviendas en
              Coral Gables, South Miami y Kendall con atención de verdad.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/propiedades"
                className="inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper transition-colors duration-[var(--dur-fast)] hover:bg-ink"
              >
                Ver propiedades
              </Link>
              <Link
                href="/valuacion"
                className="inline-flex items-center justify-center rounded-full border border-gold-deep px-6 py-3 text-sm font-medium text-gold-deep transition-colors duration-[var(--dur-fast)] hover:bg-gold hover:text-ink"
              >
                Valorar mi casa gratis
              </Link>
            </div>
            <p className="mt-6 text-sm text-muted">
              <span className="font-medium text-ink">{activeCount} propiedades</span>{" "}
              activas ahora en nuestras zonas.
            </p>
          </div>

          {/* Zone quick stats — real data */}
          <div className="grid gap-3">
            {zones.map((z) => (
              <Link
                key={z.zone}
                href={`/propiedades?zone=${encodeURIComponent(z.zone)}`}
                className="flex items-center justify-between rounded-xl border border-line bg-paper-2 px-5 py-4 transition-colors duration-[var(--dur-fast)] hover:border-gold-deep"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{z.zone}</p>
                  <p className="text-xs text-muted">{z.count} en venta</p>
                </div>
                <p className="font-display text-xl text-gold-deep">
                  {formatCompactUSD(z.avgPrice)}
                  <span className="ml-1 text-xs text-muted">prom.</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured listings */}
      <section className="mx-auto w-full max-w-6xl px-5 py-16 sm:py-20">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">Selección destacada</h2>
          <Link
            href="/propiedades"
            className="shrink-0 text-sm text-gold-deep transition-colors hover:text-ink"
          >
            Ver todas →
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* Valuation lead magnet band */}
      <section className="bg-navy text-paper">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-16 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2
              className="font-display text-3xl leading-tight sm:text-4xl"
              style={{ overflowWrap: "anywhere", minWidth: 0 }}
            >
              ¿Cuánto vale tu casa hoy?
            </h2>
            <p className="mt-4 max-w-lg text-paper/75">
              Recibe una estimación inmediata basada en tu zona y las características
              de tu vivienda. Sin compromiso, en menos de un minuto.
            </p>
          </div>
          <Link
            href="/valuacion"
            className="inline-flex items-center justify-center rounded-full bg-gold px-7 py-3.5 text-sm font-medium text-ink transition-colors duration-[var(--dur-fast)] hover:bg-paper"
          >
            Obtener mi valuación
          </Link>
        </div>
      </section>
    </>
  )
}
