import type { Metadata } from "next"
import { ValuationForm } from "@/components/site/ValuationForm"

export const metadata: Metadata = {
  title: "Valora tu casa",
  description:
    "Recibe una estimación inmediata del valor de tu vivienda en Coral Gables, South Miami, Kendall, Miami o Fort Lauderdale.",
}

export default function ValuacionPage() {
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-16 sm:py-20">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-gold-deep">
        Valuación gratuita
      </p>
      <h1
        className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl"
        style={{ overflowWrap: "anywhere", minWidth: 0 }}
      >
        ¿Cuánto vale tu casa hoy?
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Introduce los datos de tu vivienda y recibe una estimación al instante.
        Un agente te contactará con un análisis detallado — sin compromiso.
      </p>
      <div className="mt-10">
        <ValuationForm />
      </div>
    </section>
  )
}
