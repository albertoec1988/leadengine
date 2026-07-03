import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { ParallaxLayer } from "@/components/motion/ParallaxLayer"

export function HeartOfFFR() {
  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:py-28 lg:grid-cols-[0.9fr_1.1fr]">
        <ParallaxLayer speed={0.2} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
            <Image
              src="/ffr/05_michelle-y-kevin-gonzalez.jpg"
              alt="Picture of Michelle and Kevin Gonzalez"
              fill
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="object-cover"
            />
          </div>
        </ParallaxLayer>
        <div>
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            At the heart of FFR
          </RevealText>
          <div className="mt-8 space-y-5 leading-relaxed text-ffr-slate">
            <p>
              With over 25 years of real estate expertise, we are passionately dedicated to the
              growth and evolution of our vibrant city, Miami. As experienced brokers, we bring a
              wealth of knowledge and strategic insight to every negotiation, ensuring our clients
              receive unparalleled guidance at every step. Rooted in a foundation of ethics,
              professionalism, honesty, and kindness, we strive to deliver an exceptional real
              estate experience that you can trust.
            </p>
            <p>
              Our commitment to excellence goes beyond transactions, we are continuously growing,
              both intellectually and spiritually, while leaving a meaningful impact on
              Miami&apos;s future. Whether you&apos;re buying your dream home, seeking a savvy
              investment, or exploring opportunities to build wealth, we are here to guide you
              with transparency and unwavering dedication.
            </p>
            <p>
              Through every market cycle, we&apos;ve stood by our clients, navigating challenges
              and celebrating successes together. Let us show you how we can help turn your real
              estate goals into reality while building a brighter future for our beloved city.
            </p>
          </div>
          <p className="mt-8 font-montserrat text-lg font-semibold text-ffr-navy">
            Michelle and Kevin
          </p>
        </div>
      </div>
    </section>
  )
}
