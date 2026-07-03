import "server-only"
import { prisma } from "@/lib/db"

export type PropertyFilters = {
  zone?: string
  status?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
}

export async function getFeaturedProperties(limit = 6) {
  return prisma.property.findMany({
    where: { status: "for_sale" },
    orderBy: { price: "desc" },
    take: limit,
  })
}

export async function getProperties(filters: PropertyFilters = {}) {
  return prisma.property.findMany({
    where: {
      zone: filters.zone,
      status: filters.status,
      bedrooms: filters.beds ? { gte: filters.beds } : undefined,
      price: {
        gte: filters.minPrice,
        lte: filters.maxPrice,
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPropertyById(id: string) {
  return prisma.property.findUnique({ where: { id } })
}

export async function getZoneSummary() {
  const grouped = await prisma.property.groupBy({
    by: ["zone"],
    _count: { _all: true },
    _avg: { price: true },
    where: { status: "for_sale" },
  })
  return grouped
    .map((g) => ({
      zone: g.zone,
      count: g._count._all,
      avgPrice: Math.round(g._avg.price ?? 0),
    }))
    .sort((a, b) => b.avgPrice - a.avgPrice)
}

export async function getActivePropertyCount() {
  return prisma.property.count({ where: { status: "for_sale" } })
}

export const ZONES = ["Coral Gables", "South Miami", "Kendall"] as const
