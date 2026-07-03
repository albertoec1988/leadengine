"use client"

// Recorrido guiado por scroll sobre un mapa de Miami: la cámara viaja entre
// las propiedades favoritas, un camino SVG se traza con el progreso y la
// tarjeta activa muestra la miniatura. Desktop: sección pinned con scrub.
// Móvil/reduced-motion: mapa estático encuadrando todo + fila de tarjetas
// (sin dead-scroll: la altura solo crece cuando hay scrub).

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import "leaflet/dist/leaflet.css"
import { useMotion } from "@/components/motion/MotionProvider"
import { RevealText } from "@/components/motion/RevealText"
import { interpolateStops, polylineLength } from "@/lib/journey"

export type JourneyStop = {
  id: string
  title: string
  lat: number
  lng: number
  photoUrl: string
  priceLabel: string
  href: string
}

const JOURNEY_ZOOM = 12

export function MapJourney({ stops }: { stops: JourneyStop[] }) {
  const rootRef = useRef<HTMLElement>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPolylineElement>(null)
  const mapRef = useRef<import("leaflet").Map | null>(null)
  const markersRef = useRef<import("leaflet").CircleMarker[]>([])
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const { heavyEnabled } = useMotion()

  // Montar Leaflet una vez (no interactivo).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !mapElRef.current || mapRef.current) return
      const map = L.map(mapElRef.current, {
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
        attributionControl: true,
      })
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)

      markersRef.current = stops.map((s, i) =>
        L.circleMarker([s.lat, s.lng], {
          radius: i === 0 ? 11 : 8,
          color: "#ffffff",
          weight: 2,
          fillColor: "#00305b",
          fillOpacity: 0.95,
        }).addTo(map),
      )

      if (stops.length > 1) {
        map.fitBounds(stops.map((s) => [s.lat, s.lng] as [number, number]), { padding: [48, 48] })
      } else {
        map.setView([stops[0].lat, stops[0].lng], JOURNEY_ZOOM)
      }
      mapRef.current = map
      // primer dibujo del camino
      drawPath(1)
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Proyecta las paradas a px del contenedor y actualiza la polilínea.
  // progress 0..1 controla cuánto camino se ve (dashoffset).
  function drawPath(progress: number) {
    const map = mapRef.current
    const path = pathRef.current
    if (!map || !path) return
    const pts = stops.map((s) => map.latLngToContainerPoint([s.lat, s.lng]))
    path.setAttribute("points", pts.map((p) => `${p.x},${p.y}`).join(" "))
    const total = polylineLength(pts)
    path.style.strokeDasharray = `${total}`
    path.style.strokeDashoffset = `${total * (1 - Math.min(1, Math.max(0, progress)))}`
  }

  // Scrub del recorrido (solo desktop con motion pesado).
  useGSAP(
    () => {
      if (!heavyEnabled || !rootRef.current || stops.length < 2) return
      const st = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => {
          const map = mapRef.current
          if (!map) return
          const cam = interpolateStops(stops, self.progress)
          map.setView([cam.lat, cam.lng], JOURNEY_ZOOM, { animate: false })
          drawPath(self.progress)
          if (cam.index !== activeRef.current) {
            activeRef.current = cam.index
            setActive(cam.index)
            markersRef.current.forEach((m, i) =>
              m.setStyle({ radius: i === cam.index ? 11 : 8, fillColor: i === cam.index ? "#0a4a86" : "#00305b" }),
            )
          }
        },
      })
      return () => st.kill()
    },
    { scope: rootRef, dependencies: [heavyEnabled, stops.length] },
  )

  if (stops.length < 2) return null
  const current = stops[Math.min(active, stops.length - 1)]

  return (
    <section ref={rootRef} className={`relative bg-white ${heavyEnabled ? "h-[300vh]" : ""}`}>
      <div className={heavyEnabled ? "sticky top-0 flex h-svh flex-col" : "flex flex-col"}>
        <div className="mx-auto w-full max-w-6xl px-5 pb-6 pt-16 text-center">
          <RevealText
            as="h2"
            className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] text-ffr-navy sm:text-3xl"
          >
            Explore our featured listings
          </RevealText>
          <p className="mt-3 text-sm text-ffr-slate">
            {heavyEnabled ? "Scroll to travel between our most desired properties." : "Our most desired properties across Miami."}
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-6xl flex-1 px-5 pb-8">
          <div className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-line">
            <div ref={mapElRef} className="absolute inset-0 z-0" />
            <svg ref={svgRef} className="pointer-events-none absolute inset-0 z-[500] h-full w-full">
              <polyline
                ref={pathRef}
                fill="none"
                stroke="#00305b"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="0"
              />
            </svg>

            {/* Tarjeta activa (desktop scrub) */}
            {heavyEnabled && (
              <Link
                href={current.href}
                key={current.id}
                className="absolute bottom-5 left-5 z-[600] flex w-72 items-center gap-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur transition-opacity duration-300"
              >
                <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-sand">
                  <Image src={current.photoUrl} alt="" fill sizes="80px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-montserrat text-sm font-bold text-ffr-navy">{current.title}</p>
                  <p className="text-xs text-ffr-slate">{current.priceLabel}</p>
                </div>
              </Link>
            )}
          </div>

          {/* Fila de tarjetas: contenido base siempre visible (y única UI en móvil/reduced) */}
          <div className={`mt-4 flex gap-3 overflow-x-auto pb-2 ${heavyEnabled ? "lg:hidden" : ""}`}>
            {stops.map((s, i) => (
              <Link
                key={s.id}
                href={s.href}
                className={`flex w-60 shrink-0 items-center gap-3 rounded-xl border p-3 ${
                  heavyEnabled && i === active ? "border-ffr-navy" : "border-line"
                }`}
              >
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
      </div>
    </section>
  )
}
