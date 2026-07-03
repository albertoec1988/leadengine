export type LeadChannel = 'web' | 'whatsapp' | 'instagram' | 'valuation'

export type ScoreSignals = {
  channel: LeadChannel
  hasEmail: boolean
  hasPhone: boolean
  hasPropertyInterest: boolean
  hasZoneInterest: boolean
  message?: string | null
}

const CHANNEL_BASE: Record<LeadChannel, number> = {
  valuation: 40, // intención alta de venta
  whatsapp: 25,
  web: 20,
  instagram: 15,
}

export function scoreLead(signals: ScoreSignals): number {
  let score = CHANNEL_BASE[signals.channel]
  if (signals.hasEmail) score += 15
  if (signals.hasPhone) score += 15
  if (signals.hasPropertyInterest) score += 15
  if (signals.hasZoneInterest) score += 10
  if (signals.message && signals.message.trim().length > 20) score += 5
  return Math.max(0, Math.min(100, score))
}
