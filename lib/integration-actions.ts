// lib/integration-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { encryptJSON, decryptJSON, maskSecret } from "@/lib/crypto"
import { getChannel } from "@/lib/integrations"

export type IntegrationResult = { ok: true } | { ok: false; error: string }

export async function saveIntegration(
  channel: string,
  _prev: IntegrationResult | null,
  formData: FormData,
): Promise<IntegrationResult> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false, error: "No autorizado." }

  const def = getChannel(channel)
  if (!def) return { ok: false, error: "Canal desconocido." }

  const existing = await prisma.integration.findUnique({ where: { channel } })
  let config: Record<string, string> = {}
  if (existing?.config) {
    try {
      config = decryptJSON<Record<string, string>>(existing.config)
    } catch {
      config = {}
    }
  }

  for (const field of def.fields) {
    const value = String(formData.get(field.name) ?? "").trim()
    if (value) config[field.name] = value
  }

  const enabled = formData.get("enabled") === "on"
  const encrypted = encryptJSON(config)

  await prisma.integration.upsert({
    where: { channel },
    create: { channel, config: encrypted, enabled, status: "configured" },
    update: { config: encrypted, enabled, status: "configured" },
  })

  revalidatePath("/admin/configuracion/integraciones")
  return { ok: true }
}

// Devuelve, por canal, estado y valores enmascarados (nunca en claro al cliente).
export async function getIntegrationStatuses(): Promise<
  Record<string, { status: string; enabled: boolean; masked: Record<string, string> }>
> {
  const rows = await prisma.integration.findMany()
  const out: Record<string, { status: string; enabled: boolean; masked: Record<string, string> }> = {}
  for (const row of rows) {
    const masked: Record<string, string> = {}
    if (row.config) {
      try {
        const cfg = decryptJSON<Record<string, string>>(row.config)
        for (const [k, v] of Object.entries(cfg)) masked[k] = maskSecret(v)
      } catch {
        // config corrupta o clave cambiada: se ignora el enmascarado
      }
    }
    out[row.channel] = { status: row.status, enabled: row.enabled, masked }
  }
  return out
}
