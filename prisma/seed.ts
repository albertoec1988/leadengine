import { prisma } from '@/lib/db'
import { scoreLead, type LeadChannel } from '@/lib/scoring'
import { estimateValue, type PropertyCondition } from '@/lib/valuation'
import bcrypt from 'bcryptjs'

const ZONES = ['Coral Gables', 'South Miami', 'Kendall', 'Miami', 'Fort Lauderdale'] as const
// coordenadas aproximadas por zona para el mapa
const ZONE_COORDS: Record<string, [number, number]> = {
  'Coral Gables': [25.721, -80.268],
  'South Miami': [25.7079, -80.2939],
  Kendall: [25.6793, -80.3173],
  Miami: [25.7743, -80.2094],
  'Fort Lauderdale': [26.1224, -80.1373],
}
const CHANNELS: LeadChannel[] = ['web', 'whatsapp', 'instagram', 'valuation']
const STATUSES = ['new', 'contacted', 'qualified', 'visit', 'offer', 'won', 'lost']
const STAGES = ['new', 'contacted', 'visit', 'offer', 'closed']
const CONDITIONS: PropertyCondition[] = ['excellent', 'good', 'fair', 'needs_work']

// PRNG determinista para que el seed sea reproducible (sin Math.random)
let seedState = 42
function rand() {
  seedState = (seedState * 1103515245 + 12345) & 0x7fffffff
  return seedState / 0x7fffffff
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}
function jitter(base: number, spread: number) {
  return base + (rand() - 0.5) * spread
}

// Propiedades REALES del sitio del cliente (scrape 2026-07-03, /ffr-listings).
// Direcciones auténticas; coordenadas aproximadas (nivel manzana);
// PRECIOS ILUSTRATIVOS (no publicados en la web del cliente).
const REAL_LISTINGS = [
  { title: "1210 SW 91st Ave #1210", address: "1210 SW 91st Ave #1210, Miami, FL 33174", zone: "Miami", lat: 25.7601, lng: -80.3428, price: 465_000, beds: 3, baths: 2, sqft: 1480, photo: "/ffr/listings/listado-01.jpg" },
  { title: "Restaurant for Sale — E Las Olas Blvd", address: "E Las Olas Blvd, Fort Lauderdale, FL 33316", zone: "Fort Lauderdale", lat: 26.1195, lng: -80.1373, price: 495_000, beds: 0, baths: 2, sqft: 2600, photo: "/ffr/listings/listado-02.jpg" },
  { title: "Restaurant for Sale — Kendall", address: "Kendall, Miami, FL 33193", zone: "Kendall", lat: 25.6432, lng: -80.4370, price: 285_000, beds: 0, baths: 2, sqft: 1900, photo: "/ffr/listings/listado-03.jpg" },
  { title: "Restaurant for Sale — Miami", address: "Miami, FL 33135", zone: "Miami", lat: 25.7659, lng: -80.2352, price: 320_000, beds: 0, baths: 2, sqft: 2100, photo: "/ffr/listings/listado-04.jpg" },
  { title: "3101 Bayshore Dr #1505", address: "3101 Bayshore Dr #1505, Fort Lauderdale, FL 33304", zone: "Fort Lauderdale", lat: 26.1369, lng: -80.1042, price: 720_000, beds: 2, baths: 2, sqft: 1350, photo: "/ffr/listings/listado-05.jpg" },
  { title: "12415 SW 93rd Ct", address: "12415 SW 93rd Ct, Miami, FL 33176", zone: "Kendall", lat: 25.6528, lng: -80.3441, price: 685_000, beds: 4, baths: 3, sqft: 2240, photo: "/ffr/listings/listado-06.jpg" },
  { title: "1155 SW 6th St — 2nd Floor", address: "1155 SW 6th St #2nd Floor, Miami, FL 33130", zone: "Miami", lat: 25.7682, lng: -80.2148, price: 398_000, beds: 2, baths: 1, sqft: 1100, photo: "/ffr/listings/listado-07.jpg" },
  { title: "6161 SW 8th St #6161", address: "6161 SW 8th St #6161, Miami, FL 33144", zone: "Miami", lat: 25.7628, lng: -80.2946, price: 350_000, beds: 0, baths: 1, sqft: 1500, photo: "/ffr/listings/listado-08.jpg" },
  { title: "2800 SW 38th Ct", address: "2800 SW 38th Ct, Miami, FL 33134", zone: "Coral Gables", lat: 25.7491, lng: -80.2531, price: 890_000, beds: 4, baths: 3, sqft: 2450, photo: "/ffr/listings/listado-09.jpg" },
] as const

async function main() {
  // limpiar (respetando dependencias)
  await prisma.notification.deleteMany()
  await prisma.valuation.deleteMany()
  await prisma.opportunity.deleteMany()
  await prisma.leadActivity.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.property.deleteMany()
  await prisma.user.deleteMany()

  const pass = await bcrypt.hash('demo1234', 10)
  const admin = await prisma.user.create({
    data: { email: 'admin@floridianfirst.com', name: 'Admin Demo', role: 'admin', password: pass },
  })
  const agents = await Promise.all(
    ['Marta Ruiz', 'Carlos Vega', 'Lucía Prado'].map((name, i) =>
      prisma.user.create({
        data: { email: `agente${i + 1}@floridianfirst.com`, name, role: 'agent', password: pass },
      })
    )
  )
  const allUsers = [admin, ...agents]

  // propiedades (reales del cliente; todas favoritas para el recorrido del mapa)
  const properties = []
  for (let i = 0; i < REAL_LISTINGS.length; i++) {
    const r = REAL_LISTINGS[i]
    const p = await prisma.property.create({
      data: {
        title: r.title,
        price: r.price,
        zone: r.zone,
        address: r.address,
        lat: r.lat,
        lng: r.lng,
        status: "for_sale",
        bedrooms: r.beds,
        bathrooms: r.baths,
        areaSqft: r.sqft,
        photoUrl: r.photo,
        isFeatured: true,
        featuredOrder: i,
        images: {
          create: [{ url: r.photo, pathname: r.photo, order: 0, isPrimary: true }],
        },
      },
    })
    properties.push(p)
  }

  // leads
  const now = Date.now()
  for (let i = 0; i < 50; i++) {
    const channel = pick(CHANNELS)
    const status = pick(STATUSES)
    const prop = rand() > 0.4 ? pick(properties) : null
    const zone = prop ? prop.zone : pick(ZONES)
    const hasEmail = rand() > 0.3
    const hasPhone = rand() > 0.4
    const hasMessage = rand() > 0.5
    const message = hasMessage ? 'Estoy interesado, ¿me pueden contactar?' : null
    const score = scoreLead({
      channel,
      hasEmail,
      hasPhone,
      hasPropertyInterest: !!prop,
      hasZoneInterest: true,
      message,
    })
    const createdAt = new Date(now - Math.floor(rand() * 20 * 86_400_000))
    const lead = await prisma.lead.create({
      data: {
        name: `Lead ${i + 1}`,
        email: hasEmail ? `lead${i + 1}@example.com` : null,
        phone: hasPhone ? `+1305555${String(1000 + i).padStart(4, '0')}` : null,
        channel,
        status,
        score,
        zone,
        message,
        propertyId: prop?.id ?? null,
        agentId: pick(allUsers).id,
        createdAt,
        lastActivityAt: status === 'new' ? null : new Date(createdAt.getTime() + 3600_000),
      },
    })

    // oportunidad para leads avanzados con propiedad
    if (prop && ['qualified', 'visit', 'offer', 'won'].includes(status)) {
      await prisma.opportunity.create({
        data: {
          leadId: lead.id,
          propertyId: prop.id,
          stage: pick(STAGES),
          value: Math.round(prop.price * 0.98),
          probability: 20 + Math.floor(rand() * 70),
        },
      })
    }
  }

  // valuaciones (estimadas con el motor real para que sean coherentes)
  for (let i = 0; i < 8; i++) {
    const zone = pick(ZONES)
    const areaSqft = 1500 + Math.floor(rand() * 2000)
    const bedrooms = 2 + Math.floor(rand() * 3)
    const bathrooms = 1 + Math.floor(rand() * 3)
    const condition = pick(CONDITIONS)
    const v = estimateValue({ zone, areaSqft, bedrooms, bathrooms, condition })
    await prisma.valuation.create({
      data: {
        zone,
        areaSqft,
        bedrooms,
        bathrooms,
        condition,
        estimate: v.estimate,
        low: v.low,
        high: v.high,
      },
    })
  }

  // notificaciones de ejemplo
  await prisma.notification.create({
    data: { type: 'hot_lead_unattended', refId: 'demo', message: 'Lead caliente sin atender hace 3h', severity: 'high' },
  })
  await prisma.notification.create({
    data: { type: 'stalled_opportunity', refId: 'demo', message: 'Oportunidad estancada 9 días en "visit"', severity: 'medium' },
  })

  console.log('Seed completado: usuarios, propiedades, leads, oportunidades, valuaciones, notificaciones.')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
