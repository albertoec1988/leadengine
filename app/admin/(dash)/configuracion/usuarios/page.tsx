import { prisma } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"
import { UsersManager } from "@/components/admin/UsersManager"

export const dynamic = "force-dynamic"

export default async function UsuariosPage() {
  const session = await getSessionUser()
  if (!session || session.role !== "admin") {
    return <p className="text-sm text-muted">Solo un administrador puede gestionar usuarios.</p>
  }
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true },
  })
  return <UsersManager users={users} />
}
