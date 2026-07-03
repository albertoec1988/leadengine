// lib/crypto.ts
import crypto from "node:crypto"

const ALGO = "aes-256-gcm"

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY
  if (!raw) throw new Error("APP_ENCRYPTION_KEY no está definida")
  const key = Buffer.from(raw, raw.length === 64 ? "hex" : "base64")
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY debe ser de 32 bytes (64 hex o 44 base64)")
  }
  return key
}

export function encryptJSON(obj: unknown): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv)
  const enc = Buffer.concat([
    cipher.update(Buffer.from(JSON.stringify(obj), "utf8")),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(":")
}

export function decryptJSON<T = unknown>(payload: string): T {
  const [ivB64, tagB64, dataB64] = payload.split(":")
  if (!ivB64 || !tagB64 || !dataB64) throw new Error("Formato de credencial inválido")
  const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"))
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  const dec = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ])
  return JSON.parse(dec.toString("utf8")) as T
}

export function maskSecret(value: string): string {
  if (!value) return ""
  return `••••${value.slice(-4)}`
}
