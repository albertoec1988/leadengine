"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

export type MapPoint = {
  id: string
  title: string
  lat: number
  lng: number
  price: string
  status: string
  zone: string
  href: string
}

const STATUS_COLOR: Record<string, string> = {
  for_sale: "#1f3a5f",
  pending: "#b8860b",
  sold: "#8a8a8a",
}

export function PropertyMap({ points, height = "70vh" }: { points: MapPoint[]; height?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let map: import("leaflet").Map | undefined
    let cancelled = false

    ;(async () => {
      const L = await import("leaflet")
      if (cancelled || !ref.current) return

      const center: [number, number] = points.length
        ? [points[0].lat, points[0].lng]
        : [25.72, -80.28]

      map = L.map(ref.current, { scrollWheelZoom: false }).setView(center, 12)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)

      const bounds: [number, number][] = []
      for (const p of points) {
        bounds.push([p.lat, p.lng])
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: 9,
          color: "#ffffff",
          weight: 2,
          fillColor: STATUS_COLOR[p.status] ?? "#1f3a5f",
          fillOpacity: 0.95,
        }).addTo(map)
        marker.bindPopup(
          `<div style="font-family:system-ui;min-width:160px">
             <strong>${p.price}</strong><br/>
             <span style="color:#555">${p.title}</span><br/>
             <span style="color:#888;font-size:12px">${p.zone}</span><br/>
             <a href="${p.href}" style="color:#b8860b;font-size:13px">Ver propiedad →</a>
           </div>`
        )
      }
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] })
    })()

    return () => {
      cancelled = true
      map?.remove()
    }
  }, [points])

  return <div ref={ref} style={{ height }} className="w-full overflow-hidden rounded-2xl border border-line" />
}
