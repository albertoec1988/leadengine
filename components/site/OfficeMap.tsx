"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

// Mini-mapa raster de la oficina (Leaflet + OSM tiles; sin WebGL).
export function OfficeMap({ lat, lng, height = 224 }: { lat: number; lng: number; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false
    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !ref.current) return
      map = L.map(ref.current, {
        dragging: false,
        scrollWheelZoom: false,
        touchZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        zoomControl: false,
      }).setView([lat, lng], 15)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)
      L.circleMarker([lat, lng], {
        radius: 10,
        color: "#ffffff",
        weight: 2,
        fillColor: "#00305b",
        fillOpacity: 1,
      }).addTo(map)
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [lat, lng])

  return <div ref={ref} style={{ height }} className="w-full" aria-label="Office location map" />
}
