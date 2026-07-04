import { RevealText } from "@/components/motion/RevealText"
import { ParallaxLayer } from "@/components/motion/ParallaxLayer"
import { AnimatedCta } from "@/components/motion/AnimatedCta"

export function ValuationMagnet() {
  return (
    <section className="relative overflow-hidden bg-ffr-navy">
      {/* Capa decorativa con parallax sutil */}
      <ParallaxLayer speed={-0.25} className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5">
        <div />
      </ParallaxLayer>
      <ParallaxLayer speed={0.3} className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5">
        <div />
      </ParallaxLayer>
      <div className="relative mx-auto max-w-4xl px-5 py-14 text-center sm:py-20">
        <RevealText
          as="h2"
          className="font-montserrat text-3xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl"
        >
          What&apos;s your home worth?
        </RevealText>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
          Get an instant AI-powered estimate of your property&apos;s value — free, no obligation.
        </p>
        <div className="mt-10 flex justify-center">
          <AnimatedCta href="/valuacion" variant="outline">
            Get my free estimate
          </AnimatedCta>
        </div>
      </div>
    </section>
  )
}
