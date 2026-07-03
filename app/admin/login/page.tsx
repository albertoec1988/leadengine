import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { LoginForm } from "@/components/admin/LoginForm"

export const metadata: Metadata = { title: "Acceso equipo" }

export default async function LoginPage() {
  const user = await getSessionUser()
  if (user) redirect("/admin")

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl text-paper">Floridian First</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gold">LeadEngine</p>
        </div>
        <div className="rounded-2xl bg-paper p-7 shadow-2xl">
          <h1 className="font-display text-2xl text-ink">Acceso del equipo</h1>
          <p className="mt-1 text-sm text-muted">Entra para gestionar tus leads y el pipeline.</p>
          <LoginForm />
          <p className="mt-5 rounded-lg bg-paper-2 px-3 py-2 text-xs text-muted">
            Demo: <span className="font-medium text-ink">admin@floridianfirst.com</span> / demo1234
          </p>
        </div>
      </div>
    </div>
  )
}
