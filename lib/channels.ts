import type { LeadChannel } from '@/lib/scoring'

export type RawInbound = {
  source: string
  name?: string
  email?: string
  phone?: string
  text?: string
  propertyId?: string
  zone?: string
}

export type NormalizedLead = {
  name: string
  email: string | null
  phone: string | null
  channel: LeadChannel
  message: string | null
  propertyId: string | null
  zone: string | null
}

function resolveChannel(source: string): LeadChannel {
  const s = source.trim().toLowerCase()
  if (s.includes('whatsapp')) return 'whatsapp'
  if (s.includes('instagram')) return 'instagram'
  if (s.includes('valuation') || s.includes('valuacion')) return 'valuation'
  return 'web'
}

function clean(v?: string): string | null {
  const t = v?.trim()
  return t && t.length > 0 ? t : null
}

export function normalizeInbound(raw: RawInbound): NormalizedLead {
  return {
    name: clean(raw.name) ?? 'Sin nombre',
    email: clean(raw.email),
    phone: clean(raw.phone),
    channel: resolveChannel(raw.source),
    message: clean(raw.text),
    propertyId: clean(raw.propertyId),
    zone: clean(raw.zone),
  }
}
