import { prisma } from "@/lib/db"

export const SETTING_KEYS = [
  { name: "businessName", label: "Nombre del negocio", type: "text" as const },
  { name: "contactEmail", label: "Email de contacto", type: "email" as const },
  { name: "phone", label: "Teléfono", type: "tel" as const },
  { name: "logoUrl", label: "Logo (URL)", type: "url" as const },
]

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const out: Record<string, string> = {}
  for (const r of rows) out[r.key] = r.value
  return out
}
