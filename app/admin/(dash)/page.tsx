import Link from "next/link"
import { getSessionUser } from "@/lib/auth"
import { getDashboardStats, getHotLeads, getLiveAlerts } from "@/lib/admin-queries"
import { formatCompactUSD } from "@/lib/format"
import { PageHeader, StatCard, ScoreBadge, ChannelChip } from "@/components/admin/ui"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const [user, stats, hot, alerts] = await Promise.all([
    getSessionUser(),
    getDashboardStats(),
    getHotLeads(6),
    getLiveAlerts(),
  ])

  const totalChannel = stats.byChannel.reduce((s, c) => s + c.count, 0) || 1

  return (
    <>
      <PageHeader title={`Hola, ${user?.name?.split(" ")[0] ?? "equipo"}`} subtitle="Esto es lo que pide tu atención hoy." />

      <div className="p-5 sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Leads nuevos" value={stats.newLeads} hint="sin atender" tone={stats.newLeads > 0 ? "gold" : "default"} />
          <StatCard label="Leads calientes" value={stats.hotLeads} hint="score ≥ 70, nuevos" tone={stats.hotLeads > 0 ? "hot" : "default"} />
          <StatCard label="Esta semana" value={stats.weekLeads} hint="leads captados (7 días)" />
          <StatCard label="Pipeline abierto" value={formatCompactUSD(stats.openPipelineValue)} hint={`${stats.openPipelineCount} oportunidades`} tone="navy" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* Hot leads */}
          <section className="rounded-xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Leads calientes</h2>
              <Link href="/admin/leads?minScore=60" className="text-sm text-gold-deep hover:text-ink">Ver todos →</Link>
            </div>
            <ul className="mt-4 divide-y divide-line">
              {hot.length === 0 && <li className="py-6 text-center text-sm text-muted">Ningún lead caliente ahora mismo.</li>}
              {hot.map((lead) => (
                <li key={lead.id}>
                  <Link href={`/admin/leads/${lead.id}`} className="flex items-center justify-between gap-3 py-3 transition-colors hover:bg-paper-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{lead.name}</p>
                      <p className="truncate text-xs text-muted">
                        {lead.property ? lead.property.title : lead.zone ?? "Sin propiedad"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ChannelChip channel={lead.channel} />
                      <ScoreBadge score={lead.score} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Alerts + channels */}
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-paper p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-ink">Alertas</h2>
                <Link href="/admin/alertas" className="text-sm text-gold-deep hover:text-ink">Ver →</Link>
              </div>
              <ul className="mt-4 space-y-2">
                {alerts.length === 0 && <li className="text-sm text-muted">Todo bajo control.</li>}
                {alerts.slice(0, 4).map((a, i) => (
                  <li key={i} className={`rounded-lg px-3 py-2 text-sm ${a.severity === "high" ? "bg-danger/10 text-danger" : "bg-gold/15 text-gold-deep"}`}>
                    {a.message}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-line bg-paper p-5">
              <h2 className="font-display text-xl text-ink">Origen de leads</h2>
              <ul className="mt-4 space-y-3">
                {stats.byChannel.map((c) => (
                  <li key={c.channel}>
                    <div className="flex items-center justify-between text-sm">
                      <ChannelChip channel={c.channel} />
                      <span className="text-muted">{c.count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-2">
                      <div className="h-full rounded-full bg-gold-deep" style={{ width: `${(c.count / totalChannel) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
