export type IntegrationField = {
  name: string
  label: string
  type: "text" | "password"
  placeholder?: string
  help?: string
}

export type ChannelDef = {
  channel: string
  name: string
  description: string
  fields: IntegrationField[]
}

export const CHANNELS: ChannelDef[] = [
  {
    channel: "gmail",
    name: "Gmail",
    description: "Enviar y recibir correos desde tu cuenta de Gmail.",
    fields: [
      { name: "clientId", label: "Client ID", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "refreshToken", label: "Refresh Token", type: "password" },
      { name: "senderEmail", label: "Email remitente", type: "text", placeholder: "ventas@tudominio.com" },
    ],
  },
  {
    channel: "whatsapp",
    name: "WhatsApp",
    description: "Mensajería vía WhatsApp Business Cloud API.",
    fields: [
      { name: "phoneNumberId", label: "Phone Number ID", type: "text" },
      { name: "businessAccountId", label: "Business Account ID", type: "text" },
      { name: "accessToken", label: "Access Token", type: "password" },
      { name: "verifyToken", label: "Verify Token", type: "password" },
    ],
  },
  {
    channel: "instagram",
    name: "Instagram",
    description: "Mensajes directos y publicaciones de Instagram.",
    fields: [
      { name: "businessAccountId", label: "Business Account ID", type: "text" },
      { name: "accessToken", label: "Access Token", type: "password" },
    ],
  },
  {
    channel: "facebook",
    name: "Facebook",
    description: "Messenger y publicaciones de la página de Facebook.",
    fields: [
      { name: "pageId", label: "Page ID", type: "text" },
      { name: "appId", label: "App ID", type: "text" },
      { name: "appSecret", label: "App Secret", type: "password" },
      { name: "pageAccessToken", label: "Page Access Token", type: "password" },
    ],
  },
  {
    channel: "youtube",
    name: "YouTube",
    description: "Publicación y métricas de tu canal de YouTube.",
    fields: [
      { name: "clientId", label: "Client ID", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "channelId", label: "Channel ID", type: "text" },
      { name: "refreshToken", label: "Refresh Token", type: "password" },
    ],
  },
  {
    channel: "tiktok",
    name: "TikTok",
    description: "Publicación de vídeos y métricas de TikTok.",
    fields: [
      { name: "clientKey", label: "Client Key", type: "text" },
      { name: "clientSecret", label: "Client Secret", type: "password" },
      { name: "accessToken", label: "Access Token", type: "password" },
    ],
  },
]

export function getChannel(channel: string): ChannelDef | undefined {
  return CHANNELS.find((c) => c.channel === channel)
}
