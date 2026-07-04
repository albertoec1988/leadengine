import type { Metadata } from "next"
import { HeroCinematic } from "@/components/site/home/HeroCinematic"
import { BrandStatement } from "@/components/site/home/BrandStatement"
import { ServiceCategories } from "@/components/site/home/ServiceCategories"
import { HeartOfFFR } from "@/components/site/home/HeartOfFFR"
import { TeamDirectory } from "@/components/site/home/TeamDirectory"
import { Testimonials } from "@/components/site/home/Testimonials"
import { ValuationMagnet } from "@/components/site/home/ValuationMagnet"
import { HappyClients } from "@/components/site/home/HappyClients"
import { Partnerships } from "@/components/site/home/Partnerships"
import { ConnectWithUs } from "@/components/site/home/ConnectWithUs"
import { prisma } from "@/lib/db"
import { formatUSD } from "@/lib/format"
import { MapShowcase, type ShowcaseStop } from "@/components/site/home/MapShowcase"
import { getSettings } from "@/lib/settings"
import { socialFromSettings } from "@/components/site/SocialLinks"

// Metadatos SEO reales del sitio del cliente (literales del scrape).
export const metadata: Metadata = {
  title: "Miami Real Estate Agents | Floridian First Realty | Coral Gables",
  description:
    "Floridian First Realty puts it's clients first by providing specialized agents in residential, commercial, and luxury real estate. Buy, Sell, and Invest in Florida's Real Estate Market with Floridian First Realty.",
}

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const [featured, settings] = await Promise.all([
    prisma.property.findMany({
      where: { isFeatured: true, status: "for_sale" },
      orderBy: { featuredOrder: "asc" },
      take: 10,
    }),
    getSettings(),
  ])
  const stops: ShowcaseStop[] = featured.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    photoUrl: p.photoUrl,
    priceLabel: formatUSD(p.price),
    href: `/propiedades/${p.id}`,
  }))
  return (
    <>
      <HeroCinematic />
      <BrandStatement />
      <ServiceCategories />
      {stops.length > 0 && <MapShowcase stops={stops} />}
      <HeartOfFFR />
      <TeamDirectory />
      <Testimonials />
      <ValuationMagnet />
      <HappyClients />
      <Partnerships />
      <ConnectWithUs social={socialFromSettings(settings)} />
    </>
  )
}
