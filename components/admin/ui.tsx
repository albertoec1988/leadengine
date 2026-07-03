import { leadStatusLabel, channelLabel } from "@/lib/format"

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-paper px-5 py-6 sm:px-8">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string | number
  hint?: string
  tone?: "default" | "hot" | "gold" | "navy"
}) {
  const toneClass =
    tone === "hot"
      ? "border-danger/30 bg-danger/5"
      : tone === "gold"
        ? "border-gold-deep/30 bg-gold/10"
        : tone === "navy"
          ? "border-navy/20 bg-navy text-paper"
          : "border-line bg-paper"
  const labelClass = tone === "navy" ? "text-paper/70" : "text-muted"
  const hintClass = tone === "navy" ? "text-paper/60" : "text-muted"
  return (
    <div className={`rounded-xl border p-5 ${toneClass}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${labelClass}`}>{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && <p className={`mt-1 text-xs ${hintClass}`}>{hint}</p>}
    </div>
  )
}

export function ScoreBadge({ score }: { score: number }) {
  const tier =
    score >= 70
      ? "bg-danger/15 text-danger"
      : score >= 45
        ? "bg-gold/25 text-gold-deep"
        : "bg-sand text-muted"
  return (
    <span className={`inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ${tier}`}>
      {score}
    </span>
  )
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-navy text-paper",
  contacted: "bg-gold/25 text-gold-deep",
  qualified: "bg-gold/25 text-gold-deep",
  visit: "bg-gold/25 text-gold-deep",
  offer: "bg-gold text-ink",
  won: "bg-success/20 text-success",
  lost: "bg-sand text-muted",
}

export function LeadStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status] ?? "bg-sand text-ink"}`}>
      {leadStatusLabel(status)}
    </span>
  )
}

export function ChannelChip({ channel }: { channel: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-paper-2 px-2 py-0.5 text-xs text-muted">
      {channelLabel(channel)}
    </span>
  )
}
