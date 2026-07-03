// lib/user-actions.ts
"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export type UserResult = { ok: true } | { ok: false; error: string }

function prismaCode(e: unknown): string | undefined {
  return typeof e === "object" && e !== null && "code" in e
    ? String((e as { code?: unknown }).code)
    : undefined
}

async function requireAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  return !!user && user.role === "admin"
}

export async function createUser(
  _prev: UserResult | null,
  formData: FormData,
): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const role = String(formData.get("role") ?? "agent") === "admin" ? "admin" : "agent"

  if (!name || !email) return { ok: false, error: "Nombre y email son obligatorios." }
  if (password.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return { ok: false, error: "Ya existe un usuario con ese email." }

  try {
    await prisma.user.create({
      data: { name, email, role, password: await bcrypt.hash(password, 10) },
    })
  } catch (e) {
    if (prismaCode(e) === "P2002") {
      return { ok: false, error: "Ya existe un usuario con ese email." }
    }
    return { ok: false, error: "No se pudo crear el usuario." }
  }
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}

export async function updateUserRole(userId: string, role: string): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  const safeRole = role === "admin" ? "admin" : "agent"
  try {
    await prisma.user.update({ where: { id: userId }, data: { role: safeRole } })
  } catch (e) {
    if (prismaCode(e) === "P2025") {
      return { ok: false, error: "Usuario no encontrado." }
    }
    return { ok: false, error: "No se pudo actualizar el usuario." }
  }
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<UserResult> {
  if (!(await requireAdmin())) return { ok: false, error: "No autorizado." }
  if (newPassword.length < 8) return { ok: false, error: "La contraseña debe tener al menos 8 caracteres." }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, 10) },
    })
  } catch (e) {
    if (prismaCode(e) === "P2025") {
      return { ok: false, error: "Usuario no encontrado." }
    }
    return { ok: false, error: "No se pudo actualizar la contraseña." }
  }
  revalidatePath("/admin/configuracion/usuarios")
  return { ok: true }
}
