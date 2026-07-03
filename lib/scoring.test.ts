import { describe, it, expect } from 'vitest'
import { scoreLead } from '@/lib/scoring'

describe('scoreLead', () => {
  it('da máxima prioridad a una valuación con datos completos', () => {
    const score = scoreLead({
      channel: 'valuation',
      hasEmail: true,
      hasPhone: true,
      hasPropertyInterest: true,
      hasZoneInterest: true,
      message: 'Quiero vender mi casa este año',
    })
    expect(score).toBe(100)
  })

  it('puntúa bajo un lead web anónimo sin datos', () => {
    const score = scoreLead({
      channel: 'web',
      hasEmail: false,
      hasPhone: false,
      hasPropertyInterest: false,
      hasZoneInterest: false,
      message: null,
    })
    expect(score).toBe(20)
  })

  it('nunca supera 100 ni baja de 0', () => {
    const high = scoreLead({
      channel: 'valuation', hasEmail: true, hasPhone: true,
      hasPropertyInterest: true, hasZoneInterest: true, message: 'x'.repeat(50),
    })
    expect(high).toBeLessThanOrEqual(100)
    expect(high).toBeGreaterThanOrEqual(0)
  })

  it('un lead de whatsapp con teléfono e interés en propiedad supera a uno de instagram sin datos', () => {
    const wa = scoreLead({ channel: 'whatsapp', hasEmail: false, hasPhone: true, hasPropertyInterest: true, hasZoneInterest: false, message: null })
    const ig = scoreLead({ channel: 'instagram', hasEmail: false, hasPhone: false, hasPropertyInterest: false, hasZoneInterest: false, message: null })
    expect(wa).toBeGreaterThan(ig)
  })
})
