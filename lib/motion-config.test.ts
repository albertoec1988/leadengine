// lib/motion-config.test.ts
import { describe, it, expect } from "vitest"
import { motionState, DUR, EASE, STAGGER, MOBILE_MAX_WIDTH } from "@/lib/motion-config"

describe("motion-config", () => {
  it("reduced motion disables everything", () => {
    expect(motionState({ reducedMotion: true, isMobile: false })).toEqual({
      enabled: false,
      heavyEnabled: false,
    })
    expect(motionState({ reducedMotion: true, isMobile: true })).toEqual({
      enabled: false,
      heavyEnabled: false,
    })
  })

  it("mobile keeps light effects but disables heavy ones", () => {
    expect(motionState({ reducedMotion: false, isMobile: true })).toEqual({
      enabled: true,
      heavyEnabled: false,
    })
  })

  it("desktop without reduced motion enables everything", () => {
    expect(motionState({ reducedMotion: false, isMobile: false })).toEqual({
      enabled: true,
      heavyEnabled: true,
    })
  })

  it("exposes central animation tokens", () => {
    expect(DUR.reveal).toBeGreaterThan(0)
    expect(EASE.out).toMatch(/power/)
    expect(STAGGER.words).toBeGreaterThan(0)
    expect(MOBILE_MAX_WIDTH).toBe(767)
  })
})
