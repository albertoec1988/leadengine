"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { signSession, SESSION_COOKIE, type SessionUser } from "@/lib/auth"

export type LoginResult = { ok: false; error: string } | { ok: true }

export async function loginAction(_prev: LoginResult | null, formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  if (!email || !password) return { ok: false, error: "Introduce email y contraseña." }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return { ok: false, error: "Credenciales incorrectas." }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return { ok: false, error: "Credenciales incorrectas." }

  const session: SessionUser = {
    uid: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "agent",
  }
  const store = await cookies()
  store.set(SESSION_COOKIE, signSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  return { ok: true }
}

export async function logoutAction() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
  redirect("/admin/login")
}
