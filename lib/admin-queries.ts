import "server-only"
import { prisma } from "@/lib/db"
import { evaluateAlerts, type Alert } from "@/lib/alerts"

const PIPELINE_STAGES = ["new", "contacted", "visit", "offer", "closed"] as const
export type PipelineStage = (typeof PIPELINE_STAGES)[number]
export const STAGES = PIPELINE_STAGES

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000)
}

export async function getDashboardStats() {
  const [total, newLeads, hotLeads, weekLeads, byChannel, byStatus, oppAgg, closedAgg] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { status: "new" } }),
      prisma.lead.count({ where: { score: { gte: 70 }, status: "new" } }),
      prisma.lead.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      prisma.lead.groupBy({ by: ["channel"], _count: { _all: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.opportunity.aggregate({
        where: { stage: { not: "closed" } },
        _sum: { value: true },
        _count: { _all: true },
      }),
      prisma.opportunity.aggregate({
        where: { stage: "closed" },
        _sum: { value: true },
      }),
    ])

  return {
    total,
    newLeads,
    hotLeads,
    weekLeads,
    openPipelineValue: oppAgg._sum.value ?? 0,
    openPipelineCount: oppAgg._count._all,
    closedValue: closedAgg._sum.value ?? 0,
    byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count._all })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
  }
}

export type LeadListFilters = {
  status?: string
  channel?: string
  minScore?: number
  q?: string
}

export async function getLeads(filters: LeadListFilters = {}) {
  return prisma.lead.findMany({
    where: {
      status: filters.status,
      channel: filters.channel,
      score: filters.minScore ? { gte: filters.minScore } : undefined,
      OR: filters.q
        ? [
            { name: { contains: filters.q } },
            { email: { contains: filters.q } },
            { phone: { contains: filters.q } },
          ]
        : undefined,
    },
    include: { property: true, agent: true },
    orderBy: [{ score: "desc" }, { createdAt: "desc" }],
  })
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      property: true,
      agent: true,
      opportunity: { include: { property: true } },
      activities: { orderBy: { createdAt: "desc" } },
      valuations: { orderBy: { createdAt: "desc" } },
    },
  })
}

export async function getPipeline() {
  const opps = await prisma.opportunity.findMany({
    include: { lead: true, property: true },
    orderBy: { updatedAt: "desc" },
  })
  return STAGES.map((stage) => {
    const items = opps.filter((o) => o.stage === stage)
    return {
      stage,
      items,
      value: items.reduce((sum, o) => sum + o.value, 0),
      count: items.length,
    }
  })
}

export async function getHotLeads(limit = 6) {
  return prisma.lead.findMany({
    where: { status: "new", score: { gte: 60 } },
    include: { property: true },
    orderBy: { score: "desc" },
    take: limit,
  })
}

export async function getAnalytics() {
  const [byChannel, byStatus, wonByChannel, propInterest] = await Promise.all([
    prisma.lead.groupBy({ by: ["channel"], _count: { _all: true }, _avg: { score: true } }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["channel"], where: { status: "won" }, _count: { _all: true } }),
    prisma.lead.groupBy({
      by: ["zone"],
      where: { zone: { not: null } },
      _count: { _all: true },
    }),
  ])
  return {
    byChannel: byChannel.map((c) => ({
      channel: c.channel,
      count: c._count._all,
      avgScore: Math.round(c._avg.score ?? 0),
      won: wonByChannel.find((w) => w.channel === c.channel)?._count._all ?? 0,
    })),
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count._all })),
    byZone: propInterest.map((z) => ({ zone: z.zone ?? "—", count: z._count._all })),
  }
}

export async function getLiveAlerts(): Promise<Alert[]> {
  const [leads, opportunities] = await Promise.all([
    prisma.lead.findMany({ select: { id: true, score: true, status: true, createdAt: true } }),
    prisma.opportunity.findMany({ select: { id: true, stage: true, value: true, updatedAt: true } }),
  ])
  return evaluateAlerts({ leads, opportunities, now: new Date() })
}

export async function getMapProperties() {
  return prisma.property.findMany({
    orderBy: { createdAt: "desc" },
  })
}

export async function getNotifications() {
  return prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 20 })
}
