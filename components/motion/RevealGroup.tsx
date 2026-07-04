"use client"

// Entrada escalonada con profundidad (y + scale + fade) de los hijos directos
// al entrar en viewport. Contenido siempre visible sin JS/reduced-motion.

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"
import { DUR, EASE, STAGGER } from "@/lib/motion-config"

export function RevealGroup({
  children,
  className,
  y = 36,
  stagger = STAGGER.cards,
}: {
  children: React.ReactNode
  className?: string
  y?: number
  stagger?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled } = useMotion()

  useGSAP(
    () => {
      if (!enabled || !ref.current) return
      gsap.from(ref.current.children, {
        y,
        scale: 0.965,
        opacity: 0,
        duration: DUR.reveal,
        ease: EASE.out,
        stagger,
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      })
    },
    { scope: ref, dependencies: [enabled, y, stagger], revertOnUpdate: true },
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
