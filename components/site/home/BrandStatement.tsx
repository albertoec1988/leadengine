import { RevealText } from "@/components/motion/RevealText"

export function BrandStatement() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-4xl px-5 py-14 text-center sm:py-20">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Floridian First Realty
        </RevealText>
        <RevealText as="p" className="mt-8 text-lg leading-relaxed text-ffr-slate sm:text-xl">
          At Floridian First, real estate is not just about the transaction, it&apos;s about making
          memories, creating generational wealth, and establishing long lasting relationships.
          Accomplishing the task of homeownership and investment brokerage is a product of our
          professional and ethical service. At the heart of Floridian First Realty, our team of
          specialists offers guidance, transparency, and hands-on negotiation skills in niche
          pockets of residential and commercial real estate. Our unparalleled service and ethics
          commitment is built on client centric success through customer satisfaction, loyalty,
          and referrals. We are invested in YOU!
        </RevealText>
      </div>
    </section>
  )
}
