import Link from "next/link"
import Image from "next/image"
import { getSettings } from "@/lib/settings"
import { SocialLinks, socialFromSettings } from "@/components/site/SocialLinks"

// Oficina principal: 710 S. Dixie Hwy #100, Coral Gables, FL 33146 (aprox.)
const OFFICE = { lat: 25.7145, lng: -80.2731 }
const OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${OFFICE.lng - 0.012}%2C${OFFICE.lat - 0.007}%2C${OFFICE.lng + 0.012}%2C${OFFICE.lat + 0.007}&layer=mapnik&marker=${OFFICE.lat}%2C${OFFICE.lng}`
const DIRECTIONS = "https://maps.google.com/?q=710+S+Dixie+Hwy+%23100,+Coral+Gables,+FL+33146"

export async function SiteFooter() {
  const settings = await getSettings()
  const social = socialFromSettings(settings)

  return (
    <footer className="bg-ffr-navy text-white/80">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
          <p className="text-sm">
            Floridian First Realty | 305.667.5235 | 710 S. Dixie Hwy #100, Coral Gables, FL 33146
          </p>
          <SocialLinks links={social} />
          <div className="flex items-center gap-5 text-sm">
            <a
              href={DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Get directions →
            </a>
            <Link href="/contacto" className="underline-offset-4 hover:underline">
              Contact
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/15">
          <iframe
            src={OSM_EMBED}
            title="Floridian First Realty office — 710 S. Dixie Hwy #100, Coral Gables"
            className="h-56 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </footer>
  )
}
