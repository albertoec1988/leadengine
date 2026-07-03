"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { SETTING_KEYS } from "@/lib/settings"

export type SettingsResult = { ok: true } | { ok: false; error: string }

export async function saveSettings(
  _prev: SettingsResult | null,
  formData: FormData,
): Promise<SettingsResult> {
  const user = await getSessionUser()
  if (!user || user.role !== "admin") return { ok: false, error: "No autorizado." }

  await prisma.$transaction(
    SETTING_KEYS.map((k) => {
      const value = String(formData.get(k.name) ?? "").trim()
      return prisma.setting.upsert({
        where: { key: k.name },
        create: { key: k.name, value },
        update: { value },
      })
    }),
  )

  revalidatePath("/admin/configuracion/general")
  return { ok: true }
}
