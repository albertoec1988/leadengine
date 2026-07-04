import type { Metadata } from "next"
import { RevealText } from "@/components/motion/RevealText"
import { MortgageCalculator } from "@/components/site/MortgageCalculator"

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description:
    "Estimate your monthly mortgage payment — principal & interest, taxes, insurance, HOA and PMI — with Floridian First Realty.",
}

export default async function MortgageCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ price?: string }>
}) {
  const sp = await searchParams
  const initialPrice = sp.price ? Number(sp.price) : undefined

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-14 sm:py-20">
      <RevealText
        as="h1"
        className="font-montserrat text-3xl font-extrabold uppercase tracking-[0.12em] text-ffr-navy sm:text-4xl"
      >
        Mortgage Calculator
      </RevealText>
      <p className="mt-3 max-w-2xl text-ffr-slate">
        See what your monthly payment could look like — including taxes, insurance and PMI.
      </p>
      <div className="mt-10">
        <MortgageCalculator initialPrice={Number.isFinite(initialPrice) ? initialPrice : undefined} />
      </div>
    </section>
  )
}
