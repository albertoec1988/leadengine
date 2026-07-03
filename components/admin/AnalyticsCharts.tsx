"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from "recharts"
import { channelLabel, leadStatusLabel } from "@/lib/format"

const NAVY = "#1f3a5f"
const GOLD = "#b8860b"

const chartCard = "rounded-xl border border-line bg-paper p-5"

export function ChannelChart({ data }: { data: { channel: string; count: number; avgScore: number }[] }) {
  const rows = data.map((d) => ({ name: channelLabel(d.channel), count: d.count, avgScore: d.avgScore }))
  return (
    <div className={chartCard}>
      <h3 className="font-display text-lg text-ink">Leads por canal</h3>
      <p className="mb-4 text-xs text-muted">Volumen de captación por origen</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b6b6b" }} />
          <YAxis tick={{ fontSize: 12, fill: "#6b6b6b" }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "#00000008" }} />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
            {rows.map((_, i) => <Cell key={i} fill={NAVY} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function StatusFunnelChart({ data }: { data: { status: string; count: number }[] }) {
  const order = ["new", "contacted", "qualified", "visit", "offer", "won", "lost"]
  const rows = order
    .map((s) => data.find((d) => d.status === s))
    .filter(Boolean)
    .map((d) => ({ name: leadStatusLabel(d!.status), count: d!.count }))
  return (
    <div className={chartCard}>
      <h3 className="font-display text-lg text-ink">Embudo por estado</h3>
      <p className="mb-4 text-xs text-muted">Distribución de leads en el ciclo</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 12, bottom: 0, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "#6b6b6b" }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#6b6b6b" }} width={80} />
          <Tooltip cursor={{ fill: "#00000008" }} />
          <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} fill={GOLD} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ZoneChart({ data }: { data: { zone: string; count: number }[] }) {
  return (
    <div className={chartCard}>
      <h3 className="font-display text-lg text-ink">Interés por zona</h3>
      <p className="mb-4 text-xs text-muted">Leads según zona de interés</p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data.map((d) => ({ name: d.zone, count: d.count }))} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b6b6b" }} />
          <YAxis tick={{ fontSize: 12, fill: "#6b6b6b" }} allowDecimals={false} />
          <Tooltip cursor={{ fill: "#00000008" }} />
          <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]} fill={NAVY} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
