import { propertyStatusLabel } from "@/lib/format"

const STYLES: Record<string, string> = {
  for_sale: "bg-navy text-paper",
  pending: "bg-gold text-ink",
  sold: "bg-sand text-muted line-through",
}

export function PropertyStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${
        STYLES[status] ?? "bg-sand text-ink"
      }`}
    >
      {propertyStatusLabel(status)}
    </span>
  )
}
