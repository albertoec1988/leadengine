import Image from "next/image"
import { RevealText } from "@/components/motion/RevealText"
import { InertiaMarquee } from "@/components/motion/InertiaMarquee"

const CLIENT_LOGOS = [
  { file: "11_cliente-jealous-fork.png", name: "Jealous Fork" },
  { file: "12_cliente-mistero1.png", name: "MisterO1" },
  { file: "13_cliente-la-boulangerie-boulmich.png", name: "La Boulangerie Boul'Mich" },
  { file: "14_cliente-nothing-bundt-cakes.png", name: "Nothing Bundt Cakes" },
  { file: "15_cliente-sana-skin.png", name: "Sana Skin" },
  { file: "16_cliente-pincrest-bakery.png", name: "Pincrest Bakery" },
  { file: "17_cliente-blaze-pizza.jpg", name: "Blaze Pizza" },
  { file: "19_cliente-poke-house.png", name: "Poke House" },
  { file: "20_cliente-oh-my-gosh-brigadeiros.png", name: "Oh My Gosh Brigadeiros" },
  { file: "22_cliente-chicken-kitchen.png", name: "Chicken Kitchen" },
]

export function HappyClients() {
  return (
    <section className="bg-ffr-navy py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 text-center">
        <RevealText
          as="h2"
          className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-white sm:text-3xl"
        >
          Some of our happy clients
        </RevealText>
      </div>
      <InertiaMarquee className="mt-12" speed={45}>
        {CLIENT_LOGOS.map((logo) => (
          <div
            key={logo.file}
            className="mx-8 flex h-24 w-44 shrink-0 items-center justify-center"
          >
            <Image
              src={`/ffr/${logo.file}`}
              alt={`${logo.name} logo`}
              width={160}
              height={96}
              className="max-h-20 w-auto object-contain"
            />
          </div>
        ))}
      </InertiaMarquee>
    </section>
  )
}
