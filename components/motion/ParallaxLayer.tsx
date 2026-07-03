"use client"

// Capa con desplazamiento parallax ligado al scroll (solo transform).
// speed > 0 se mueve "más lento" que el scroll; se apaga en móvil/reduced.

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function ParallaxLayer({
  children,
  speed = 0.15,
  className,
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { heavyEnabled } = useMotion()

  useGSAP(
    () => {
      if (!heavyEnabled || !ref.current) return
      gsap.fromTo(
        ref.current,
        { yPercent: speed * 30 },
        {
          yPercent: -speed * 30,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      )
    },
    { scope: ref, dependencies: [heavyEnabled, speed] },
  )

  return (
    <div ref={ref} className={className} style={{ willChange: heavyEnabled ? "transform" : undefined }}>
      {children}
    </div>
  )
}
