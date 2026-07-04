import { getSettings } from "@/lib/settings"

// Burbuja flotante de WhatsApp con mensaje predefinido. Usa el TELÉFONO del
// negocio guardado en admin → Configuración → General (clave "phone"); si tiene
// 10 dígitos se asume US y se antepone el 1. El mensaje también es configurable.

const DEFAULT_MESSAGE = "Hi! I'm interested in one of your listings. Could you share more details?"

export async function WhatsAppButton() {
  const settings = await getSettings()
  let number = (settings.phone ?? "").replace(/[^0-9]/g, "")
  if (number.length === 10) number = `1${number}` // US sin código de país
  if (number.length < 11) return null

  const message = settings.whatsappMessage?.trim() || DEFAULT_MESSAGE
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/25 transition-transform duration-200 hover:scale-110 focus-visible:scale-110"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-7 w-7">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.4-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.19-.24-.58-.49-.5-.67-.5-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.07 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.42-.08-.12-.27-.2-.57-.35zM12.05 21.79h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.85 9.85 0 01-1.51-5.26c0-5.45 4.44-9.88 9.9-9.88a9.83 9.83 0 016.99 2.9 9.82 9.82 0 012.9 7c0 5.45-4.44 9.87-9.9 9.87zm8.42-18.29A11.8 11.8 0 0012.05 0C5.5 0 .16 5.33.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.31-1.65a11.9 11.9 0 005.68 1.44h.01c6.55 0 11.89-5.33 11.89-11.89a11.82 11.82 0 00-3.48-8.4z" />
      </svg>
    </a>
  )
}
