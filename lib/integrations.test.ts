import { describe, it, expect } from "vitest"
import { CHANNELS, getChannel } from "@/lib/integrations"

describe("integrations registry", () => {
  it("includes the six channels", () => {
    expect(CHANNELS.map((c) => c.channel).sort()).toEqual(
      ["facebook", "gmail", "instagram", "tiktok", "whatsapp", "youtube"].sort(),
    )
  })

  it("has unique channel ids", () => {
    const ids = CHANNELS.map((c) => c.channel)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every channel has at least one field with a stable name", () => {
    for (const c of CHANNELS) {
      expect(c.fields.length).toBeGreaterThan(0)
      for (const f of c.fields) expect(f.name).toMatch(/^[a-zA-Z0-9_]+$/)
    }
  })

  it("getChannel returns the def or undefined", () => {
    expect(getChannel("gmail")?.name).toBe("Gmail")
    expect(getChannel("nope")).toBeUndefined()
  })
})
