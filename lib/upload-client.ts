"use client"

import { upload } from "@vercel/blob/client"

// Sube un archivo al Blob (público) organizándolo bajo `prefix/`.
// `prefix` ej.: `properties/<propertyId>` o `branding`.
export async function uploadImage(
  file: File,
  prefix: string,
): Promise<{ url: string; pathname: string }> {
  const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
  const result = await upload(`${prefix}/${cleanName}`, file, {
    access: "public",
    handleUploadUrl: "/api/blob/upload",
  })
  return { url: result.url, pathname: result.pathname }
}
