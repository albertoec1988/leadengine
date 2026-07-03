// lib/image-actions.ts
"use server"

import { del } from "@vercel/blob"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import {
  computePrimaryAfterDelete,
  computePrimaryAfterSet,
  reorder,
  PLACEHOLDER_PHOTO,
} from "@/lib/gallery"

export type ActionResult = { ok: true } | { ok: false; error: string }

async function requireAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  return !!user && user.role === "admin"
}

function revalidateProperty(propertyId: string) {
  revalidatePath(`/admin/propiedades/${propertyId}/editar`)
  revalidatePath("/admin/propiedades")
  revalidatePath("/propiedades")
  revalidatePath(`/propiedades/${propertyId}`)
  revalidatePath("/mapa")
}

// Recalcula Property.photoUrl a partir de la imagen isPrimary (o placeholder).
async function syncCover(propertyId: string) {
  const primary = await prisma.propertyImage.findFirst({
    where: { propertyId, isPrimary: true },
  })
  await prisma.property.update({
    where: { id: propertyId },
    data: { photoUrl: primary?.url ?? PLACEHOLDER_PHOTO },
  })
}

export async function addImages(
  propertyId: string,
  files: { url: string; pathname: string }[],
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  if (files.length === 0) return { ok: false, error: "No hay archivos." }

  const existingCount = await prisma.propertyImage.count({ where: { propertyId } })

  await prisma.$transaction(
    files.map((f, i) =>
      prisma.propertyImage.create({
        data: {
          propertyId,
          url: f.url,
          pathname: f.pathname,
          order: existingCount + i,
          isPrimary: existingCount === 0 && i === 0,
        },
      }),
    ),
  )

  await syncCover(propertyId)
  revalidateProperty(propertyId)
  return { ok: true }
}

export async function reorderImages(
  propertyId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const updates = reorder(orderedIds)
  await prisma.$transaction(
    updates.map((u) =>
      prisma.propertyImage.update({
        where: { id: u.id },
        data: { order: u.order },
      }),
    ),
  )

  revalidateProperty(propertyId)
  return { ok: true }
}

export async function setPrimaryImage(
  propertyId: string,
  imageId: string,
): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const images = await prisma.propertyImage.findMany({ where: { propertyId } })
  const next = computePrimaryAfterSet(
    images.map((i) => ({ id: i.id, order: i.order, isPrimary: i.isPrimary })),
    imageId,
  )
  await prisma.$transaction(
    next.map((i) =>
      prisma.propertyImage.update({ where: { id: i.id }, data: { isPrimary: i.isPrimary } }),
    ),
  )

  await syncCover(propertyId)
  revalidateProperty(propertyId)
  return { ok: true }
}

export async function deleteImage(imageId: string): Promise<ActionResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const image = await prisma.propertyImage.findUnique({ where: { id: imageId } })
  if (!image) return { ok: false, error: "Imagen no encontrada." }

  const siblings = await prisma.propertyImage.findMany({ where: { propertyId: image.propertyId } })
  const { remaining, newPrimaryId } = computePrimaryAfterDelete(
    siblings.map((i) => ({ id: i.id, order: i.order, isPrimary: i.isPrimary })),
    imageId,
  )

  // Borrar el archivo del Blob (best-effort) y la fila.
  try {
    await del(image.url)
  } catch {
    // Si el blob ya no existe, seguimos; la fila igual se elimina.
  }

  await prisma.$transaction([
    prisma.propertyImage.delete({ where: { id: imageId } }),
    ...remaining.map((i) =>
      prisma.propertyImage.update({
        where: { id: i.id },
        data: { order: i.order, isPrimary: i.id === newPrimaryId },
      }),
    ),
  ])

  await syncCover(image.propertyId)
  revalidateProperty(image.propertyId)
  return { ok: true }
}
