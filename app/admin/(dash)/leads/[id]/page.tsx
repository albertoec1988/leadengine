import Link from "next/link"
import { notFound } from "next/navigation"
import { getLeadById } from "@/lib/admin-queries"
import { formatUSD } from "@/lib/format"
import { PageHeader, ScoreBadge, LeadStatusBadge, ChannelChip } from "@/components/admin/ui"
import { LeadStatusControl, AddNote } from "@/components/admin/LeadActions"

export const dynamic = "force-dynamic"

const ACTIVITY_LABEL: Record<string, string> = {
  note: "Nota",
  call: "Llamada",
  email: "Email",
  status_change: "Cambio de estado",
}

function fmtDateTime(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(d)
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const lead = await getLeadById(id)
  if (!lead) notFound()

  return (
    <>
      <PageHeader title={lead.name} subtitle={`Captado el ${fmtDateTime(lead.createdAt)}`}>
        <div className="flex items-center gap-3">
          <ScoreBadge score={lead.score} />
          <LeadStatusBadge status={lead.status} />
        </div>
      </PageHeader>

      <div className="p-5 sm:p-8">
        <Link href="/admin/leads" className="text-sm text-muted hover:text-ink">← Volver a leads</Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Left: contact + actions */}
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg text-ink">Contacto</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">Email</dt><dd className="text-ink">{lead.email ?? "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Teléfono</dt><dd className="text-ink">{lead.phone ?? "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Canal</dt><dd><ChannelChip channel={lead.channel} /></dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Zona</dt><dd className="text-ink">{lead.zone ?? "—"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Agente</dt><dd className="text-ink">{lead.agent?.name ?? "Sin asignar"}</dd></div>
              </dl>
              {lead.message && (
                <p className="mt-3 rounded-lg bg-paper-2 px-3 py-2 text-sm text-ink">“{lead.message}”</p>
              )}
            </section>

            {lead.property && (
              <section className="rounded-xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg text-ink">Propiedad de interés</h2>
                <Link href={`/propiedades/${lead.property.id}`} className="mt-2 block text-sm text-gold-deep hover:text-ink">
                  {lead.property.title}
                </Link>
                <p className="text-sm text-muted">{formatUSD(lead.property.price)} · {lead.property.zone}</p>
              </section>
            )}

            {lead.valuations.length > 0 && (
              <section className="rounded-xl border border-line bg-paper p-5">
                <h2 className="font-display text-lg text-ink">Valuación solicitada</h2>
                {lead.valuations.map((v) => (
                  <div key={v.id} className="mt-2 text-sm">
                    <p className="font-display text-2xl text-ink">{formatUSD(v.estimate)}</p>
                    <p className="text-muted">{v.zone} · {v.areaSqft} sqft · {v.bedrooms}h/{v.bathrooms}b</p>
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg text-ink">Acciones</h2>
              <div className="mt-3"><LeadStatusControl leadId={lead.id} status={lead.status} /></div>
            </section>
          </div>

          {/* Right: activity */}
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg text-ink">Registrar seguimiento</h2>
              <div className="mt-3"><AddNote leadId={lead.id} /></div>
            </section>

            <section className="rounded-xl border border-line bg-paper p-5">
              <h2 className="font-display text-lg text-ink">Historial</h2>
              <ol className="mt-4 space-y-4">
                {lead.activities.length === 0 && <li className="text-sm text-muted">Sin actividad todavía.</li>}
                {lead.activities.map((a) => (
                  <li key={a.id} className="border-l-2 border-gold pl-4">
                    <p className="text-xs uppercase tracking-wide text-muted">
                      {ACTIVITY_LABEL[a.type] ?? a.type} · {fmtDateTime(a.createdAt)}
                    </p>
                    <p className="mt-0.5 text-sm text-ink">{a.content}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>
      </div>
    </>
  )
}
