"use client"

import { useActionState } from "react"
import { saveSettings, type SettingsResult } from "@/lib/settings-actions"
import { SETTING_KEYS } from "@/lib/settings-keys"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-gold-deep"

export function SettingsForm({ values }: { values: Record<string, string> }) {
  const [state, action, pending] = useActionState<SettingsResult | null, FormData>(
    saveSettings,
    null,
  )
  return (
    <form action={action} className="grid max-w-lg gap-4 rounded-2xl border border-line bg-paper p-6">
      {SETTING_KEYS.map((k) => (
        <div key={k.name}>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted" htmlFor={k.name}>
            {k.label}
          </label>
          <input id={k.name} name={k.name} type={k.type} defaultValue={values[k.name] ?? ""} className={fieldClass} />
        </div>
      ))}
      {state && !state.ok && (
        <p role="alert" className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}
      {state?.ok && <p className="text-sm text-green-700">Guardado.</p>}
      <button type="submit" disabled={pending}
        className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  )
}
