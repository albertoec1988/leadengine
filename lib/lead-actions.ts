"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { leadStatusLabel } from "@/lib/format"

const VALID_STATUS = ["new", "contacted", "qualified", "visit", "offer", "won", "lost"]
const VALID_STAGE = ["new", "contacted", "visit", "offer", "closed"]

export async function updateLeadStatus(leadId: string, status: string) {
  if (!VALID_STATUS.includes(status)) return
  await prisma.lead.update({
    where: { id: leadId },
    data: { status, lastActivityAt: new Date() },
  })
  await prisma.leadActivity.create({
    data: { leadId, type: "status_change", content: `Estado cambiado a "${leadStatusLabel(status)}"` },
  })
  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath("/admin/leads")
  revalidatePath("/admin")
}

export async function addLeadNote(leadId: string, content: string) {
  const text = content.trim()
  if (!text) return
  await prisma.leadActivity.create({ data: { leadId, type: "note", content: text } })
  await prisma.lead.update({ where: { id: leadId }, data: { lastActivityAt: new Date() } })
  revalidatePath(`/admin/leads/${leadId}`)
}

export async function assignAgent(leadId: string, agentId: string) {
  await prisma.lead.update({ where: { id: leadId }, data: { agentId: agentId || null } })
  revalidatePath(`/admin/leads/${leadId}`)
}

export async function createOpportunity(leadId: string, propertyId: string, value: number) {
  const existing = await prisma.opportunity.findUnique({ where: { leadId } })
  if (existing) return
  await prisma.opportunity.create({
    data: { leadId, propertyId, value: Math.round(value), stage: "new", probability: 30 },
  })
  revalidatePath(`/admin/leads/${leadId}`)
  revalidatePath("/admin/pipeline")
  revalidatePath("/admin")
}

export async function moveOpportunityStage(opportunityId: string, stage: string) {
  if (!VALID_STAGE.includes(stage)) return
  const probByStage: Record<string, number> = { new: 20, contacted: 40, visit: 60, offer: 80, closed: 100 }
  await prisma.opportunity.update({
    where: { id: opportunityId },
    data: { stage, probability: probByStage[stage] ?? 20 },
  })
  revalidatePath("/admin/pipeline")
  revalidatePath("/admin")
}
