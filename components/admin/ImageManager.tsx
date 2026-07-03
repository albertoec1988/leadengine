// components/admin/ImageManager.tsx
"use client"

import { useState, useTransition } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { uploadImage } from "@/lib/upload-client"
import {
  addImages,
  reorderImages,
  setPrimaryImage,
  deleteImage,
} from "@/lib/image-actions"

type Img = { id: string; url: string; isPrimary: boolean; order: number }

export function ImageManager({
  propertyId,
  images,
}: {
  propertyId: string
  images: Img[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ordered = [...images].sort((a, b) => a.order - b.order)

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setError(null)
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        uploaded.push(await uploadImage(file, `properties/${propertyId}`))
      }
      const res = await addImages(propertyId, uploaded)
      if (!res.ok) setError(res.error)
      else router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setError(res.error ?? "Error")
      else router.refresh()
    })
  }

  function move(index: number, dir: -1 | 1) {
    const next = [...ordered]
    const target = index + dir
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    run(() => reorderImages(propertyId, next.map((i) => i.id)))
  }

  return (
    <div className="mt-8 rounded-2xl border border-line bg-paper p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Imágenes</h2>

      <label className="inline-block cursor-pointer rounded-lg border border-line px-4 py-2 text-sm text-ink hover:bg-paper-2">
        {uploading ? "Subiendo…" : "Añadir imágenes"}
        <input type="file" accept="image/*" multiple hidden onChange={onFiles} disabled={uploading} />
      </label>

      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{error}</p>}

      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Aún no hay imágenes. La portada usará un placeholder.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((img, index) => (
            <li key={img.id} className="overflow-hidden rounded-xl border border-line">
              <div className="relative aspect-[4/3] bg-sand">
                <Image src={img.url} alt="" fill className="object-cover" sizes="240px" />
                {img.isPrimary && (
                  <span className="absolute left-2 top-2 rounded bg-gold px-2 py-0.5 text-[10px] font-medium text-ink">
                    Portada
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 p-2 text-xs">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(index, -1)} disabled={pending || index === 0}
                    className="rounded border border-line px-1.5 py-0.5 disabled:opacity-40" aria-label="Subir">↑</button>
                  <button type="button" onClick={() => move(index, 1)} disabled={pending || index === ordered.length - 1}
                    className="rounded border border-line px-1.5 py-0.5 disabled:opacity-40" aria-label="Bajar">↓</button>
                </div>
                <div className="flex gap-2">
                  {!img.isPrimary && (
                    <button type="button" onClick={() => run(() => setPrimaryImage(propertyId, img.id))}
                      disabled={pending} className="text-gold-deep hover:underline">Portada</button>
                  )}
                  <button type="button" onClick={() => run(() => deleteImage(img.id))}
                    disabled={pending} className="text-red-600 hover:underline">Borrar</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
