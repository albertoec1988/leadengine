// components/admin/IntegrationCard.tsx
"use client"

import { useActionState } from "react"
import {
  saveIntegration,
  type IntegrationResult,
} from "@/lib/integration-actions"
import type { ChannelDef } from "@/lib/integrations"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

export function IntegrationCard({
  def,
  state: current,
}: {
  def: ChannelDef
  state?: { status: string; enabled: boolean; masked: Record<string, string> }
}) {
  const boundAction = (prev: IntegrationResult | null, fd: FormData) =>
    saveIntegration(def.channel, prev, fd)
  const [state, action, pending] = useActionState<IntegrationResult | null, FormData>(
    boundAction,
    null,
  )
  const configured = current?.status === "configured"

  return (
    <form action={action} className="rounded-2xl border border-line bg-paper p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-ink">{def.name}</h3>
          <p className="text-xs text-muted">{def.description}</p>
        </div>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            configured ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {configured ? "Configurado" : "Sin configurar"}
        </span>
      </div>

      <div className="grid gap-3">
        {def.fields.map((f) => (
          <div key={f.name}>
            <label className="mb-1 block text-xs font-medium text-muted" htmlFor={`${def.channel}-${f.name}`}>
              {f.label}
            </label>
            <input
              id={`${def.channel}-${f.name}`}
              name={f.name}
              type={f.type === "password" ? "password" : "text"}
              className={fieldClass}
              placeholder={current?.masked?.[f.name] ?? f.placeholder ?? ""}
            />
          </div>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="enabled" defaultChecked={current?.enabled} />
        Activar canal
      </label>

      {state && !state.ok && (
        <p role="alert" className="mt-3 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && <p className="mt-3 text-sm text-green-700">Guardado.</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  )
}
