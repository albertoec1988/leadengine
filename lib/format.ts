const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function formatUSD(value: number): string {
  return USD.format(value)
}

export function formatCompactUSD(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

export function formatSqft(value: number): string {
  return `${new Intl.NumberFormat("en-US").format(value)} sqft`
}

const PROPERTY_STATUS_LABEL: Record<string, string> = {
  for_sale: "En venta",
  pending: "Pendiente",
  sold: "Vendida",
}

export function propertyStatusLabel(status: string): string {
  return PROPERTY_STATUS_LABEL[status] ?? status
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  visit: "Visita",
  offer: "Oferta",
  won: "Ganado",
  lost: "Perdido",
}

export function leadStatusLabel(status: string): string {
  return LEAD_STATUS_LABEL[status] ?? status
}

const CHANNEL_LABEL: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  valuation: "Valuación",
}

export function channelLabel(channel: string): string {
  return CHANNEL_LABEL[channel] ?? channel
}
