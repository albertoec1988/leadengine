import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaPg } from '@prisma/adapter-pg'

const DB_URL = process.env.DATABASE_URL ?? 'file:./dev.db'
const IS_POSTGRES = /^postgres(ql)?:\/\//.test(DB_URL)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createClient(): PrismaClient {
  // El cliente generado en lib/generated/prisma es específico del proveedor:
  //  - local: SQLite (generado desde prisma/schema.prisma)
  //  - Vercel/Neon: Postgres (generado en build desde el schema derivado)
  // El adaptador se elige aquí por el esquema de la URL, y debe coincidir con el
  // proveedor con el que se generó el cliente en este entorno.
  const adapter = IS_POSTGRES
    ? new PrismaPg(DB_URL)
    : new PrismaBetterSqlite3({ url: DB_URL })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
