export type AlertLead = { id: string; score: number; status: string; createdAt: Date }
export type AlertOpportunity = { id: string; stage: string; value: number; updatedAt: Date }
export type AlertRuleInput = { leads: AlertLead[]; opportunities: AlertOpportunity[]; now: Date }
export type Alert = {
  type: 'hot_lead_unattended' | 'stalled_opportunity'
  refId: string
  message: string
  severity: 'high' | 'medium'
}

const HOT_SCORE = 70
const UNATTENDED_HOURS = 2
const STALLED_DAYS = 7

export function evaluateAlerts(input: AlertRuleInput): Alert[] {
  const alerts: Alert[] = []
  const { now } = input

  for (const lead of input.leads) {
    const hours = (now.getTime() - lead.createdAt.getTime()) / 3600_000
    if (lead.score >= HOT_SCORE && lead.status === 'new' && hours > UNATTENDED_HOURS) {
      alerts.push({
        type: 'hot_lead_unattended',
        refId: lead.id,
        message: `Lead caliente (score ${lead.score}) sin atender hace ${Math.floor(hours)}h`,
        severity: 'high',
      })
    }
  }

  for (const opp of input.opportunities) {
    const days = (now.getTime() - opp.updatedAt.getTime()) / 86_400_000
    if (opp.stage !== 'closed' && days > STALLED_DAYS) {
      alerts.push({
        type: 'stalled_opportunity',
        refId: opp.id,
        message: `Oportunidad estancada ${Math.floor(days)} días en etapa "${opp.stage}"`,
        severity: 'medium',
      })
    }
  }

  return alerts
}
