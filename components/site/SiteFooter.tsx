import Link from "next/link"
import Image from "next/image"

export function SiteFooter() {
  return (
    <footer className="bg-ffr-navy text-white/80">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <Image
            src="/ffr/00_logo-floridian-white.png"
            alt="Floridian First Realty"
            width={130}
            height={35}
            className="h-8 w-auto"
          />
        </div>
        <p className="text-sm">
          Floridian First Realty | 305.667.5235 | 710 S. Dixie Hwy #100, Coral Gables, FL 33146
        </p>
        <Link href="/contacto" className="text-sm underline-offset-4 hover:underline">
          Contact
        </Link>
      </div>
    </footer>
  )
}
