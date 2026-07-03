import { prisma } from '@/lib/db'
import { scoreLead, type LeadChannel } from '@/lib/scoring'
import { estimateValue, type PropertyCondition } from '@/lib/valuation'
import bcrypt from 'bcryptjs'

const ZONES = ['Coral Gables', 'South Miami', 'Kendall'] as const
// coordenadas aproximadas por zona para el mapa
const ZONE_COORDS: Record<string, [number, number]> = {
  'Coral Gables': [25.721, -80.268],
  'South Miami': [25.7079, -80.2939],
  Kendall: [25.6793, -80.3173],
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

  // propiedades
  const properties = []
  for (let i = 0; i < 15; i++) {
    const zone = pick(ZONES)
    const [lat, lng] = ZONE_COORDS[zone]
    const beds = 2 + Math.floor(rand() * 4)
    const area = 1200 + Math.floor(rand() * 2800)
    const p = await prisma.property.create({
      data: {
        title: `${beds}BR ${zone} ${['Villa', 'Home', 'Residence', 'Estate'][i % 4]}`,
        price: 350_000 + Math.floor(rand() * 2_500_000),
        zone,
        address: `${100 + i} ${['Coral Way', 'Sunset Dr', 'Red Rd', 'Bird Rd'][i % 4]}, ${zone}, FL`,
        lat: jitter(lat, 0.02),
        lng: jitter(lng, 0.02),
        status: pick(['for_sale', 'for_sale', 'for_sale', 'pending', 'sold']),
        bedrooms: beds,
        bathrooms: 1 + Math.floor(rand() * 4),
        areaSqft: area,
        photoUrl: `https://picsum.photos/seed/ffr${i}/800/600`,
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
