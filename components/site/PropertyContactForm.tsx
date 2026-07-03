"use client"

import { useState } from "react"
import { submitContactLead } from "@/lib/actions"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-gold-deep"

export function PropertyContactForm({
  propertyId,
  zone,
  propertyTitle,
}: {
  propertyId: string
  zone: string
  propertyTitle: string
}) {
  const [pending, setPending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const fd = new FormData(e.currentTarget)
    const res = await submitContactLead({
      name: String(fd.get("name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      message: String(fd.get("message") ?? "") || `Interesado en: ${propertyTitle}`,
      propertyId,
      zone,
      source: "web",
    })
    setPending(false)
    if (res.ok) setDone(true)
    else setError(res.error)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-success/40 bg-success/10 p-5 text-sm text-ink">
        ¡Gracias! Hemos recibido tu interés en esta propiedad. Un agente te
        contactará muy pronto.
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-xl border border-line bg-paper-2 p-5">
      <p className="font-display text-xl text-ink">¿Te interesa esta casa?</p>
      <input name="name" required placeholder="Nombre" className={fieldClass} />
      <input name="email" type="email" placeholder="Email" className={fieldClass} />
      <input name="phone" placeholder="Teléfono" className={fieldClass} />
      <textarea name="message" rows={3} placeholder="Mensaje (opcional)" className={fieldClass} />
      {error && (
        <p role="alert" className="text-sm text-danger">{error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-gold px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-gold-deep hover:text-paper disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Solicitar información"}
      </button>
    </form>
  )
}
