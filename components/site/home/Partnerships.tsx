import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"

const ASSOCIATIONS = [
  { file: "23_assoc-womens-council-realtors.png", name: "Women's Council of Realtors" },
  { file: "24_assoc-equal-housing-opportunity.png", name: "Equal Housing Opportunity" },
  { file: "25_assoc-national-association-realtors.png", name: "National Association of Realtors" },
  { file: "26_assoc-fiu-business.png", name: "FIU Business" },
  { file: "27_assoc-coral-gables-chamber.png", name: "Coral Gables Chamber of Commerce" },
  { file: "28_assoc-florida-ccim-chapter.png", name: "Florida CCIM Chapter" },
]

export function Partnerships() {
  return (
    <section className="bg-paper-2 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Partnerships &amp; Associations
        </RevealText>
        <div className="mt-12 grid grid-cols-2 items-center gap-10 sm:grid-cols-3 lg:grid-cols-6">
          {ASSOCIATIONS.map((a) => (
            <div key={a.file} className="flex items-center justify-center">
              <Image
                src={`/ffr/${a.file}`}
                alt={`${a.name} logo`}
                width={120}
                height={80}
                className="max-h-20 w-auto object-contain opacity-80 transition-opacity duration-300 hover:opacity-100"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
