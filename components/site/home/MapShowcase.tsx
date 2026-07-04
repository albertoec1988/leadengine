"use client"

// Mapa interactivo de favoritas estilo Google (tiles CARTO Voyager, sin API key):
// pines circulares con la FOTO de cada propiedad, entrada escalonada, y una
// tarjeta flotante al hacer click con el link al detalle.

import { useEffect, useRef, useState, ViewTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import "leaflet/dist/leaflet.css"
import { RevealText } from "@/components/motion/RevealText"

export type ShowcaseStop = {
  id: string
  title: string
  lat: number
  lng: number
  photoUrl: string
  priceLabel: string
  href: string
}

const IS_TOUCH = () => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches

export function MapShowcase({ stops }: { stops: ShowcaseStop[] }) {
  const mapElRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<ShowcaseStop | null>(null)

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !mapElRef.current) return

      const touch = IS_TOUCH()
      const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      map = L.map(mapElRef.current, {
        dragging: !touch,          // en móvil no secuestrar el scroll táctil
        scrollWheelZoom: false,
        touchZoom: true,
        doubleClickZoom: true,
        zoomControl: true,
        attributionControl: true,
      })
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        maxZoom: 20,
        updateWhenIdle: true,
      }).addTo(map)

      stops.forEach((s, i) => {
        // Construcción vía DOM (no interpolación de HTML) para evitar que
        // photoUrl (dato de propiedad) se inyecte como marcado sin sanear.
        const pinEl = document.createElement("div")
        pinEl.className = `ffr-photo-pin${animate ? " pin-animate" : ""}`
        pinEl.style.setProperty("--pin-delay", `${i * 90}ms`)
        pinEl.setAttribute("aria-label", `${s.title} — ${s.priceLabel}`)

        const bubble = document.createElement("div")
        bubble.style.cssText =
          "width:52px;height:52px;border-radius:9999px;border:3px solid #fff;box-shadow:0 6px 16px rgb(0 0 0/.35);overflow:hidden;background:#e6e2d8"

        const img = document.createElement("img")
        // Miniatura optimizada (52px de burbuja no necesita la original a resolución completa)
        img.src = `/_next/image?url=${encodeURIComponent(s.photoUrl)}&w=128&q=75`
        img.alt = ""
        img.loading = "eager" // eager: lazy no dispara dentro de los panes transformados de Leaflet
        img.style.cssText = "width:100%;height:100%;object-fit:cover"

        const tail = document.createElement("div")
        tail.style.cssText =
          "width:0;height:0;margin:-2px auto 0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:10px solid #fff;filter:drop-shadow(0 2px 2px rgb(0 0 0/.25))"

        bubble.appendChild(img)
        pinEl.appendChild(bubble)
        pinEl.appendChild(tail)

        const icon = L.divIcon({
          className: "", // sin estilos por defecto de leaflet
          html: pinEl,
          iconSize: [52, 64],
          iconAnchor: [26, 64],
        })
        const marker = L.marker([s.lat, s.lng], { icon }).addTo(map!)
        marker.on("click", () => setActive(s))
        marker.on("keypress", (e: import("leaflet").LeafletKeyboardEvent) => {
          const k = e.originalEvent.key
          if (k === "Enter" || k === " ") setActive(s)
        })
      })

      map.on("click", () => setActive(null))

      if (stops.length > 1) {
        map.fitBounds(stops.map((s) => [s.lat, s.lng] as [number, number]), { padding: [56, 56] })
      } else if (stops.length === 1) {
        map.setView([stops[0].lat, stops[0].lng], 13)
      }
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
    // stops es estático por render del server; prefers-reduced-motion se lee
    // directamente dentro del efecto (client-only), sin depender de estado de React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (stops.length === 0) return null

  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-5">
        <div className="text-center">
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            Explore our featured listings
          </RevealText>
          <p className="mt-3 text-sm text-ffr-slate">
            Tap a property pin to see the details.
          </p>
        </div>

        <div className="relative mt-10 h-[420px] overflow-hidden rounded-2xl border border-line sm:h-[560px]">
          <div ref={mapElRef} className="absolute inset-0 z-0" />

          {active && (
            <Link
              href={active.href}
              className="absolute bottom-5 left-5 z-[600] flex w-72 items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur"
            >
              <ViewTransition name={`property-photo-${active.id}`}>
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={active.photoUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
              </ViewTransition>
              <div className="min-w-0">
                <p className="truncate font-montserrat text-sm font-bold text-ffr-navy">{active.title}</p>
                <p className="text-xs text-ffr-slate">{active.priceLabel}</p>
                <p className="mt-0.5 text-xs font-semibold text-ffr-navy">View property →</p>
              </div>
            </Link>
          )}
        </div>

        {/* Acceso alternativo en móvil (drag del mapa desactivado en táctil) */}
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 lg:hidden">
          {stops.map((s) => (
            <Link key={s.id} href={s.href} className="flex w-60 shrink-0 items-center gap-3 rounded-xl border border-line p-3">
              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-sand">
                <Image src={s.photoUrl} alt="" fill sizes="64px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-montserrat text-xs font-bold text-ffr-navy">{s.title}</p>
                <p className="text-xs text-ffr-slate">{s.priceLabel}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
