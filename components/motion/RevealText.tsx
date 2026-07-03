"use client"

// Titulares que se revelan palabra a palabra tras una máscara (SplitText).
// Con motion apagado, el texto simplemente se ve: nunca se oculta contenido en SSR.

import { useRef } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"
import { DUR, EASE, STAGGER } from "@/lib/motion-config"

export function RevealText({
  children,
  as: Tag = "div",
  className,
}: {
  children: React.ReactNode
  as?: "h1" | "h2" | "h3" | "p" | "div" | "span"
  className?: string
}) {
  const ref = useRef<HTMLElement | null>(null)
  const { enabled } = useMotion()

  useGSAP(
    () => {
      if (!enabled || !ref.current) return
      const split = new SplitText(ref.current, {
        type: "lines,words",
        linesClass: "overflow-hidden",
      })
      gsap.from(split.words, {
        yPercent: 110,
        opacity: 0,
        duration: DUR.reveal,
        ease: EASE.out,
        stagger: STAGGER.words,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      })
      return () => split.revert()
    },
    { scope: ref, dependencies: [enabled] },
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Tag ref={ref as any} className={className}>{children}</Tag>
}
