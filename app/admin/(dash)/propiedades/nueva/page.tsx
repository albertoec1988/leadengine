import Link from "next/link"
import { PageHeader } from "@/components/admin/ui"
import { NewPropertyForm } from "@/components/admin/NewPropertyForm"

export default function NewPropertyPage() {
  return (
    <>
      <PageHeader title="Nueva propiedad" subtitle="Añade un inmueble al catálogo público e interno." />
      <div className="max-w-2xl p-5 sm:p-8">
        <Link href="/admin/propiedades" className="text-sm text-muted hover:text-ink">← Volver a propiedades</Link>
        <div className="mt-4">
          <NewPropertyForm />
        </div>
      </div>
    </>
  )
}
