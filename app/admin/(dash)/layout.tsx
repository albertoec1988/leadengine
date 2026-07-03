import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { AdminNav } from "@/components/admin/AdminNav"

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  if (!user) redirect("/admin/login")

  return (
    <div className="flex min-h-screen flex-col bg-paper-2 md:flex-row">
      <AdminNav user={{ name: user.name, role: user.role }} />
      <main className="flex-1 overflow-x-clip">{children}</main>
    </div>
  )
}
