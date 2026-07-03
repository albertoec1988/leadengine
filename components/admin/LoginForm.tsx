"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { loginAction, type LoginResult } from "@/lib/auth-actions"

const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2.5 text-sm text-ink outline-none transition-colors duration-[var(--dur-fast)] focus:border-gold-deep"

export function LoginForm() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<LoginResult | null, FormData>(loginAction, null)

  useEffect(() => {
    if (state?.ok) router.push("/admin")
  }, [state, router])

  return (
    <form action={formAction} className="mt-5 grid gap-3">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" required className={fieldClass} placeholder="tu@floridianfirst.com" />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required className={fieldClass} placeholder="••••••••" />
      </div>
      {state && !state.ok && (
        <p role="alert" className="text-sm text-danger">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-navy px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-ink disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  )
}
