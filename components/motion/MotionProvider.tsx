"use client"

// Monta la infraestructura de movimiento UNA vez para el frontend público:
// - registra los plugins de GSAP
// - arranca Lenis (smooth scroll) sincronizado con ScrollTrigger
// - calcula el gate central (reduced-motion / móvil) y lo expone por contexto
// El admin nunca importa este módulo.

import { createContext, useContext, useEffect, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { SplitText } from "gsap/SplitText"
import { Draggable } from "gsap/Draggable"
import { InertiaPlugin } from "gsap/InertiaPlugin"
import { useGSAP } from "@gsap/react"
import Lenis from "lenis"
import { motionState, MOBILE_MAX_WIDTH, type MotionState } from "@/lib/motion-config"

const MotionCtx = createContext<MotionState>({ enabled: false, heavyEnabled: false })

export function useMotion(): MotionState {
  return useContext(MotionCtx)
}

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Arranca apagado: el SSR pinta contenido estático y los efectos entran tras montar.
  const [state, setState] = useState<MotionState>({ enabled: false, heavyEnabled: false })

  useEffect(() => {
    gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Draggable, InertiaPlugin)

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)")
    const mqMobile = window.matchMedia(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
    const update = () =>
      setState(motionState({ reducedMotion: mqReduce.matches, isMobile: mqMobile.matches }))
    update()
    mqReduce.addEventListener("change", update)
    mqMobile.addEventListener("change", update)

    // Smooth scroll global (solo si el usuario no pide menos movimiento).
    let lenis: Lenis | null = null
    let raf: ((time: number) => void) | null = null
    if (!mqReduce.matches) {
      lenis = new Lenis()
      lenis.on("scroll", ScrollTrigger.update)
      raf = (time: number) => lenis!.raf(time * 1000)
      gsap.ticker.add(raf)
      gsap.ticker.lagSmoothing(0)
    }

    return () => {
      mqReduce.removeEventListener("change", update)
      mqMobile.removeEventListener("change", update)
      if (raf) gsap.ticker.remove(raf)
      lenis?.destroy()
    }
  }, [])

  return <MotionCtx.Provider value={state}>{children}</MotionCtx.Provider>
}
