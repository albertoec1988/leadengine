import { prisma } from "@/lib/db"

export { SETTING_KEYS } from "@/lib/settings-keys"

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}
