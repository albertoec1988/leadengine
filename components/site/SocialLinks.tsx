import type { ComponentProps } from "react"

export type SocialLink = {
  name: "instagram" | "facebook" | "youtube" | "tiktok" | "linkedin"
  url: string
}

// Deriva los links definidos desde los settings del negocio (solo los configurados).
export function socialFromSettings(settings: Record<string, string>): SocialLink[] {
  const map = [
    ["instagram", settings.instagramUrl],
    ["facebook", settings.facebookUrl],
    ["youtube", settings.youtubeUrl],
    ["tiktok", settings.tiktokUrl],
    ["linkedin", settings.linkedinUrl],
  ] as const
  return map.filter(([, url]) => !!url).map(([name, url]) => ({ name, url: url! }))
}

const LABEL: Record<SocialLink["name"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
}

function Icon({ name, ...props }: { name: SocialLink["name"] } & ComponentProps<"svg">) {
  const paths: Record<SocialLink["name"], string> = {
    instagram:
      "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.9.2 2.3.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1.1.4 2.3.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.9-.4 2.3-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.4-2.3.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.9-.2-2.3-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1.1-.4-2.3-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.9.4-2.3.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.4 2.3-.4 1.2-.1 1.6-.1 4.8-.1zm0 3.7a6.1 6.1 0 100 12.2 6.1 6.1 0 000-12.2zm0 2.2a3.9 3.9 0 110 7.8 3.9 3.9 0 010-7.8zm6.3-2.7a1.4 1.4 0 110 2.9 1.4 1.4 0 010-2.9z",
    facebook:
      "M22 12a10 10 0 10-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0022 12z",
    youtube:
      "M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.2 31.2 0 000 12a31.2 31.2 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.2 31.2 0 0024 12a31.2 31.2 0 00-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z",
    tiktok:
      "M12.9 2h3.1c.2 1.2.8 2.4 1.8 3.2.9.9 2.1 1.4 3.4 1.5v3.2c-1.2 0-2.4-.3-3.5-.8-.5-.2-1-.5-1.5-.9v6.7a6.4 6.4 0 11-6.4-6.4c.3 0 .7 0 1 .1v3.3a3.2 3.2 0 102.1 3V2z",
    linkedin:
      "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z",
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d={paths[name]} />
    </svg>
  )
}

export function SocialLinks({ links, className = "" }: { links: SocialLink[]; className?: string }) {
  if (links.length === 0) return null
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {links.map((l) => (
        <a
          key={l.name}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={LABEL[l.name]}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white/85 transition-all duration-200 hover:-translate-y-0.5 hover:border-white hover:text-white"
        >
          <Icon name={l.name} className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}
