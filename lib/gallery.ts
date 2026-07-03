// lib/gallery.ts
export type GalleryImage = { id: string; order: number; isPrimary: boolean }

// Placeholder cuando una propiedad no tiene imágenes (mismo estilo que el seed).
export const PLACEHOLDER_PHOTO = "https://picsum.photos/seed/ffr-placeholder/800/600"

export function reorder(ids: string[]): { id: string; order: number }[] {
  return ids.map((id, index) => ({ id, order: index }))
}

export function computePrimaryAfterSet(
  images: GalleryImage[],
  primaryId: string,
): GalleryImage[] {
  return images.map((img) => ({ ...img, isPrimary: img.id === primaryId }))
}

export function computePrimaryAfterDelete(
  images: GalleryImage[],
  deletedId: string,
): { remaining: GalleryImage[]; newPrimaryId: string | null } {
  const remaining = images
    .filter((i) => i.id !== deletedId)
    .sort((a, b) => a.order - b.order)
    .map((img, index) => ({ ...img, order: index }))

  if (remaining.length === 0) return { remaining, newPrimaryId: null }

  const stillHasPrimary = remaining.some((i) => i.isPrimary)
  if (!stillHasPrimary) {
    remaining[0].isPrimary = true
    return { remaining, newPrimaryId: remaining[0].id }
  }
  return { remaining, newPrimaryId: remaining.find((i) => i.isPrimary)!.id }
}

export function primaryUrlOrPlaceholder(
  images: { url: string; isPrimary: boolean }[],
): string {
  return images.find((i) => i.isPrimary)?.url ?? PLACEHOLDER_PHOTO
}
