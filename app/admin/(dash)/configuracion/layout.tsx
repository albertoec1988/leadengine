import { ConfigTabs } from "@/components/admin/ConfigTabs"

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-8">
      <h1 className="mb-4 font-display text-2xl text-ink">Configuración</h1>
      <ConfigTabs />
      {children}
    </section>
  )
}
