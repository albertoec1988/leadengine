import { ScrubHero } from "@/components/motion/ScrubHero"
import { RevealText } from "@/components/motion/RevealText"
import { AnimatedCta } from "@/components/motion/AnimatedCta"
import { HERO_VIDEO_SRC, HERO_POSTER, HERO_POSTER_ALT } from "@/components/site/home/hero-media"

export function HeroCinematic() {
  return (
    <ScrubHero videoSrc={HERO_VIDEO_SRC} poster={HERO_POSTER} posterAlt={HERO_POSTER_ALT}>
      <div className="max-w-4xl text-center text-white">
        <RevealText
          as="h1"
          className="font-montserrat text-5xl font-extrabold uppercase leading-[1.05] tracking-tight sm:text-7xl"
        >
          Invested in you.
        </RevealText>
        <p className="mt-6 font-montserrat text-xs uppercase tracking-[0.35em] text-white/85 sm:text-sm">
          Service | Ethics | Commitment | Experience
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AnimatedCta href="/valuacion" variant="outline">
            What&apos;s my home worth?
          </AnimatedCta>
          <AnimatedCta href="/propiedades" variant="outline">
            Property Search
          </AnimatedCta>
        </div>
      </div>
    </ScrubHero>
  )
}
