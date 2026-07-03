import type { Metadata } from "next"
import { HeroCinematic } from "@/components/site/home/HeroCinematic"
import { BrandStatement } from "@/components/site/home/BrandStatement"
import { ServiceCategories } from "@/components/site/home/ServiceCategories"
import { HeartOfFFR } from "@/components/site/home/HeartOfFFR"
import { Testimonials } from "@/components/site/home/Testimonials"
import { ValuationMagnet } from "@/components/site/home/ValuationMagnet"
import { HappyClients } from "@/components/site/home/HappyClients"
import { Partnerships } from "@/components/site/home/Partnerships"
import { ConnectWithUs } from "@/components/site/home/ConnectWithUs"

// Metadatos SEO reales del sitio del cliente (literales del scrape).
export const metadata: Metadata = {
  title: "Miami Real Estate Agents | Floridian First Realty | Coral Gables",
  description:
    "Floridian First Realty puts it's clients first by providing specialized agents in residential, commercial, and luxury real estate. Buy, Sell, and Invest in Florida's Real Estate Market with Floridian First Realty.",
}

// La portada ya no consulta la BD: puede prerenderizarse estática.
export default function HomePage() {
  return (
    <>
      <HeroCinematic />
      <BrandStatement />
      <ServiceCategories />
      <HeartOfFFR />
      <Testimonials />
      <ValuationMagnet />
      <HappyClients />
      <Partnerships />
      <ConnectWithUs />
    </>
  )
}
