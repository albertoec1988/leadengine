import { describe, it, expect } from 'vitest'
import { evaluateAlerts } from '@/lib/alerts'

const NOW = new Date('2026-07-03T12:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3600_000)
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 86_400_000)

describe('evaluateAlerts', () => {
  it('alerta de lead caliente nuevo sin atender > 2h', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'new', createdAt: hoursAgo(3) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ type: 'hot_lead_unattended', refId: 'l1', severity: 'high' })
  })

  it('no alerta si el lead caliente es reciente (< 2h)', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'new', createdAt: hoursAgo(1) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })

  it('no alerta si el lead ya fue contactado', () => {
    const alerts = evaluateAlerts({
      leads: [{ id: 'l1', score: 85, status: 'contacted', createdAt: hoursAgo(5) }],
      opportunities: [],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })

  it('alerta de oportunidad estancada (>7 días sin cambios, no cerrada)', () => {
    const alerts = evaluateAlerts({
      leads: [],
      opportunities: [{ id: 'o1', stage: 'visit', value: 500_000, updatedAt: daysAgo(10) }],
      now: NOW,
    })
    expect(alerts).toHaveLength(1)
    expect(alerts[0]).toMatchObject({ type: 'stalled_opportunity', refId: 'o1' })
  })

  it('no alerta de oportunidades cerradas aunque lleven tiempo sin tocarse', () => {
    const alerts = evaluateAlerts({
      leads: [],
      opportunities: [{ id: 'o1', stage: 'closed', value: 500_000, updatedAt: daysAgo(30) }],
      now: NOW,
    })
    expect(alerts).toHaveLength(0)
  })
})
