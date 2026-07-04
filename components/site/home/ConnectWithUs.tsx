"use client"

import { useState } from "react"
import { submitContactLead } from "@/lib/actions"
import { SocialLinks, type SocialLink } from "@/components/site/SocialLinks"
import { RevealGroup } from "@/components/motion/RevealGroup"

const fieldClass =
  "w-full rounded-lg border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 outline-none transition-colors focus:border-white/60"

export function ConnectWithUs({ social = [] }: { social?: SocialLink[] }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    // Honeypot: humanos no ven ni rellenan "company"; si viene, descartamos en silencio.
    if (String(data.get("company") ?? "") !== "") {
      setStatus("sent")
      form.reset()
      return
    }
    setStatus("sending")
    setError("")
    const res = await submitContactLead({
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? "") || undefined,
      phone: String(data.get("phone") ?? "") || undefined,
      message: String(data.get("message") ?? "") || undefined,
      source: "web",
    })
    if (res.ok) {
      setStatus("sent")
      form.reset()
    } else {
      setStatus("error")
      setError(res.error)
    }
  }

  return (
    <section id="connect" className="bg-ffr-navy">
      <RevealGroup className="mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:py-28 lg:grid-cols-2">
        <div className="text-white">
          <h2 className="font-montserrat text-2xl font-extrabold uppercase tracking-[0.18em] sm:text-3xl">
            Connect With Us
          </h2>
          <dl className="mt-8 space-y-5 text-white/85">
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Address
              </dt>
              <dd className="mt-1">710 South Dixie Highway, Suite 100, Coral Gables, Florida 33146</dd>
            </div>
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Phone
              </dt>
              <dd className="mt-1">
                <a href="tel:3056675235" className="hover:underline">305.667.5235</a>
              </dd>
            </div>
            <div>
              <dt className="font-montserrat text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Email
              </dt>
              <dd className="mt-1">
                <a href="mailto:MGonzalez@FLFirstRealty.com" className="block hover:underline">
                  MGonzalez@FLFirstRealty.com
                </a>
                <a href="mailto:KGonzalez@FLFirstRealty.com" className="block hover:underline">
                  KGonzalez@FLFirstRealty.com
                </a>
              </dd>
            </div>
          </dl>
          <SocialLinks links={social} className="mt-8" />
        </div>

        <form onSubmit={onSubmit} className="grid gap-4" noValidate>
          <label className="sr-only" htmlFor="cw-name">Name</label>
          <input id="cw-name" name="name" required placeholder="Name *" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-email">Email</label>
          <input id="cw-email" name="email" type="email" placeholder="Email" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-phone">Phone</label>
          <input id="cw-phone" name="phone" type="tel" placeholder="Phone" className={fieldClass} />
          <label className="sr-only" htmlFor="cw-message">Message</label>
          <textarea id="cw-message" name="message" rows={4} placeholder="How can we help?" className={fieldClass} />
          {/* Honeypot anti-spam (oculto para humanos) */}
          <input
            type="text"
            name="company"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />
          {status === "error" && (
            <p role="alert" className="rounded-lg bg-white/15 px-3 py-2 text-sm text-white">
              {error}
            </p>
          )}
          {status === "sent" ? (
            <p className="rounded-lg bg-white/15 px-4 py-3 text-sm font-medium text-white">
              Thank you — we&apos;ll be in touch shortly.
            </p>
          ) : (
            <button
              type="submit"
              disabled={status === "sending"}
              className="group inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/80 px-7 py-3.5 font-montserrat text-sm font-semibold uppercase tracking-wider text-white transition-colors duration-200 hover:bg-white hover:text-ffr-navy disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Submit"}
            </button>
          )}
        </form>
      </RevealGroup>
    </section>
  )
}
