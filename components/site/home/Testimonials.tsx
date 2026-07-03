import { RevealText } from "@/components/motion/RevealText"

const TESTIMONIALS = [
  {
    author: "Maria Rod-Rey",
    quote:
      "Floridian Realty did an outstanding job leasing our warehouse! They truly went above and beyond! Through their diligent efforts, we leased our warehouse to reliable consistent paying tenants for top-dollar a year ago. Because we had always occupied our warehouse we were unfamiliar with the standard lease requirements, such as deposit amounts, lease payment terms, renewal increase, etc. They guided us every step of the way. They only brought us vetted prospective tenants. It was a pleasure to work with them!",
  },
]

export function Testimonials() {
  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:py-28">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Testimonials
        </RevealText>
        <ul className="mt-10">
          {TESTIMONIALS.map((t) => (
            <li key={t.author}>
              <RevealText as="p" className="text-lg italic leading-relaxed text-ffr-slate sm:text-xl">
                “{t.quote}”
              </RevealText>
              <p className="mt-6 font-montserrat text-sm font-semibold uppercase tracking-[0.2em] text-ffr-navy">
                — {t.author}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
