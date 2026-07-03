import type { Metadata } from "next"
import { ContactForm } from "@/components/site/ContactForm"

export const metadata: Metadata = {
  title: "Contacto",
  description: "Habla con el equipo de Floridian First Realty en Coral Gables.",
}

export default function ContactoPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20">
      <h1 className="font-display text-4xl text-ink sm:text-5xl">Hablemos</h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        ¿Compras, vendes o solo quieres entender el mercado de Coral Gables?
        Escríbenos y te contactamos.
      </p>
      <div className="mt-10">
        <ContactForm />
      </div>
    </section>
  )
}
