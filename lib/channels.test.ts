import { describe, it, expect } from 'vitest'
import { normalizeInbound } from '@/lib/channels'

describe('normalizeInbound', () => {
  it('mapea un mensaje de WhatsApp al canal whatsapp y recorta espacios', () => {
    const lead = normalizeInbound({ source: 'WhatsApp', name: '  Ana  ', phone: '+13055551234', text: 'Hola' })
    expect(lead.channel).toBe('whatsapp')
    expect(lead.name).toBe('Ana')
    expect(lead.phone).toBe('+13055551234')
    expect(lead.message).toBe('Hola')
    expect(lead.email).toBeNull()
  })

  it('usa "Sin nombre" cuando no llega nombre', () => {
    const lead = normalizeInbound({ source: 'instagram', text: 'Info?' })
    expect(lead.name).toBe('Sin nombre')
    expect(lead.channel).toBe('instagram')
  })

  it('un source desconocido cae al canal web', () => {
    const lead = normalizeInbound({ source: 'carrier-pigeon', email: 'x@y.com' })
    expect(lead.channel).toBe('web')
    expect(lead.email).toBe('x@y.com')
  })

  it('conserva propertyId y zone de interés', () => {
    const lead = normalizeInbound({ source: 'web', propertyId: 'p1', zone: 'Kendall' })
    expect(lead.propertyId).toBe('p1')
    expect(lead.zone).toBe('Kendall')
  })
})
