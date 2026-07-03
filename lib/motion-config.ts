// lib/motion-config.ts
// Configuración CENTRAL de la capa de movimiento (portada FFR).
// Puro: sin imports de gsap/next para poder testearlo con vitest.
// Ajustar duraciones/easings/staggers aquí — un solo sitio.

export const DUR = { fast: 0.35, reveal: 0.8, hero: 1.1 }
export const EASE = { out: "power3.out", inOut: "power2.inOut" }
export const STAGGER = { words: 0.05, cards: 0.12 }
export const MOBILE_MAX_WIDTH = 767

export type MotionState = {
  /** false = prefers-reduced-motion: todo apagado (reveals incluidos) */
  enabled: boolean
  /** false = móvil o reduced: sin scrub/parallax/inercia (efectos costosos) */
  heavyEnabled: boolean
}

export function motionState(input: {
  reducedMotion: boolean
  isMobile: boolean
}): MotionState {
  const enabled = !input.reducedMotion
  return { enabled, heavyEnabled: enabled && !input.isMobile }
}
