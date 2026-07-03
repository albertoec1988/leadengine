import { CHANNELS } from "@/lib/integrations"
import { getIntegrationStatuses } from "@/lib/integration-actions"
import { IntegrationCard } from "@/components/admin/IntegrationCard"

export const dynamic = "force-dynamic"

export default async function IntegracionesPage() {
  const statuses = await getIntegrationStatuses()
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {CHANNELS.map((def) => (
        <IntegrationCard key={def.channel} def={def} state={statuses[def.channel]} />
      ))}
    </div>
  )
}
