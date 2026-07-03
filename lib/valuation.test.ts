import { describe, it, expect } from 'vitest'
import { estimateValue } from '@/lib/valuation'

describe('estimateValue', () => {
  it('usa el precio/m² base de la zona para una casa estándar en buen estado', () => {
    const r = estimateValue({ zone: 'Coral Gables', areaSqft: 2000, bedrooms: 3, bathrooms: 2, condition: 'good' })
    // base Coral Gables = 650/sqft; condición good = x1.0; 3bd/2ba neutro
    expect(r.pricePerSqft).toBe(650)
    expect(r.estimate).toBe(1_300_000)
  })

  it('devuelve un rango low/high alrededor de la estimación', () => {
    const r = estimateValue({ zone: 'Kendall', areaSqft: 1500, bedrooms: 3, bathrooms: 2, condition: 'good' })
    expect(r.low).toBeLessThan(r.estimate)
    expect(r.high).toBeGreaterThan(r.estimate)
  })

  it('una vivienda en mal estado vale menos que una excelente igual', () => {
    const base = { zone: 'South Miami', areaSqft: 1800, bedrooms: 3, bathrooms: 2 } as const
    const good = estimateValue({ ...base, condition: 'excellent' })
    const bad = estimateValue({ ...base, condition: 'needs_work' })
    expect(bad.estimate).toBeLessThan(good.estimate)
  })

  it('zona desconocida usa un precio/m² por defecto sin romper', () => {
    const r = estimateValue({ zone: 'Marte', areaSqft: 1000, bedrooms: 2, bathrooms: 1, condition: 'good' })
    expect(r.estimate).toBeGreaterThan(0)
  })
})
