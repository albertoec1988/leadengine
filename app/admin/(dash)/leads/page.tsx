import Link from "next/link"
import { getLeads } from "@/lib/admin-queries"
import { PageHeader, ScoreBadge, LeadStatusBadge, ChannelChip } from "@/components/admin/ui"

export const dynamic = "force-dynamic"

const STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "new", label: "Nuevos" },
  { value: "contacted", label: "Contactados" },
  { value: "qualified", label: "Calificados" },
  { value: "visit", label: "Visita" },
  { value: "offer", label: "Oferta" },
  { value: "won", label: "Ganados" },
  { value: "lost", label: "Perdidos" },
]
const CHANNEL_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "web", label: "Web" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "valuation", label: "Valuación" },
]

function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(d)
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; channel?: string; minScore?: string; q?: string }>
}) {
  const sp = await searchParams
  const leads = await getLeads({
    status: sp.status || undefined,
    channel: sp.channel || undefined,
    minScore: sp.minScore ? Number(sp.minScore) : undefined,
    q: sp.q || undefined,
  })

  const selectClass = "rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

  return (
    <>
      <PageHeader title="Leads (CRM)" subtitle={`${leads.length} contactos · ordenados por prioridad`} />

      <div className="p-5 sm:p-8">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar nombre, email, teléfono…" className={`${selectClass} min-w-52 flex-1`} />
          <select name="status" defaultValue={sp.status ?? ""} className={selectClass} aria-label="Estado">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="channel" defaultValue={sp.channel ?? ""} className={selectClass} aria-label="Canal">
            {CHANNEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select name="minScore" defaultValue={sp.minScore ?? ""} className={selectClass} aria-label="Score mínimo">
            <option value="">Score: todos</option>
            <option value="70">≥ 70 (caliente)</option>
            <option value="45">≥ 45</option>
          </select>
          <button type="submit" className="rounded-full bg-navy px-5 py-2 text-sm font-medium text-paper hover:bg-ink">Filtrar</button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Lead</th>
                <th className="px-4 py-3 font-medium">Interés</th>
                <th className="px-4 py-3 font-medium">Canal</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Agente</th>
                <th className="px-4 py-3 font-medium">Entró</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted">No hay leads con esos filtros.</td></tr>
              )}
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-line transition-colors last:border-0 hover:bg-paper-2">
                  <td className="px-4 py-3"><ScoreBadge score={lead.score} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink hover:text-gold-deep">{lead.name}</Link>
                    <p className="text-xs text-muted">{lead.email ?? lead.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{lead.property?.title ?? lead.zone ?? "—"}</td>
                  <td className="px-4 py-3"><ChannelChip channel={lead.channel} /></td>
                  <td className="px-4 py-3"><LeadStatusBadge status={lead.status} /></td>
                  <td className="px-4 py-3 text-muted">{lead.agent?.name ?? "Sin asignar"}</td>
                  <td className="px-4 py-3 text-muted">{fmtDate(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
