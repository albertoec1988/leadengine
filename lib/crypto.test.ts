// lib/crypto.test.ts
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { encryptJSON, decryptJSON, maskSecret } from "@/lib/crypto"

const ORIGINAL = process.env.APP_ENCRYPTION_KEY

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = "0".repeat(64) // 32 bytes en hex
})
afterAll(() => {
  process.env.APP_ENCRYPTION_KEY = ORIGINAL
})

describe("crypto", () => {
  it("round-trips an object and does not leak plaintext", () => {
    const enc = encryptJSON({ token: "abc123", id: "xyz" })
    expect(enc).not.toContain("abc123")
    expect(decryptJSON(enc)).toEqual({ token: "abc123", id: "xyz" })
  })

  it("produces different ciphertext each call (random IV)", () => {
    expect(encryptJSON({ a: 1 })).not.toBe(encryptJSON({ a: 1 }))
  })

  it("masks a secret showing only the last 4 chars", () => {
    expect(maskSecret("supersecret1234")).toBe("••••1234")
    expect(maskSecret("")).toBe("")
  })

  it("throws a clear error without a key", () => {
    const prev = process.env.APP_ENCRYPTION_KEY
    delete process.env.APP_ENCRYPTION_KEY
    expect(() => encryptJSON({ a: 1 })).toThrow(/APP_ENCRYPTION_KEY/)
    process.env.APP_ENCRYPTION_KEY = prev
  })
})
