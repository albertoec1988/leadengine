import Link from "next/link"
import { getPipeline } from "@/lib/admin-queries"
import { formatCompactUSD, formatUSD } from "@/lib/format"
import { PageHeader } from "@/components/admin/ui"
import { StageControl } from "@/components/admin/StageControl"

export const dynamic = "force-dynamic"

const STAGE_LABEL: Record<string, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  visit: "Visita",
  offer: "Oferta",
  closed: "Cerrado",
}

export default async function PipelinePage() {
  const columns = await getPipeline()
  const openValue = columns.filter((c) => c.stage !== "closed").reduce((s, c) => s + c.value, 0)
  const totalCount = columns.reduce((s, c) => s + c.count, 0)

  return (
    <>
      <PageHeader title="Pipeline de ventas" subtitle={`${totalCount} oportunidades · ${formatCompactUSD(openValue)} en juego (abierto)`} />

      <div className="p-5 sm:p-8">
        <div className="grid grid-flow-col gap-4 overflow-x-auto pb-4" style={{ gridAutoColumns: "minmax(240px, 1fr)" }}>
          {columns.map((col) => (
            <div key={col.stage} className="flex flex-col rounded-xl border border-line bg-paper">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{STAGE_LABEL[col.stage]}</p>
                  <p className="text-xs text-muted">{col.count} · {formatCompactUSD(col.value)}</p>
                </div>
                <span className={`h-2 w-2 rounded-full ${col.stage === "closed" ? "bg-success" : "bg-gold-deep"}`} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-3">
                {col.items.length === 0 && <p className="py-6 text-center text-xs text-muted">Vacío</p>}
                {col.items.map((opp) => (
                  <div key={opp.id} className="rounded-lg border border-line bg-paper-2 p-3">
                    <Link href={`/admin/leads/${opp.leadId}`} className="text-sm font-medium text-ink hover:text-gold-deep">
                      {opp.lead.name}
                    </Link>
                    <p className="truncate text-xs text-muted">{opp.property.title}</p>
                    <p className="mt-1 font-display text-lg text-ink">{formatUSD(opp.value)}</p>
                    <p className="mb-2 text-xs text-muted">{opp.probability}% prob.</p>
                    <StageControl opportunityId={opp.id} stage={opp.stage} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
