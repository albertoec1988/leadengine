import { getLiveAlerts, getNotifications } from "@/lib/admin-queries"
import { PageHeader } from "@/components/admin/ui"
import { SimulateInbound } from "@/components/admin/SimulateInbound"

export const dynamic = "force-dynamic"

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d)
}

export default async function AlertsPage() {
  const [alerts, notifications] = await Promise.all([getLiveAlerts(), getNotifications()])

  return (
    <>
      <PageHeader title="Alertas inteligentes" subtitle="Lo que necesita tu atención, en el momento oportuno." />

      <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-6">
          <section className="rounded-xl border border-line bg-paper p-5">
            <h2 className="font-display text-lg text-ink">Reglas activas ahora</h2>
            <p className="mt-1 text-xs text-muted">Leads calientes sin atender · oportunidades estancadas</p>
            <ul className="mt-4 space-y-2">
              {alerts.length === 0 && <li className="rounded-lg bg-success/10 px-3 py-3 text-sm text-success">Todo bajo control — sin alertas activas.</li>}
              {alerts.map((a, i) => (
                <li key={i} className={`flex items-start gap-3 rounded-lg px-3 py-3 text-sm ${a.severity === "high" ? "bg-danger/10 text-danger" : "bg-gold/15 text-gold-deep"}`}>
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-current" />
                  <span>{a.message}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-line bg-paper p-5">
            <h2 className="font-display text-lg text-ink">Historial de notificaciones</h2>
            <ul className="mt-4 divide-y divide-line">
              {notifications.length === 0 && <li className="py-4 text-sm text-muted">Sin notificaciones.</li>}
              {notifications.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-3 py-3">
                  <span className="text-sm text-ink">{n.message}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(n.createdAt)}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <SimulateInbound />
      </div>
    </>
  )
}
