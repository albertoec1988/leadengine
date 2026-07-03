import "server-only"
import Anthropic from "@anthropic-ai/sdk"
import { estimateValue, type ValuationInput, type ValuationResult } from "@/lib/valuation"

export type SmartValuation = ValuationResult & {
  rationale: string | null
  source: "ai" | "comparables"
}

const CONDITION_ES: Record<string, string> = {
  excellent: "excelente",
  good: "bueno",
  fair: "aceptable",
  needs_work: "a reformar",
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    estimate: { type: "integer", description: "Valor estimado en USD (entero)" },
    low: { type: "integer", description: "Extremo inferior del rango en USD" },
    high: { type: "integer", description: "Extremo superior del rango en USD" },
    pricePerSqft: { type: "integer", description: "Precio por sqft usado, en USD" },
    rationale: { type: "string", description: "Justificación breve (1-2 frases, en español)" },
  },
  required: ["estimate", "low", "high", "pricePerSqft", "rationale"],
} as const

/**
 * Valuación "inteligente": si hay ANTHROPIC_API_KEY, una IA (Claude) razona sobre
 * los datos y refina la estimación del modelo de comparables. Si no, cae al modelo.
 * Cualquier error de la IA hace fallback silencioso al modelo — la demo nunca se rompe.
 */
export async function estimateValueSmart(input: ValuationInput): Promise<SmartValuation> {
  const baseline = estimateValue(input)

  if (!process.env.ANTHROPIC_API_KEY) {
    return { ...baseline, rationale: null, source: "comparables" }
  }

  try {
    const client = new Anthropic()
    const response = await client.messages.parse({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: { format: { type: "json_schema", schema: SCHEMA } },
      system:
        "Eres un tasador inmobiliario experto en Coral Gables, South Miami y Kendall (Florida). " +
        "Refinas una estimación base de comparables con tu criterio de mercado. " +
        "Devuelve importes en USD y una justificación breve en español. Mantén el resultado cercano a la base salvo que haya una razón clara.",
      messages: [
        {
          role: "user",
          content:
            `Vivienda: zona ${input.zone}, ${input.areaSqft} sqft, ${input.bedrooms} habitaciones, ` +
            `${input.bathrooms} baños, estado ${CONDITION_ES[input.condition] ?? input.condition}` +
            (input.yearBuilt ? `, construida en ${input.yearBuilt}` : "") +
            `.\nEstimación base del modelo de comparables: $${baseline.estimate.toLocaleString("en-US")} ` +
            `(rango $${baseline.low.toLocaleString("en-US")}–$${baseline.high.toLocaleString("en-US")}, ` +
            `$${baseline.pricePerSqft}/sqft).\n` +
            "Devuelve tu estimación refinada con estimate, low, high, pricePerSqft y una justificación breve.",
        },
      ],
    })

    const out = response.parsed_output as {
      estimate: number
      low: number
      high: number
      pricePerSqft: number
      rationale: string
    } | null
    if (!out || !Number.isFinite(out.estimate) || out.estimate <= 0) {
      return { ...baseline, rationale: null, source: "comparables" }
    }
    // saneamiento: el rango debe encerrar la estimación
    const estimate = Math.round(out.estimate)
    const low = Math.min(Math.round(out.low), estimate)
    const high = Math.max(Math.round(out.high), estimate)
    return {
      estimate,
      low,
      high,
      pricePerSqft: Math.round(out.pricePerSqft) || baseline.pricePerSqft,
      rationale: out.rationale?.trim() || null,
      source: "ai",
    }
  } catch {
    // clave inválida, sin red, límite de tasa, etc. → fallback al modelo
    return { ...baseline, rationale: null, source: "comparables" }
  }
}
