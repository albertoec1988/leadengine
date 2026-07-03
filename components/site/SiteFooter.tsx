import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-navy text-paper">
      <div className="mx-auto w-full max-w-6xl px-5 py-14">
        <p className="font-display text-2xl leading-snug sm:text-3xl" style={{ overflowWrap: "anywhere", minWidth: 0 }}>
          Vendemos casas en Coral Gables como si fueran nuestras.
        </p>
        <div className="mt-10 grid gap-8 border-t border-white/15 pt-8 sm:grid-cols-3">
          <div>
            <p className="text-sm font-medium">Floridian First Realty</p>
            <p className="mt-2 text-sm text-paper/70">
              2000 Ponce de Leon Blvd
              <br />
              Coral Gables, FL 33134
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Contacto</p>
            <p className="mt-2 text-sm text-paper/70">
              <a href="tel:+13055550100" className="hover:text-paper">
                (305) 555-0100
              </a>
              <br />
              <a href="mailto:hola@floridianfirst.com" className="hover:text-paper">
                hola@floridianfirst.com
              </a>
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Explora</p>
            <ul className="mt-2 space-y-1 text-sm text-paper/70">
              <li>
                <Link href="/propiedades" className="hover:text-paper">
                  Propiedades
                </Link>
              </li>
              <li>
                <Link href="/valuacion" className="hover:text-paper">
                  Valorar mi casa
                </Link>
              </li>
              <li>
                <Link href="/mapa" className="hover:text-paper">
                  Mapa
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 text-xs text-paper/50">
          © {2026} Floridian First Realty · Coral Gables · South Miami · Kendall
        </p>
      </div>
    </footer>
  )
}
