"use server"

import { prisma } from "@/lib/db"
import { estimateValue, type PropertyCondition } from "@/lib/valuation"
import { scoreLead } from "@/lib/scoring"
import { normalizeInbound } from "@/lib/channels"
import { revalidatePath } from "next/cache"

async function pickAgentId(): Promise<string | null> {
  // reparto simple: primer agente disponible (round-robin real vendría en fase 2)
  const agent = await prisma.user.findFirst({ where: { role: "agent" }, orderBy: { createdAt: "asc" } })
  return agent?.id ?? null
}

export type ValuationResponse =
  | { ok: true; estimate: number; low: number; high: number }
  | { ok: false; error: string }

export async function submitValuation(input: {
  name: string
  email: string
  phone?: string
  zone: string
  areaSqft: number
  bedrooms: number
  bathrooms: number
  condition: PropertyCondition
}): Promise<ValuationResponse> {
  if (!input.name?.trim() || !input.email?.trim()) {
    return { ok: false, error: "Nombre y email son obligatorios." }
  }
  if (!Number.isFinite(input.areaSqft) || input.areaSqft <= 0) {
    return { ok: false, error: "Introduce una superficie válida." }
  }

  const valuation = estimateValue({
    zone: input.zone,
    areaSqft: input.areaSqft,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    condition: input.condition,
  })

  const normalized = normalizeInbound({
    source: "valuation",
    name: input.name,
    email: input.email,
    phone: input.phone,
    zone: input.zone,
    text: `Solicitó valuación: ${input.areaSqft} sqft, ${input.bedrooms} hab, ${input.bathrooms} baños (${input.condition}) en ${input.zone}.`,
  })

  const score = scoreLead({
    channel: normalized.channel,
    hasEmail: !!normalized.email,
    hasPhone: !!normalized.phone,
    hasPropertyInterest: false,
    hasZoneInterest: !!normalized.zone,
    message: normalized.message,
  })

  const lead = await prisma.lead.create({
    data: {
      name: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      channel: normalized.channel,
      zone: normalized.zone,
      message: normalized.message,
      score,
      status: "new",
      agentId: await pickAgentId(),
    },
  })

  await prisma.valuation.create({
    data: {
      zone: input.zone,
      areaSqft: input.areaSqft,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      condition: input.condition,
      estimate: valuation.estimate,
      low: valuation.low,
      high: valuation.high,
      leadId: lead.id,
    },
  })

  revalidatePath("/admin/leads")
  revalidatePath("/admin")

  return { ok: true, estimate: valuation.estimate, low: valuation.low, high: valuation.high }
}

export type ContactResponse = { ok: true } | { ok: false; error: string }

export async function submitContactLead(input: {
  name: string
  email?: string
  phone?: string
  message?: string
  propertyId?: string
  zone?: string
  source?: string
}): Promise<ContactResponse> {
  if (!input.name?.trim()) {
    return { ok: false, error: "El nombre es obligatorio." }
  }
  if (!input.email?.trim() && !input.phone?.trim()) {
    return { ok: false, error: "Deja al menos un email o teléfono de contacto." }
  }

  const normalized = normalizeInbound({
    source: input.source ?? "web",
    name: input.name,
    email: input.email,
    phone: input.phone,
    text: input.message,
    propertyId: input.propertyId,
    zone: input.zone,
  })

  const score = scoreLead({
    channel: normalized.channel,
    hasEmail: !!normalized.email,
    hasPhone: !!normalized.phone,
    hasPropertyInterest: !!normalized.propertyId,
    hasZoneInterest: !!normalized.zone,
    message: normalized.message,
  })

  await prisma.lead.create({
    data: {
      name: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      channel: normalized.channel,
      zone: normalized.zone,
      message: normalized.message,
      propertyId: normalized.propertyId,
      score,
      status: "new",
      agentId: await pickAgentId(),
    },
  })

  revalidatePath("/admin/leads")
  revalidatePath("/admin")

  return { ok: true }
}

const SAMPLE_NAMES = [
  "María González", "James Carter", "Sofía Herrera", "David Kim",
  "Lucía Fernández", "Robert Miles", "Elena Ríos", "Andrés Costa",
]
const SAMPLE_MESSAGES: Record<string, string> = {
  whatsapp: "Hola, vi una casa en su perfil, ¿sigue disponible?",
  instagram: "Me encanta esta propiedad 😍 ¿precio?",
  web: "Quisiera más información sobre casas en la zona.",
}

// Demo: simula un lead entrante por un canal externo y lo consolida en el CRM.
export async function simulateInbound(channel: "whatsapp" | "instagram" | "web"): Promise<ContactResponse> {
  const idx = Date.now() % SAMPLE_NAMES.length
  const name = SAMPLE_NAMES[idx]
  const zones = ["Coral Gables", "South Miami", "Kendall"]
  const zone = zones[Date.now() % zones.length]

  const normalized = normalizeInbound({
    source: channel,
    name,
    phone: channel === "whatsapp" ? `+1305555${1000 + idx}` : undefined,
    email: channel === "instagram" ? undefined : `${name.split(" ")[0].toLowerCase()}@example.com`,
    text: SAMPLE_MESSAGES[channel],
    zone,
  })

  const score = scoreLead({
    channel: normalized.channel,
    hasEmail: !!normalized.email,
    hasPhone: !!normalized.phone,
    hasPropertyInterest: false,
    hasZoneInterest: !!normalized.zone,
    message: normalized.message,
  })

  await prisma.lead.create({
    data: {
      name: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      channel: normalized.channel,
      zone: normalized.zone,
      message: normalized.message,
      score,
      status: "new",
      agentId: await pickAgentId(),
    },
  })

  revalidatePath("/admin/leads")
  revalidatePath("/admin")
  revalidatePath("/admin/alertas")
  return { ok: true }
}
