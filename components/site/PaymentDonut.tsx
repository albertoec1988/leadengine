// Donut de desglose del pago (SVG puro, sin librerías).
// Reglas dataviz aplicadas: paleta categórica validada (la pasa el consumidor),
// gaps de 2px entre segmentos, número héroe centrado en tokens de texto,
// leyenda con importes = vista-tabla (identidad nunca solo por color).

export type DonutSegment = {
  key: string
  label: string
  value: number
  color: string
}

const R = 15.915 // radio tal que la circunferencia = 100 (porcentajes directos)
const GAP = 1.2  // ≈2px de separación entre segmentos en viewBox 42

export function PaymentDonut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: DonutSegment[]
  centerLabel: string
  centerValue: string
}) {
  const visible = segments.filter((s) => s.value > 0)
  const total = visible.reduce((s, x) => s + x.value, 0)

  let offset = 25 // empezar arriba (12 en punto)
  const arcs = visible.map((s) => {
    const pct = total === 0 ? 0 : (s.value / total) * 100
    const dash = Math.max(0, pct - GAP)
    const arc = { ...s, pct, dash, offset }
    offset -= pct
    return arc
  })

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-44 w-44 shrink-0" role="img" aria-label={`${centerLabel}: ${centerValue}. ${visible.map((s) => `${s.label} ${formatUSDShort(s.value)}`).join(", ")}`}>
        <svg viewBox="0 0 42 42" className="h-full w-full -rotate-0">
          <circle cx="21" cy="21" r={R} fill="none" stroke="var(--paper-2)" strokeWidth="5" />
          {total > 0 &&
            arcs.map((a) => (
              <circle
                key={a.key}
                cx="21"
                cy="21"
                r={R}
                fill="none"
                stroke={a.color}
                strokeWidth="5"
                strokeLinecap="butt"
                strokeDasharray={`${a.dash} ${100 - a.dash}`}
                strokeDashoffset={a.offset}
                className="transition-[stroke-width] duration-150 hover:[stroke-width:6]"
              >
                <title>{`${a.label}: ${formatUSDShort(a.value)}/mo (${a.pct.toFixed(1)}%)`}</title>
              </circle>
            ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs uppercase tracking-wide text-ffr-slate">{centerLabel}</span>
          <span className="font-montserrat text-2xl font-extrabold text-ffr-navy">{centerValue}</span>
        </div>
      </div>

      {/* Leyenda con importes: identidad por swatch+texto, valores en tokens de texto */}
      <ul className="w-full space-y-2">
        {visible.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 text-ffr-slate">
              <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="font-medium text-ffr-navy">{formatUSDShort(s.value)}/mo</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatUSDShort(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)
}
