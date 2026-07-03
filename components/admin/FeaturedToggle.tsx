"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toggleFeatured } from "@/lib/property-actions"

export function FeaturedToggle({ id, isFeatured }: { id: string; isFeatured: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={isFeatured ? "Quitar de favoritas" : "Marcar como favorita"}
      aria-pressed={isFeatured}
      title={isFeatured ? "Favorita (en el mapa de la portada)" : "Marcar como favorita"}
      onClick={() =>
        startTransition(async () => {
          await toggleFeatured(id)
          router.refresh()
        })
      }
      className={`text-lg leading-none transition-transform hover:scale-110 disabled:opacity-50 ${
        isFeatured ? "text-gold" : "text-line hover:text-gold-deep"
      }`}
    >
      {isFeatured ? "★" : "☆"}
    </button>
  )
}
