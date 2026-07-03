// lib/journey.ts
// Matemática pura del recorrido del mapa de la portada (testeable sin leaflet/gsap).

export type LatLng = { lat: number; lng: number }

// Posición de cámara para un progreso t (0..1) a lo largo de las paradas,
// con interpolación lineal por segmento. index = parada más cercana.
export function interpolateStops(
  stops: LatLng[],
  t: number,
): { index: number; lat: number; lng: number } {
  if (stops.length === 0) return { index: 0, lat: 0, lng: 0 }
  if (stops.length === 1) return { index: 0, lat: stops[0].lat, lng: stops[0].lng }

  const clamped = Math.min(1, Math.max(0, t))
  const segments = stops.length - 1
  const pos = clamped * segments
  const seg = Math.min(Math.floor(pos), segments - 1)
  const segT = pos - seg

  const a = stops[seg]
  const b = stops[seg + 1]
  return {
    index: Math.round(pos),
    lat: a.lat + (b.lat - a.lat) * segT,
    lng: a.lng + (b.lng - a.lng) * segT,
  }
}

// Longitud total de una polilínea en px de pantalla (para stroke-dashoffset).
export function polylineLength(points: { x: number; y: number }[]): number {
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y)
  }
  return total
}
