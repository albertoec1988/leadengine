import Image from "next/image"
import Link from "next/link"
import { RevealGroup } from "@/components/motion/RevealGroup"

const CATEGORIES = [
  { label: "Residential", image: "/ffr/02_categoria-residential.jpg" },
  { label: "Commercial", image: "/ffr/03_categoria-commercial.jpg" },
  { label: "Luxury", image: "/ffr/04_categoria-luxury.jpg" },
]

export function ServiceCategories() {
  return (
    <section className="bg-paper-2">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <RevealGroup className="grid gap-6 md:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              href="/propiedades"
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Image
                src={cat.image}
                alt={`${cat.label} real estate`}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ffr-navy/80 via-ffr-navy/20 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-7">
                <h3 className="font-montserrat text-xl font-extrabold uppercase tracking-[0.2em] text-white">
                  {cat.label}
                </h3>
                <p className="mt-2 translate-y-2 text-sm text-white/0 transition-all duration-300 group-hover:translate-y-0 group-hover:text-white/90">
                  Click here to see more!
                </p>
              </div>
            </Link>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
