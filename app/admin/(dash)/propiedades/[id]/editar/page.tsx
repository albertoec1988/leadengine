import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { PropertyForm, type PropertyFormValues } from "@/components/admin/PropertyForm"

export const dynamic = "force-dynamic"

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const property = await prisma.property.findUnique({ where: { id } })
  if (!property) notFound()

  const values: PropertyFormValues = {
    id: property.id,
    title: property.title,
    zone: property.zone,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqft: property.areaSqft,
    address: property.address,
    status: property.status,
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-8">
      <Link href="/admin/propiedades" className="text-sm text-muted hover:text-ink">
        ← Volver a propiedades
      </Link>
      <h1 className="mt-3 mb-6 font-display text-2xl text-ink">Editar propiedad</h1>
      <PropertyForm mode="edit" property={values} />
      {/* La galería de imágenes se añade en la Fase 4 (Task 4.3). */}
    </section>
  )
}
