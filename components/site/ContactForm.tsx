"use client"

import { useState } from "react"
import { submitContactLead } from "@/lib/actions"

const ZONES = ["Coral Gables", "South Miami", "Kendall", "Otra"]
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-gold-deep"
const labelClass = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted"

export function ContactForm() {
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
      zone: String(fd.get("zone") ?? ""),
      message: String(fd.get("message") ?? ""),
      source: "web",
    })
    setPending(false)
    if (res.ok) setDone(true)
    else setError(res.error)
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-success/40 bg-success/10 p-8 text-center text-ink">
        <p className="font-display text-2xl">¡Mensaje recibido!</p>
        <p className="mt-2 text-sm text-muted">
          Gracias por contactar con Floridian First. Un agente te responderá muy pronto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-2xl border border-line bg-paper-2 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="name">Nombre</label>
          <input id="name" name="name" required className={fieldClass} placeholder="Tu nombre" />
        </div>
        <div>
          <label className={labelClass} htmlFor="zone">Zona de interés</label>
          <select id="zone" name="zone" className={fieldClass} defaultValue="Coral Gables">
            {ZONES.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className={fieldClass} placeholder="tu@email.com" />
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Teléfono</label>
          <input id="phone" name="phone" className={fieldClass} placeholder="+1 305 …" />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="message">¿En qué podemos ayudarte?</label>
        <textarea id="message" name="message" rows={4} className={fieldClass} placeholder="Cuéntanos qué buscas…" />
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-gold-deep hover:text-paper disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar mensaje"}
      </button>
    </form>
  )
}
