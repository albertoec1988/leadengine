import { getSettings } from "@/lib/settings"
import { SettingsForm } from "@/components/admin/SettingsForm"

export const dynamic = "force-dynamic"

export default async function GeneralPage() {
  const values = await getSettings()
  return <SettingsForm values={values} />
}
