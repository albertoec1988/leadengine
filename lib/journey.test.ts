import { describe, it, expect } from "vitest"
import { interpolateStops, polylineLength } from "@/lib/journey"

const A = { lat: 25.0, lng: -80.0 }
const B = { lat: 26.0, lng: -81.0 }
const C = { lat: 27.0, lng: -80.0 }

describe("interpolateStops", () => {
  it("clamps t and returns endpoints", () => {
    expect(interpolateStops([A, B], -0.5)).toEqual({ index: 0, lat: 25.0, lng: -80.0 })
    expect(interpolateStops([A, B], 1.5)).toEqual({ index: 1, lat: 26.0, lng: -81.0 })
  })

  it("interpolates linearly within a segment", () => {
    const mid = interpolateStops([A, B], 0.5)
    expect(mid.lat).toBeCloseTo(25.5)
    expect(mid.lng).toBeCloseTo(-80.5)
  })

  it("maps t across multiple segments and reports the nearest stop index", () => {
    // 3 paradas = 2 segmentos; t=0.75 está a mitad del segundo segmento
    const p = interpolateStops([A, B, C], 0.75)
    expect(p.lat).toBeCloseTo(26.5)
    expect(p.lng).toBeCloseTo(-80.5)
    expect(p.index).toBe(2) // ya más cerca de C
    expect(interpolateStops([A, B, C], 0.5).index).toBe(1)
  })

  it("handles single-stop journeys", () => {
    expect(interpolateStops([A], 0.7)).toEqual({ index: 0, lat: 25.0, lng: -80.0 })
  })
})

describe("polylineLength", () => {
  it("sums segment lengths", () => {
    expect(polylineLength([{ x: 0, y: 0 }, { x: 3, y: 4 }, { x: 3, y: 14 }])).toBeCloseTo(15)
  })
  it("returns 0 for fewer than 2 points", () => {
    expect(polylineLength([{ x: 1, y: 1 }])).toBe(0)
  })
})
