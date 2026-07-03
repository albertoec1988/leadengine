"use client"

import { useRef } from "react"
import Image from "next/image"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { RevealText } from "@/components/motion/RevealText"
import { useMotion } from "@/components/motion/MotionProvider"
import { DUR, EASE, STAGGER } from "@/lib/motion-config"

const ASSOCIATIONS = [
  { file: "23_assoc-womens-council-realtors.png", name: "Women's Council of Realtors" },
  { file: "24_assoc-equal-housing-opportunity.png", name: "Equal Housing Opportunity" },
  { file: "25_assoc-national-association-realtors.png", name: "National Association of Realtors" },
  { file: "26_assoc-fiu-business.png", name: "FIU Business" },
  { file: "27_assoc-coral-gables-chamber.png", name: "Coral Gables Chamber of Commerce" },
  { file: "28_assoc-florida-ccim-chapter.png", name: "Florida CCIM Chapter" },
]

export function Partnerships() {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled } = useMotion()

  useGSAP(
    () => {
      if (!enabled || !ref.current) return
      gsap.from(ref.current.children, {
        y: 24,
        opacity: 0,
        duration: DUR.reveal,
        ease: EASE.out,
        stagger: STAGGER.cards,
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      })
    },
    { scope: ref, dependencies: [enabled] },
  )

  return (
    <section className="bg-ffr-navy py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-white sm:text-3xl"
        >
          Partnerships &amp; Associations
        </RevealText>
        <div ref={ref} className="mt-12 grid grid-cols-2 items-center gap-10 sm:grid-cols-3 lg:grid-cols-6">
          {ASSOCIATIONS.map((a) => (
            <div
              key={a.file}
              className="flex items-center justify-center transition-transform duration-200 hover:-translate-y-1"
            >
              <Image
                src={`/ffr/${a.file}`}
                alt={`${a.name} logo`}
                width={120}
                height={80}
                className="max-h-20 w-auto object-contain opacity-85 transition duration-200 hover:opacity-100 hover:brightness-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
