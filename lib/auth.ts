import "server-only"
import { cookies } from "next/headers"
import crypto from "node:crypto"

const SECRET = process.env.SESSION_SECRET ?? "ffr-demo-secret-change-me"
const COOKIE = "ffr_session"

export type SessionUser = {
  uid: string
  name: string
  email: string
  role: "admin" | "agent"
}

export function signSession(user: SessionUser): string {
  const data = Buffer.from(JSON.stringify(user)).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET).update(data).digest("base64url")
  return `${data}.${sig}`
}

function verifySession(token: string): SessionUser | null {
  const [data, sig] = token.split(".")
  if (!data || !sig) return null
  const expected = crypto.createHmac("sha256", SECRET).update(data).digest("base64url")
  try {
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
    return JSON.parse(Buffer.from(data, "base64url").toString()) as SessionUser
  } catch {
    return null
  }
}

export const SESSION_COOKIE = COOKIE

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}
