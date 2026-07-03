"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createUser,
  updateUserRole,
  resetUserPassword,
  type UserResult,
} from "@/lib/user-actions"

type Row = { id: string; name: string; email: string; role: string }
const fieldClass =
  "w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold-deep"

export function UsersManager({ users }: { users: Row[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rowError, setRowError] = useState<string | null>(null)
  const [state, action, creating] = useActionState<UserResult | null, FormData>(
    async (prev: UserResult | null, fd: FormData) => {
      const res = await createUser(prev, fd)
      if (res.ok) router.refresh()
      return res
    },
    null,
  )

  function run(fn: () => Promise<UserResult>) {
    setRowError(null)
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) setRowError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="mb-3 font-medium text-ink">Usuarios</h2>
        {rowError && (
          <p role="alert" className="mb-3 rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
            {rowError}
          </p>
        )}
        <ul className="divide-y divide-line rounded-2xl border border-line bg-paper">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-ink">{u.name}</p>
                <p className="text-xs text-muted">{u.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  onChange={(e) => run(() => updateUserRole(u.id, e.target.value))}
                  className="rounded-lg border border-line bg-paper px-2 py-1 text-sm"
                >
                  <option value="admin">admin</option>
                  <option value="agent">agent</option>
                </select>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    const pwd = window.prompt("Nueva contraseña (mín. 8 caracteres):")
                    if (pwd) run(() => resetUserPassword(u.id, pwd))
                  }}
                  className="text-sm text-gold-deep hover:underline"
                >
                  Resetear contraseña
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-3 font-medium text-ink">Nuevo usuario</h2>
        <form action={action} className="grid max-w-lg gap-3 rounded-2xl border border-line bg-paper p-6">
          <input name="name" placeholder="Nombre" className={fieldClass} required />
          <input name="email" type="email" placeholder="email@dominio.com" className={fieldClass} required />
          <input name="password" type="password" placeholder="Contraseña (mín. 8)" className={fieldClass} required />
          <select name="role" defaultValue="agent" className={fieldClass}>
            <option value="agent">agent</option>
            <option value="admin">admin</option>
          </select>
          {state && !state.ok && (
            <p role="alert" className="rounded-lg bg-danger/15 px-3 py-2 text-sm text-danger">
              {state.error}
            </p>
          )}
          {state?.ok && <p className="text-sm text-green-700">Usuario creado.</p>}
          <button type="submit" disabled={creating}
            className="justify-self-start rounded-lg bg-gold px-5 py-2.5 text-sm font-medium text-ink hover:bg-gold-deep disabled:opacity-60">
            {creating ? "Creando…" : "Crear usuario"}
          </button>
        </form>
      </div>
    </div>
  )
}
