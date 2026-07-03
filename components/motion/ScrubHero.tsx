"use client"

// Hero cinematográfico tipo Radian: sección de 250vh con bloque sticky.
// - Con video + heavyEnabled: el scroll hace seek del video (scrubbing).
// - Sin video (o si falla): zoom sutil de la imagen por scroll.
// - Con motion apagado: imagen estática. El contenido (children) SIEMPRE visible.

import { useRef, useState } from "react"
import Image from "next/image"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { useMotion } from "@/components/motion/MotionProvider"

export function ScrubHero({
  videoSrc,
  poster,
  posterAlt,
  children,
}: {
  videoSrc?: string
  poster: string
  posterAlt: string
  children: React.ReactNode
}) {
  const rootRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const { heavyEnabled } = useMotion()
  const useVideo = Boolean(videoSrc) && !videoFailed && heavyEnabled

  useGSAP(
    () => {
      if (!heavyEnabled || !rootRef.current) return

      if (useVideo && videoRef.current) {
        // PLACEHOLDER: video stock — sustituir por material real del cliente.
        const video = videoRef.current
        const st = ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            if (Number.isFinite(video.duration) && video.duration > 0) {
              video.currentTime = self.progress * video.duration
            }
          },
        })
        return () => st.kill()
      }

      // Modo imagen: zoom lento controlado por scroll (solo transform).
      if (mediaRef.current) {
        const tween = gsap.fromTo(
          mediaRef.current,
          { scale: 1 },
          {
            scale: 1.15,
            ease: "none",
            scrollTrigger: {
              trigger: rootRef.current,
              start: "top top",
              end: "bottom bottom",
              scrub: true,
            },
          },
        )
        return () => tween.scrollTrigger?.kill()
      }
    },
    { scope: rootRef, dependencies: [heavyEnabled, useVideo] },
  )

  return (
    <section ref={rootRef} className={`relative ${heavyEnabled ? "h-[250vh]" : "h-svh"} bg-ffr-navy`}>
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          {useVideo ? (
            <video
              ref={videoRef}
              src={videoSrc}
              poster={poster}
              muted
              playsInline
              preload="auto"
              onError={() => setVideoFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <Image src={poster} alt={posterAlt} fill priority className="object-cover" />
          )}
        </div>
        {/* Overlay navy para contraste AA del texto sobre el medio */}
        <div className="absolute inset-0 bg-gradient-to-b from-ffr-navy/60 via-ffr-navy/40 to-ffr-navy/70" />
        <div className="relative z-10 flex h-full items-center justify-center px-5">
          {children}
        </div>
      </div>
    </section>
  )
}
