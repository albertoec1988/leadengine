// Deriva un schema de Prisma para PostgreSQL a partir del schema fuente (SQLite),
// para desplegar en Neon/Vercel sin duplicar los modelos.
// El único cambio es el proveedor del datasource; los modelos son idénticos.
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const src = readFileSync(join(root, "prisma", "schema.prisma"), "utf8")

if (!src.includes('provider = "sqlite"')) {
  console.error("gen-pg: no se encontró 'provider = \"sqlite\"' en prisma/schema.prisma")
  process.exit(1)
}

const derived = src.replace('provider = "sqlite"', 'provider = "postgresql"')
const out = join(root, "prisma", "schema.pg.prisma")
writeFileSync(out, derived)
console.log("gen-pg: schema PostgreSQL derivado -> prisma/schema.pg.prisma")
