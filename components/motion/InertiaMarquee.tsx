"use client"

// Marquee infinito estilo Radian: se desliza solo y se puede "agarrar y lanzar"
// (Draggable + InertiaPlugin). El contenido se duplica para el bucle.
// Con heavyEnabled=false degrada a un carril con scroll horizontal nativo.

import { useRef } from "react"
import gsap from "gsap"
import { Draggable } from "gsap/Draggable"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function InertiaMarquee({
  children,
  speed = 40, // px/segundo del auto-desplazamiento
  className = "",
}: {
  children: React.ReactNode
  speed?: number
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { heavyEnabled } = useMotion()

  useGSAP(
    () => {
      const track = trackRef.current
      if (!heavyEnabled || !track) return

      // El track contiene el contenido DOS veces: el bucle envuelve en -half..0.
      const half = track.scrollWidth / 2
      if (half === 0) return
      const wrapX = gsap.utils.wrap(-half, 0)
      const pos = { x: 0 }
      let dragging = false

      const render = () => gsap.set(track, { x: wrapX(pos.x) })

      const tick = (_t: number, deltaMs: number) => {
        if (!dragging) {
          pos.x -= (speed * deltaMs) / 1000
          render()
        }
      }
      gsap.ticker.add(tick)

      // Proxy invisible: Draggable mueve el proxy y nosotros trasladamos el delta al bucle.
      const proxy = document.createElement("div")
      let lastProxyX = 0
      const drag = Draggable.create(proxy, {
        type: "x",
        trigger: wrapRef.current,
        inertia: true,
        onPress() {
          dragging = true
          lastProxyX = this.x
        },
        onDrag() {
          pos.x += this.x - lastProxyX
          lastProxyX = this.x
          render()
        },
        onThrowUpdate() {
          pos.x += this.x - lastProxyX
          lastProxyX = this.x
          render()
        },
        onThrowComplete() {
          dragging = false
        },
        onRelease() {
          if (!this.tween) dragging = false
        },
      })[0]

      return () => {
        gsap.ticker.remove(tick)
        drag.kill()
      }
    },
    { scope: wrapRef, dependencies: [heavyEnabled, speed], revertOnUpdate: true },
  )

  return (
    <div
      ref={wrapRef}
      className={`${heavyEnabled ? "cursor-grab overflow-hidden active:cursor-grabbing" : "overflow-x-auto"} ${className}`}
    >
      <div ref={trackRef} className="flex w-max items-center">
        {children}
        {heavyEnabled && (
          <div aria-hidden="true" className="flex items-center">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
