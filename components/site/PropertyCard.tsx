import Image from "next/image"
import Link from "next/link"
import type { Property } from "@/lib/models"
import { formatUSD, formatSqft } from "@/lib/format"
import { PropertyStatusBadge } from "@/components/site/StatusBadge"

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/propiedades/${property.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-paper transition-shadow duration-[var(--dur-mid)] ease-[var(--ease-out)] hover:shadow-[0_12px_40px_-16px_oklch(32%_0.062_258_/_0.35)]"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        <Image
          src={property.photoUrl}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-[var(--dur-mid)] ease-[var(--ease-out)] group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="font-display text-2xl text-ink">{formatUSD(property.price)}</p>
        <h3 className="text-sm font-medium text-ink" style={{ minWidth: 0, overflowWrap: "anywhere" }}>
          {property.title}
        </h3>
        <p className="text-sm text-muted">{property.zone}</p>
        <p className="mt-2 border-t border-line pt-2 text-xs text-muted">
          {property.bedrooms} hab · {property.bathrooms} baños · {formatSqft(property.areaSqft)}
        </p>
      </div>
    </Link>
  )
}
