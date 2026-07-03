import { getAnalytics } from "@/lib/admin-queries"
import { channelLabel } from "@/lib/format"
import { PageHeader, StatCard } from "@/components/admin/ui"
import { ChannelChart, StatusFunnelChart, ZoneChart } from "@/components/admin/AnalyticsCharts"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const a = await getAnalytics()
  const totalLeads = a.byChannel.reduce((s, c) => s + c.count, 0)
  const totalWon = a.byChannel.reduce((s, c) => s + c.won, 0)
  const bestChannel = [...a.byChannel].sort((x, y) => y.won - x.won)[0]
  const convRate = totalLeads ? Math.round((totalWon / totalLeads) * 100) : 0

  return (
    <>
      <PageHeader title="Analítica" subtitle="De dónde vienen los leads que convierten." />

      <div className="p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Leads totales" value={totalLeads} />
          <StatCard label="Conversión a ganado" value={`${convRate}%`} hint={`${totalWon} cerrados`} tone="gold" />
          <StatCard label="Mejor canal (ganados)" value={bestChannel ? channelLabel(bestChannel.channel) : "—"} hint={bestChannel ? `${bestChannel.won} ganados` : ""} tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ChannelChart data={a.byChannel} />
          <StatusFunnelChart data={a.byStatus} />
          <ZoneChart data={a.byZone} />
          <div className="rounded-xl border border-line bg-paper p-5">
            <h3 className="font-display text-lg text-ink">Score medio por canal</h3>
            <p className="mb-4 text-xs text-muted">Calidad media de los leads que entran</p>
            <ul className="space-y-3">
              {a.byChannel.map((c) => (
                <li key={c.channel} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{channelLabel(c.channel)}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-paper-2">
                      <div className="h-full rounded-full bg-gold-deep" style={{ width: `${c.avgScore}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm font-medium text-ink">{c.avgScore}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
