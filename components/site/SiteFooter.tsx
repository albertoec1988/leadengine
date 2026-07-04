import Link from "next/link"
import Image from "next/image"
import { getSettings } from "@/lib/settings"
import { SocialLinks, socialFromSettings } from "@/components/site/SocialLinks"
import { OfficeMap } from "@/components/site/OfficeMap"

// Oficina principal: 710 S. Dixie Hwy #100, Coral Gables, FL 33146 (aprox.)
const OFFICE = { lat: 25.7145, lng: -80.2731 }
const DIRECTIONS = "https://maps.google.com/?q=710+S+Dixie+Hwy+%23100,+Coral+Gables,+FL+33146"

const EXPLORE = [
  { href: "/propiedades", label: "Listings" },
  { href: "/valuacion", label: "Home Valuation" },
  { href: "/mortgage-calculator", label: "Mortgage Calculator" },
  { href: "/mapa", label: "Map" },
  { href: "/contacto", label: "Contact" },
]

const headingClass =
  "font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60"

export async function SiteFooter() {
  const settings = await getSettings()
  const social = socialFromSettings(settings)

  return (
    <footer className="bg-ffr-navy text-white/80">
      {/* Tres columnas en una sola fila (stack en móvil) */}
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:grid-cols-3">
        {/* Marca + redes */}
        <div className="flex flex-col items-center gap-5 text-center sm:items-start sm:text-left">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={150}
            height={40}
            className="h-10 w-auto"
          />
          <p className="font-montserrat text-sm font-semibold uppercase tracking-[0.2em] text-white/85">
            Invested in you.
          </p>
          <p className="text-sm text-white/60">
            Residential, commercial and luxury real estate in Coral Gables and
            greater Miami.
          </p>
          <SocialLinks links={social} />
        </div>

        {/* Enlaces */}
        <nav className="text-center sm:text-left" aria-label="Footer">
          <h2 className={headingClass}>Explore</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {EXPLORE.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="underline-offset-4 hover:text-white hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contacto + mini-mapa */}
        <div className="text-center sm:text-left">
          <h2 className={headingClass}>Contact</h2>
          <address className="mt-4 space-y-2 text-sm not-italic">
            <p>710 South Dixie Highway, Suite 100<br />Coral Gables, Florida 33146</p>
            <p>
              <a href="tel:3056675235" className="underline-offset-4 hover:text-white hover:underline">
                305.667.5235
              </a>
            </p>
            <p>
              <a href="mailto:MGonzalez@FLFirstRealty.com" className="underline-offset-4 hover:text-white hover:underline">
                MGonzalez@FLFirstRealty.com
              </a>
            </p>
            <p>
              <a
                href={DIRECTIONS}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/85 underline-offset-4 hover:text-white hover:underline"
              >
                Get directions →
              </a>
            </p>
          </address>
          <div className="mt-4 overflow-hidden rounded-xl border border-white/15">
            <OfficeMap lat={OFFICE.lat} lng={OFFICE.lng} height={140} />
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-5 py-5 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Floridian First Realty · 305.667.5235 · 710 S. Dixie Hwy #100, Coral Gables, FL 33146
        </p>
      </div>
    </footer>
  )
}
