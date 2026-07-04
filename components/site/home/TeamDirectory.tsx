import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { RevealGroup } from "@/components/motion/RevealGroup"
import { AnimatedCta } from "@/components/motion/AnimatedCta"
import { InertiaMarquee } from "@/components/motion/InertiaMarquee"

// Roster REAL del scrape (/about-1). Las fotos del equipo no tienen mapeo
// nombre↔foto confirmado por el cliente, así que se muestran por separado.
const TEAM = [
  { name: "Michelle Gonzalez", role: "Broker / Owner" },
  { name: "Kevin Gonzalez", role: "Broker / Owner" },
  { name: "Christina Muniz", role: "Marketing Manager" },
  { name: "Lisa Beining", role: "" },
  { name: "Argenid Blanco", role: "" },
  { name: "Barbara Yanes", role: "" },
  { name: "Greg Eversole", role: "" },
  { name: "Karen Ramirez", role: "" },
  { name: "Lais Same", role: "" },
  { name: "Lillian Mas", role: "" },
  { name: "Muriel Zerdoun", role: "" },
  { name: "Oriana Espinoza", role: "" },
  { name: "Otoniel Bandres", role: "" },
  { name: "Pedro Romero", role: "" },
  { name: "Sandra Denis", role: "" },
  { name: "Sophia Codinach", role: "" },
]

const HEADSHOTS = [
  "equipo-01", "equipo-02", "equipo-03", "equipo-04", "equipo-05", "equipo-06",
  "equipo-07", "equipo-08", "equipo-09-karen", "equipo-10", "equipo-11",
  "equipo-12", "equipo-13", "equipo-14", "equipo-15", "equipo-16", "equipo-17",
]

export function TeamDirectory() {
  return (
    <section className="bg-paper-2 py-20 sm:py-28">
      <div className="mx-auto w-full max-w-6xl px-5 text-center">
        <p className="font-montserrat text-xs font-semibold uppercase tracking-[0.3em] text-ffr-slate">
          Exceptional Living, Expertly Crafted
        </p>
        <RevealText
          as="h2"
          className="mt-3 font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
        >
          Meet the Team
        </RevealText>
        <p className="mx-auto mt-4 max-w-2xl text-ffr-slate">
          16 specialists in residential and commercial real estate — guidance,
          transparency, and hands-on negotiation at every step.
        </p>
      </div>

      <InertiaMarquee className="mt-12" speed={35}>
        {HEADSHOTS.map((f) => (
          <div key={f} className="mx-4 h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md">
            <Image
              src={`/ffr/team/${f}.jpg`}
              alt=""
              width={112}
              height={112}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </InertiaMarquee>

      <div className="mx-auto mt-12 w-full max-w-5xl px-5">
        <RevealGroup className="grid grid-cols-2 gap-x-8 gap-y-4 text-left sm:grid-cols-3 lg:grid-cols-4" y={20} stagger={0.05}>
          {TEAM.map((m) => (
            <div key={m.name}>
              <p className="font-montserrat text-sm font-semibold text-ffr-navy">{m.name}</p>
              {m.role && <p className="text-xs text-ffr-slate">{m.role}</p>}
            </div>
          ))}
        </RevealGroup>
        <div className="mt-10 text-center">
          <AnimatedCta href="/contacto" variant="solid">
            Schedule a consult
          </AnimatedCta>
        </div>
      </div>
    </section>
  )
}
