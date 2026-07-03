export type PropertyCondition = 'excellent' | 'good' | 'fair' | 'needs_work'

export type ValuationInput = {
  zone: string
  areaSqft: number
  bedrooms: number
  bathrooms: number
  condition: PropertyCondition
  yearBuilt?: number
}

export type ValuationResult = {
  estimate: number
  low: number
  high: number
  pricePerSqft: number
}

const ZONE_PRICE_PER_SQFT: Record<string, number> = {
  'Coral Gables': 650,
  'South Miami': 520,
  'Kendall': 380,
}
const DEFAULT_PRICE_PER_SQFT = 450

const CONDITION_MULT: Record<PropertyCondition, number> = {
  excellent: 1.1,
  good: 1.0,
  fair: 0.9,
  needs_work: 0.8,
}

export function estimateValue(input: ValuationInput): ValuationResult {
  const pricePerSqft = ZONE_PRICE_PER_SQFT[input.zone] ?? DEFAULT_PRICE_PER_SQFT
  let value = input.areaSqft * pricePerSqft
  value *= CONDITION_MULT[input.condition]
  // pequeños ajustes por habitaciones/baños
  value += (input.bedrooms - 3) * 15_000
  value += (input.bathrooms - 2) * 10_000
  // depreciación suave por antigüedad
  if (input.yearBuilt) {
    const age = 2026 - input.yearBuilt
    if (age > 0) value *= Math.max(0.75, 1 - age * 0.003)
  }
  const estimate = Math.max(0, Math.round(value))
  return {
    estimate,
    low: Math.round(estimate * 0.92),
    high: Math.round(estimate * 1.08),
    pricePerSqft,
  }
}
