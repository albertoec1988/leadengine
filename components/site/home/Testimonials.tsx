import { RevealText } from "@/components/motion/RevealText"
import { ParallaxLayer } from "@/components/motion/ParallaxLayer"
import { RevealGroup } from "@/components/motion/RevealGroup"

const TESTIMONIALS = [
  {
    author: "Maria Rod-Rey",
    quote:
      "Floridian Realty did an outstanding job leasing our warehouse! They truly went above and beyond! Through their diligent efforts, we leased our warehouse to reliable consistent paying tenants for top-dollar a year ago. Because we had always occupied our warehouse we were unfamiliar with the standard lease requirements, such as deposit amounts, lease payment terms, renewal increase, etc. They guided us every step of the way. They only brought us vetted prospective tenants. It was a pleasure to work with them!",
  },
]

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-paper-2">
      <ParallaxLayer speed={-0.2} className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-ffr-navy/5">
        <div />
      </ParallaxLayer>
      <ParallaxLayer speed={0.25} className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-ffr-navy/5">
        <div />
      </ParallaxLayer>
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:py-28">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Testimonials
        </RevealText>
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-24 -translate-x-1/2 select-none font-display text-[16rem] leading-none text-ffr-navy/10"
        >
          &ldquo;
        </span>
        <RevealGroup className="relative mt-10">
          {TESTIMONIALS.map((t) => (
            <li key={t.author} className="rounded-3xl bg-white/70 p-8 shadow-sm backdrop-blur-sm sm:p-12">
              <RevealText as="p" className="text-lg italic leading-relaxed text-ffr-slate sm:text-xl">
                “{t.quote}”
              </RevealText>
              <p className="mt-6 font-montserrat text-sm font-semibold uppercase tracking-[0.2em] text-ffr-navy">
                — {t.author}
              </p>
            </li>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
