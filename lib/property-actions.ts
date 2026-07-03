"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const VALID_STATUS = ["for_sale", "pending", "sold"]

const ZONE_COORDS: Record<string, [number, number]> = {
  "Coral Gables": [25.721, -80.268],
  "South Miami": [25.7079, -80.2939],
  Kendall: [25.6793, -80.3173],
}

export async function updatePropertyStatus(id: string, status: string) {
  if (!VALID_STATUS.includes(status)) return
  await prisma.property.update({ where: { id }, data: { status } })
  revalidatePath("/admin/propiedades")
  revalidatePath("/propiedades")
  revalidatePath("/mapa")
}

export type CreatePropertyResult = { ok: false; error: string } | { ok: true }

export async function createProperty(
  _prev: CreatePropertyResult | null,
  formData: FormData,
): Promise<CreatePropertyResult> {
  const title = String(formData.get("title") ?? "").trim()
  const zone = String(formData.get("zone") ?? "Coral Gables")
  const price = Number(formData.get("price") ?? 0)
  const bedrooms = Number(formData.get("bedrooms") ?? 0)
  const bathrooms = Number(formData.get("bathrooms") ?? 0)
  const areaSqft = Number(formData.get("areaSqft") ?? 0)
  const address = String(formData.get("address") ?? "").trim() || `${zone}, FL`

  if (!title) return { ok: false, error: "El título es obligatorio." }
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: "Introduce un precio válido." }

  const [baseLat, baseLng] = ZONE_COORDS[zone] ?? ZONE_COORDS["Coral Gables"]
  // pequeño desplazamiento determinista a partir de la longitud del título
  const jitter = ((title.length % 20) - 10) * 0.002

  await prisma.property.create({
    data: {
      title,
      zone,
      price: Math.round(price),
      bedrooms: Math.max(0, bedrooms),
      bathrooms: Math.max(0, bathrooms),
      areaSqft: Math.max(0, areaSqft),
      address,
      lat: baseLat + jitter,
      lng: baseLng - jitter,
      status: "for_sale",
      photoUrl: `https://picsum.photos/seed/ffr-${Date.now()}/800/600`,
    },
  })

  revalidatePath("/admin/propiedades")
  revalidatePath("/propiedades")
  redirect("/admin/propiedades")
}
